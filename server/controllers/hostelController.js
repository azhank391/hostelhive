const {
  Hostel,
  User,
  TenantLocation,
  Room,
  Complaint,
  VisitorLog,
} = require("../models");
const { Op } = require("sequelize");

// ✅ Generate unique subdomain from hostel name
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

// ✅ Create Hostel (Owner only)
exports.createHostel = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { name, email, plan, country, city, address } = req.body;

    console.log("🏢 Creating hostel:", {
      ownerId,
      name,
      email,
      plan,
      country,
      city,
      address,
    });

    if (!name || !email || !plan) {
      return res
        .status(400)
        .json({ message: "Name, email, and plan are required" });
    }

    // Validate plan
    if (!["free", "pro", "enterprise"].includes(plan)) {
      return res
        .status(400)
        .json({ message: "Invalid plan. Must be free, pro, or enterprise" });
    }

    // Check if email already exists
    const existingEmail = await Hostel.findOne({ where: { email } });
    if (existingEmail) {
      console.log("❌ Email already exists:", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    // Auto-generate unique subdomain
    const subdomain = await generateUniqueSubdomain(name);
    console.log("🔗 Generated subdomain:", subdomain);

    // Create hostel with ownerId
    const hostel = await Hostel.create({
      name,
      email,
      subdomain,
      plan,
      isActive: true,
      isPaid: plan === "free" ? true : false, // Free plan is considered paid
      ownerId,
    });

    console.log("✅ Hostel created:", {
      id: hostel.id,
      name: hostel.name,
      subdomain: hostel.subdomain,
    });

    // Create location if provided
    if (country && city && address) {
      await TenantLocation.create({
        hostelId: hostel.id,
        country,
        city,
        address,
      });
      console.log("📍 Location created for hostel:", hostel.id);
    }

    // Update owner's hostelId
    await User.update({ hostelId: hostel.id }, { where: { id: ownerId } });
    console.log("👤 Updated owner hostelId:", { ownerId, hostelId: hostel.id });

    res.status(201).json({
      message: "Hostel created successfully",
      hostel: {
        ...hostel.toJSON(),
        subdomain, // Include the generated subdomain in response
      },
      ownerUpdated: true,
    });
  } catch (err) {
    console.error("❌ Error creating hostel:", err);
    if (err.message === "Unable to generate unique subdomain") {
      res
        .status(500)
        .json({
          message: "Failed to generate unique subdomain. Please try again.",
        });
    } else {
      res.status(500).json({ message: "Failed to create hostel" });
    }
  }
};

// ✅ Get Hostel Details (Owner or Warden)
exports.getHostelDetails = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const hostel = await Hostel.findByPk(hostelId, {
      include: [
        {
          model: TenantLocation,
          as: "location",
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

// ✅ Get Owner's Hostels (Owner only)
exports.getOwnerHostels = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const hostels = await Hostel.findAll({
      where: { ownerId },
      include: [
        {
          model: TenantLocation,
          as: "location",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ hostels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hostels" });
  }
};

// ✅ Update Hostel (Owner only)
exports.updateHostel = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { name, email, country, city, address } = req.body;

    const hostel = await Hostel.findByPk(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if new email conflicts with existing
    if (email && email !== hostel.email) {
      const existingEmail = await Hostel.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // Update hostel
    await hostel.update({
      name: name || hostel.name,
      email: email || hostel.email,
    });

    // Update or create location
    if (country || city || address) {
      const [location] = await TenantLocation.findOrCreate({
        where: { hostelId },
        defaults: { country: "", city: "", address: "" },
      });

      await location.update({
        country: country || location.country,
        city: city || location.city,
        address: address || location.address,
      });
    }

    res.json({ message: "Hostel updated successfully", hostel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update hostel" });
  }
};

// ✅ Get Student's Hostel (Student only)
exports.getStudentHostel = async (req, res) => {
  try {
    const studentId = req.user.id;
    const hostelId = req.user.hostelId;

    if (!hostelId) {
      return res
        .status(400)
        .json({ message: "No hostel associated with this student account" });
    }

    const hostel = await Hostel.findByPk(hostelId, {
      include: [
        {
          model: TenantLocation,
          as: "location",
        },
      ],
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Verify the student belongs to this hostel
    if (hostel.id !== hostelId) {
      return res
        .status(403)
        .json({ message: "Access denied: You can only view your own hostel" });
    }

    res.json(hostel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hostel details" });
  }
};

// ✅ Get Warden's Hostel (Warden only)
exports.getWardenHostel = async (req, res) => {
  try {
    const wardenId = req.user.id;

    // Use existing User.hostelId relationship instead of separate assignment table
    const warden = await User.findByPk(wardenId, {
      include: [
        {
          model: Hostel,
          as: "hostel",
          include: [
            {
              model: TenantLocation,
              as: "location",
            },
          ],
        },
      ],
    });

    if (!warden || !warden.hostelId) {
      return res
        .status(404)
        .json({ message: "No hostel assignment found for this warden" });
    }

    if (!warden.hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    res.json(warden.hostel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch warden hostel details" });
  }
};

// ✅ Get All Hostel Stats for Owner (Owner only)
exports.getAllHostelStats = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Get all hostels owned by this user
    const hostels = await Hostel.findAll({
      where: { ownerId },
      attributes: ["id", "name"],
    });

    if (hostels.length === 0) {
      return res.json({ hostelStats: {} });
    }

    // Get stats for each hostel
    const hostelStats = {};

    for (const hostel of hostels) {
      const hostelId = hostel.id;

      // Get counts for this specific hostel
      const totalStudents = await User.count({
        where: { hostelId, role: "student" },
      });
      const totalRooms = await Room.count({ where: { hostelId } });
      const occupiedRooms = await Room.count({
        where: { hostelId, occupied: { [Op.gt]: 0 } },
      });

      hostelStats[hostelId] = {
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
      };
    }

    res.json({ hostelStats });
  } catch (err) {
    console.error("Error in getAllHostelStats:", err);
    res.status(500).json({ message: "Failed to fetch hostel stats" });
  }
};

// 🚀 NEW: URL-Based Architecture Methods

// Get user's accessible hostels (for hostel selection)
exports.getUserHostels = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let hostels = [];

    switch (userRole) {
      case "owner":
        // Owner gets all their hostels
        hostels = await Hostel.findAll({
          where: { ownerId: userId },
          include: [
            {
              model: TenantLocation,
              as: "location",
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        break;

      case "warden":
      case "student":
        // Warden/Student get their assigned hostel
        if (req.user.hostelId) {
          const hostel = await Hostel.findByPk(req.user.hostelId, {
            include: [
              {
                model: TenantLocation,
                as: "location",
              },
            ],
          });
          if (hostel) hostels = [hostel];
        }
        break;

      case "superadmin":
        // Superadmin gets all hostels
        hostels = await Hostel.findAll({
          include: [
            {
              model: TenantLocation,
              as: "location",
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        break;

      default:
        return res.status(403).json({ error: "Invalid user role" });
    }

    res.json({ hostels, userRole });
  } catch (error) {
    console.error("Error in getUserHostels:", error);
    res.status(500).json({ error: "Failed to fetch user hostels" });
  }
};

// Get hostel dashboard metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Get hostel stats
    const totalStudents = await User.count({
      where: { hostelId, role: "student" },
    });

    const totalRooms = await Room.count({ where: { hostelId } });
    const occupiedRooms = await Room.count({
      where: { hostelId, occupied: { [Op.gt]: 0 } },
    });

    // Get recent complaints
    const complaints = await Complaint.findAll({
      where: { hostelId },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "reportedBy", attributes: ["id", "name"] },
        { model: Room, as: "room", attributes: ["id", "number"] },
      ],
    });

    const totalComplaints = await Complaint.count({ where: { hostelId } });
    const pendingComplaints = await Complaint.count({
      where: { hostelId, status: "pending" },
    });

    res.json({
      stats: {
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        totalComplaints,
        pendingComplaints,
      },
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalComplaints,
        pages: Math.ceil(totalComplaints / limit),
      },
    });
  } catch (error) {
    console.error("Error in getDashboardMetrics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};

// Get hostel visitors
exports.getVisitors = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { hostelId };
    if (status) whereClause.status = status;

    const visitors = await VisitorLog.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "visitor", attributes: ["id", "name", "email"] },
        { model: User, as: "host", attributes: ["id", "name"] },
        { model: Room, as: "room", attributes: ["id", "number"] },
      ],
    });

    const total = await VisitorLog.count({ where: whereClause });

    res.json({
      visitors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getVisitors:", error);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
};

// Get hostel students
exports.getStudents = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { hostelId, role: "student" };
    if (status) whereClause.status = status;

    const students = await User.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
      attributes: ["id", "name", "email", "status", "createdAt"],
      include: [{ model: Room, as: "room", attributes: ["id", "number"] }],
    });

    const total = await User.count({ where: whereClause });

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getStudents:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

// Get hostel complaints
exports.getComplaints = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { page = 1, limit = 10, status, priority } = req.query;

    const whereClause = { hostelId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const complaints = await Complaint.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "reportedBy", attributes: ["id", "name"] },
        { model: Room, as: "room", attributes: ["id", "number"] },
      ],
    });

    const total = await Complaint.count({ where: whereClause });

    res.json({
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getComplaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

// Get hostel rooms
exports.getRooms = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { hostelId };
    if (status) whereClause.status = status;

    const rooms = await Room.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["number", "ASC"]],
      include: [{ model: User, as: "student", attributes: ["id", "name"] }],
    });

    const total = await Room.count({ where: whereClause });

    res.json({
      rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getRooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
};
