const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

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

    // Note: We allow login with default password but will prompt for change later
    if (user.requiresPasswordChange && password === '123456') {
      console.log("User logged in with default password, will prompt for change");
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
        requiresPasswordChange: user.requiresPasswordChange,
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
        requiresPasswordChange: user.requiresPasswordChange,
      });
    } else {
      // Warden/Student - they have a specific hostelId
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          role: user.role,
          hostelId: user.hostelId,
          requiresPasswordChange: user.requiresPasswordChange,
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
        requiresPasswordChange: user.requiresPasswordChange,
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
      const { Hostel, TenantLocation } = require("../models");
      hostels = await Hostel.findAll({
        where: { ownerId: userId, isActive: true },
        attributes: [
          "id",
          "name",
          "subdomain",
          "plan",
          "isActive",
          "email",
          "createdAt",
        ],
        include: [
          {
            model: TenantLocation,
            as: "location",
            attributes: ["country", "city", "address"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } else if (userRole === "warden") {
      // Warden gets their assigned hostel
      const { User, Hostel, TenantLocation } = require("../models");
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
              "email",
              "createdAt",
            ],
            include: [
              {
                model: TenantLocation,
                as: "location",
                attributes: ["country", "city", "address"],
              },
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

// ✅ Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Name and email are required' 
      });
    }

    // Check if email is already taken by another user
    // For owners, we don't check hostelId since they can manage multiple hostels
    const whereClause = req.user.role === 'owner' 
      ? { email, id: { [Op.ne]: userId } }
      : { email, hostelId: req.user.hostelId, id: { [Op.ne]: userId } };
    
    const existingUser = await User.findOne({ where: whereClause });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: req.user.role === 'owner' 
          ? 'Email is already taken by another user' 
          : 'Email is already taken by another user in this hostel' 
      });
    }

    // Update user profile
    await User.update(
      { name, email, phone },
      { where: { id: userId } }
    );

    res.json({ 
      success: true,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update profile' 
    });
  }
};

// ✅ Change User Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Prevent using the default password
    if (newPassword === '123456') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot use the default password (123456)' 
      });
    }

    // Get current user to verify current password
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and set requiresPasswordChange to false
    await User.update(
      { 
        password: hashedPassword, 
        requiresPasswordChange: false 
      },
      { where: { id: userId } }
    );

    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to change password' 
    });
  }
};
