const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ✅ Register New Owner (Public endpoint)
exports.registerOwner = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newOwner = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "owner", // Fixed role for owners
      hostelId: null, // Will be set when they create a hostel
    });

    res.status(201).json({
      message: "Owner registered successfully",
      userId: newOwner.id,
      name: newOwner.name,
      role: "owner",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ✅ Register New User (Private endpoint - requires JWT)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hostelId = req.user.hostelId;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are required",
      });
    }

    // Validate role - only students and wardens can be created
    if (!["student", "warden"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Only students and wardens can be created",
      });
    }

    // Only owners can create wardens
    if (role === "warden" && req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owners can create wardens",
      });
    }

    // Check if email already exists WITHIN THE SAME HOSTEL (not globally)
    const existingUser = await User.findOne({
      where: { email, hostelId },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists in this hostel",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      hostelId,
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.id,
      name: newUser.name,
      role: newUser.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ✅ Login Existing User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    console.log("Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Build where clause - if accessing via subdomain, scope to that hostel
    const whereClause = { email };

    const user = await User.findOne({ where: whereClause });
    console.log(
      "User found:",
      user
        ? { id: user.id, role: user.role, hostelId: user.hostelId }
        : "Not found"
    );

    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // If accessed via subdomain, verify user belongs to that hostel
    // (except for owners who may own multiple hostels)
    if (
      req.hostelId &&
      user.role !== "owner" &&
      user.hostelId !== req.hostelId
    ) {
      console.log("User does not belong to this hostel");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Login successful for user:", user.id);

    if (user.role === "owner") {
      // Get all hostels owned by this user
      const { Hostel } = require("../models");
      const ownedHostels = await Hostel.findAll({
        where: { ownerId: user.id, isActive: true },
        attributes: ["id", "name", "subdomain", "plan"],
      });

      // Determine if hostel selection is needed
      const needsHostelSelection = ownedHostels.length > 1;

      // If only one hostel, auto-select it
      let selectedHostelId = null;
      if (ownedHostels.length === 1) {
        selectedHostelId = ownedHostels[0].id;
      }

      const tokenPayload = {
        id: user.id,
        name: user.name,
        role: user.role,
        hostelId: selectedHostelId, // Set hostelId if only one hostel
        ownedHostels: ownedHostels.map((h) => ({
          id: h.id,
          name: h.name,
          subdomain: h.subdomain,
        })),
      };

      console.log("🔍 DEBUG: Creating JWT token with payload:", tokenPayload);

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.json({
        message: "Login successful",
        token,
        role: user.role,
        name: user.name,
        hostelId: selectedHostelId, // Include hostelId in response
        ownedHostels, // Frontend will show hostel selection if needed
        needsHostelSelection,
      });
    } else {
      // Warden/Student - they have a specific hostelId
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          role: user.role,
          hostelId: user.hostelId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful",
        token,
        role: user.role,
        name: user.name,
        hostelId: user.hostelId,
        needsHostelSelection: false,
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// ✅ Get Current User Data
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "role", "hostelId"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

// ✅ Get User's Available Hostels
exports.getUserHostels = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let hostels = [];

    if (userRole === "owner") {
      // Owner gets all hostels they own
      const { Hostel } = require("../models");
      hostels = await Hostel.findAll({
        where: { ownerId: userId, isActive: true },
        attributes: [
          "id",
          "name",
          "subdomain",
          "plan",
          "isActive",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
      });
    } else if (userRole === "warden") {
      // Warden gets their assigned hostel
      const { User, Hostel } = require("../models");
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Hostel,
            as: "hostel",
            attributes: [
              "id",
              "name",
              "subdomain",
              "plan",
              "isActive",
              "createdAt",
            ],
          },
        ],
      });

      if (user && user.hostel) {
        hostels = [user.hostel];
      }
    }

    res.json({ hostels });
  } catch (error) {
    console.error("Error fetching user hostels:", error);
    res.status(500).json({ message: "Failed to fetch hostels" });
  }
};

// ✅ Set Active Hostel for Owner
exports.setActiveHostel = async (req, res) => {
  try {
    const { hostelId } = req.body;
    const userId = req.user.id;

    if (req.user.role === "owner") {
      // Verify owner owns this hostel
      const { Hostel } = require("../models");
      const hostel = await Hostel.findOne({
        where: { id: hostelId, ownerId: userId, isActive: true },
      });

      if (!hostel) {
        return res
          .status(403)
          .json({ message: "Access denied to this hostel" });
      }

      // Generate new token with selected hostelId
      const newToken = jwt.sign(
        {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role,
          hostelId: hostelId, // Now set the active hostel
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Hostel selected successfully",
        token: newToken,
        hostel: {
          id: hostel.id,
          name: hostel.name,
          subdomain: hostel.subdomain,
        },
      });
    } else {
      res.status(400).json({ message: "Only owners can switch hostels" });
    }
  } catch (error) {
    console.error("Error setting active hostel:", error);
    res.status(500).json({ message: "Failed to set active hostel" });
  }
};
