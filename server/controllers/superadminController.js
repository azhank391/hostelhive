const { Superadmin } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const {
  Hostel,
  User,
  Room,
  RoomAllocation,
  Complaint,
  TenantLocation,
  sequelize,
} = require("../models");

// ✅ Superadmin Login
exports.loginSuperadmin = async (req, res) => {
  console.log("🔍 DEBUG: Superadmin login request received");
  console.log("🔍 DEBUG: Request headers:", req.headers);
  console.log("🔍 DEBUG: Request body:", req.body);
  console.log("🔍 DEBUG: Request body type:", typeof req.body);
  console.log("🔍 DEBUG: Content-Type header:", req.headers["content-type"]);

  const { email, password } = req.body;

  try {
    const superadmin = await Superadmin.findOne({ where: { email } });
    if (!superadmin) {
      return res.status(404).json({ message: "Superadmin not found" });
    }

    const isMatch = await bcrypt.compare(password, superadmin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: superadmin.id, role: superadmin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      superadmin: { name: superadmin.name, email: superadmin.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Dashboard Data
exports.getDashboardData = async (req, res) => {
  try {
    const totalHostels = await Hostel.count();

    // Get paying owners (real users who generate revenue)
    const payingOwners = await User.count({
      where: {
        role: "owner",
        // You can add additional conditions here if needed
      },
    });

    // Get total rooms across all hostels
    const totalRooms = await Room.count();

    const paidHostels = await Hostel.count({ where: { isPaid: true } });
    const unpaidHostels = await Hostel.count({ where: { isPaid: false } });

    const complaintsPending = await Complaint.count({
      where: { status: "pending" },
    });
    const complaintsResolved = await Complaint.count({
      where: { status: "resolved" },
    });

    // Plan Distribution with revenue calculation
    // TODO: Update metrics to use plan_id after legacy plan removal
    const plans = await Hostel.findAll({
      attributes: [
        "plan_id",
        [sequelize.fn("COUNT", sequelize.col("plan_id")), "count"],
      ],
      group: ["plan_id"],
    });

    // Calculate revenue metrics
    const planRevenue = {
      free: 0,
      basic: 29,
      premium: 49,
      enterprise: 99,
    };

    const totalMonthlyRevenue = plans.reduce((total, plan) => {
      const planName = plan.plan_id;
      const count = parseInt(plan.count);
      const revenue = planRevenue[planName] || 0;
      return total + count * revenue;
    }, 0);

    // Hostel regional distribution by country
    const regions = await TenantLocation.findAll({
      attributes: [
        "country",
        [sequelize.fn("COUNT", sequelize.col("country")), "count"],
      ],
      group: ["country"],
    });

    res.status(200).json({
      metrics: {
        totalHostels,
        payingOwners, // Real users who pay
        totalRooms,
        paidHostels,
        unpaidHostels,
        totalMonthlyRevenue,
        complaints: {
          pending: complaintsPending,
          resolved: complaintsResolved,
        },
        planDistribution: plans,
        regionalDistribution: regions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

// ✅ Register New Hostel
exports.registerHostel = async (req, res) => {
  try {
    const { name, email, subdomain, plan_id, country, city, address } =
      req.body;

    if (!name || !email || !subdomain) {
      return res
        .status(400)
        .json({ message: "Name, email, and subdomain are required" });
    }

    // Check if subdomain already exists
    const existingHostel = await Hostel.findOne({ where: { subdomain } });
    if (existingHostel) {
      return res.status(400).json({ message: "Subdomain already exists" });
    }

    // Check if email already exists
    const existingEmail = await Hostel.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create hostel
    const hostel = await Hostel.create({
      name,
      email,
      subdomain,
      // Legacy `plan` deprecated; use plan_id which will be finalized by billing flow/webhooks
      plan_id: plan_id || "basic",
      isActive: true,
      isPaid: false,
    });

    // Create location if provided
    if (country && city && address) {
      await TenantLocation.create({
        hostelId: hostel.id,
        country,
        city,
        address,
      });
    }

    res.status(201).json({ message: "Hostel registered successfully", hostel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to register hostel" });
  }
};

// ✅ Get All Hostels
exports.getAllHostels = async (req, res) => {
  try {
    const { page = 1, limit = 10, plan, plan_id, isActive, isPaid } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (plan_id) whereClause.plan_id = plan_id;
    // Backward-compat: support legacy `plan` filter if present
    if (!plan_id && plan) whereClause.plan_id = plan;
    if (isActive !== undefined) whereClause.isActive = isActive === "true";
    if (isPaid !== undefined) whereClause.isPaid = isPaid === "true";

    const hostels = await Hostel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TenantLocation,
          as: "location",
          attributes: ["country", "city"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    // Get user counts separately for MySQL compatibility
    const hostelsWithUserCounts = await Promise.all(
      hostels.rows.map(async (hostel) => {
        const userCount = await User.count({ where: { hostelId: hostel.id } });
        return {
          ...hostel.toJSON(),
          userCount,
        };
      })
    );

    res.json({
      hostels: hostelsWithUserCounts,
      total: hostels.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(hostels.count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hostels" });
  }
};

// ✅ Get Hostel Details
exports.getHostelDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const hostel = await Hostel.findByPk(id, {
      include: [
        {
          model: TenantLocation,
          as: "location",
        },
        {
          model: User,
          as: "users",
          attributes: { exclude: ["password"] },
        },
        {
          model: Room,
          as: "rooms",
        },
        {
          model: Complaint,
          as: "complaints",
          include: [{ model: User, as: "user", attributes: ["name"] }],
        },
      ],
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    res.json(hostel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hostel details" });
  }
};

// (Legacy Update Hostel Plan removed) – plans are managed via Stripe billing; use plan_id + webhooks.

// ✅ Update Hostel Status (Suspend/Reactivate)
exports.updateHostelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const hostel = await Hostel.findByPk(id);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    await hostel.update({ isActive });

    const action = isActive ? "reactivated" : "suspended";
    res.json({ message: `Hostel ${action} successfully`, hostel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update hostel status" });
  }
};

// ✅ Update Billing Status
exports.updateBillingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    if (typeof isPaid !== "boolean") {
      return res.status(400).json({ message: "isPaid must be a boolean" });
    }

    const hostel = await Hostel.findByPk(id);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    await hostel.update({ isPaid });

    const action = isPaid ? "marked as paid" : "marked as unpaid";
    res.json({ message: `Hostel ${action} successfully`, hostel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update billing status" });
  }
};

// ✅ Delete Hostel
exports.deleteHostel = async (req, res) => {
  try {
    const { id } = req.params;

    const hostel = await Hostel.findByPk(id);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if hostel has active users
    const activeUsers = await User.count({ where: { hostelId: id } });
    if (activeUsers > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete hostel with active users" });
    }

    await hostel.destroy();
    res.json({ message: "Hostel deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete hostel" });
  }
};

// ✅ Get Hostels by Region
exports.getHostelsByRegion = async (req, res) => {
  try {
    const { country } = req.query;

    const whereClause = {};
    if (country) {
      whereClause.country = country;
    }

    const regions = await TenantLocation.findAll({
      where: whereClause,
      include: [
        {
          model: Hostel,
          as: "hostel",
          attributes: [
            "id",
            "name",
            "subdomain",
            "plan_id",
            "isActive",
            "isPaid",
          ],
        },
      ],
      order: [
        ["country", "ASC"],
        ["city", "ASC"],
      ],
    });

    res.json(regions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hostels by region" });
  }
};

// ✅ Get Billing Overview
exports.getBillingOverview = async (req, res) => {
  try {
    const paidHostels = await Hostel.count({ where: { isPaid: true } });
    const unpaidHostels = await Hostel.count({ where: { isPaid: false } });

    const planBreakdown = await Hostel.findAll({
      attributes: [
        "plan_id",
        "isPaid",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["plan_id", "isPaid"],
    });

    const recentPayments = await Hostel.findAll({
      where: { isPaid: true },
      attributes: ["id", "name", "plan_id", "updatedAt"],
      order: [["updatedAt", "DESC"]],
      limit: 10,
    });

    res.json({
      summary: {
        paidHostels,
        unpaidHostels,
        totalHostels: paidHostels + unpaidHostels,
      },
      planBreakdown,
      recentPayments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch billing overview" });
  }
};

// ✅ Create Owner + Optional Hostel
exports.createOwner = async (req, res) => {
  try {
    const { name, email, password, hostelData } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the owner system role
    const { Role } = require("../models");
    const ownerRole = await Role.findOne({
      where: { name: "owner", isSystemRole: true },
    });

    if (!ownerRole) {
      console.error("❌ Owner system role not found in database");
      return res.status(500).json({ message: "System configuration error" });
    }

    // Create owner
    const owner = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "owner",
      roleId: ownerRole.id, // Set the RBAC role ID
      hostelId: null,
    });

    let hostel = null;
    let location = null;

    // Create hostel if provided
    if (hostelData) {
      const { name: hostelName, plan_id, country, city, address } = hostelData;

      if (!hostelName) {
        return res.status(400).json({ message: "Hostel name is required" });
      }

      // Auto-generate unique subdomain
      const generateUniqueSubdomain = async (hostelName) => {
        let counter = 1;
        let baseSubdomain = hostelName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") // Remove special characters and spaces
          .substring(0, 20); // Limit length

        // Ensure base subdomain is not empty
        if (!baseSubdomain) {
          baseSubdomain = "hostel";
        }

        while (true) {
          const subdomain =
            counter === 1 ? baseSubdomain : `${baseSubdomain}${counter}`;
          const existing = await Hostel.findOne({ where: { subdomain } });

          if (!existing) {
            return subdomain;
          }
          counter++;

          // Prevent infinite loop (max 999 attempts)
          if (counter > 999) {
            throw new Error("Unable to generate unique subdomain");
          }
        }
      };

      const subdomain = await generateUniqueSubdomain(hostelName);

      // Create hostel
      // Default to trialing/basic if plan_id not provided
      const TRIAL_DAYS = 14;
      const now = new Date();
      const trialEnd = new Date(
        now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
      );
      hostel = await Hostel.create({
        name: hostelName,
        email,
        subdomain,
        plan_id: plan_id || "basic",
        subscription_status: "trialing",
        trial_end: trialEnd,
        isActive: true,
        isPaid: false,
        ownerId: owner.id,
      });

      // Create location if provided
      if (country && city && address) {
        location = await TenantLocation.create({
          hostelId: hostel.id,
          country,
          city,
          address,
        });
      }

      // Update owner's hostelId
      await owner.update({ hostelId: hostel.id });
    }

    const { password: _, ...ownerData } = owner.toJSON();
    res.status(201).json({
      message: "Owner created successfully",
      owner: ownerData,
      hostel,
      location,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create owner" });
  }
};

// ✅ Get All Students for a Specific Hostel
exports.getHostelStudents = async (req, res) => {
  try {
    const { id: hostelId } = req.params;

    // Verify hostel exists
    const hostel = await Hostel.findByPk(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const students = await User.findAll({
      where: { hostelId, role: "student" },
      include: [
        {
          model: RoomAllocation,
          as: "allocations",
          where: { status: "active" },
          required: false,
          include: [
            { model: Room, as: "room", attributes: ["roomNumber", "block"] },
          ],
        },
      ],
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
    });

    res.json({
      hostel: {
        id: hostel?.id,
        name: hostel?.name,
        subdomain: hostel?.subdomain,
        plan_id: hostel?.plan_id,
      },
      students,
      totalStudents: students.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hostel students" });
  }
};
