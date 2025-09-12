const {
  User,
  Hostel,
  Room,
  Complaint,
  RoomAllocation,
  VisitorLog,
} = require("../models");

// ✅ Get Student's Room Details
exports.getMyRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;

    const allocation = await RoomAllocation.findOne({
      where: { userId, status: "active" },
      include: [
        { 
          model: Room, 
          as: "room",
          attributes: ["id", "roomNumber", "block", "capacity", "occupied"]
        },
        { model: User, as: "user", attributes: ["name", "email"] },
      ],
    });

    // 🚀 NEW: Return proper response even when no allocation exists
    if (!allocation) {
      return res.json({
        room: null,
        allocation: null,
        status: "no_allocation",
        message: "No room allocation found. Please contact the hostel administration for room assignment."
      });
    }

    res.json({
      room: allocation.room,
      allocation: {
        id: allocation.id,
        allocationDate: allocation.allocationDate,
        status: allocation.status,
      },
      status: "allocated"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch room details" });
  }
};

// ✅ Get Student's Profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;

    const student = await User.findOne({
      where: { id: userId, hostelId, role: "student" },
      attributes: { exclude: ["password"] },
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
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ✅ Update Student Profile
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;
    const { name, email } = req.body;

    const student = await User.findOne({
      where: { id: userId, hostelId, role: "student" },
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if new email conflicts with existing WITHIN THE SAME HOSTEL
    if (email && email !== student.email) {
      const existingUser = await User.findOne({ where: { email, hostelId } });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email already registered in this hostel" });
      }
    }

    await student.update({
      name: name || student.name,
      email: email || student.email,
    });

    const { password: _, ...studentData } = student.toJSON();
    res.json({ message: "Profile updated successfully", student: studentData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ✅ Lodge a Complaint
exports.lodgeComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    // Check if student has a room allocated
    const allocation = await RoomAllocation.findOne({
      where: { userId, status: "active" },
    });

    if (!allocation) {
      return res.status(403).json({
        message:
          "You must have a room allocated before you can lodge complaints. Please contact your hostel administrator.",
      });
    }

    const complaint = await Complaint.create({
      hostelId,
      userId,
      title,
      description,
      status: "pending",
      priority: "Medium", // Default priority
    });

    res
      .status(201)
      .json({ message: "Complaint lodged successfully", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to lodge complaint" });
  }
};

// ✅ Get Student's Complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;
    const { status } = req.query;

    const whereClause = { userId, hostelId };
    if (status) {
      whereClause.status = status;
    }

    // Get hostel info for the response
    const hostel = await Hostel.findByPk(hostelId, {
      attributes: ["id", "name"],
    });
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const complaints = await Complaint.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    // Transform data to match frontend expectations
    const formattedComplaints = complaints.map((complaint) => {
      return {
        id: complaint.id,
        title: complaint.title,
        description: complaint.description,
        status:
          complaint.status === "pending"
            ? "Open"
            : complaint.status === "in_progress"
            ? "In Progress"
            : complaint.status === "resolved"
            ? "Resolved"
            : complaint.status === "closed"
            ? "Closed"
            : "Open",
        priority: complaint.priority || "Medium",
        reportedBy: {
          name: req.user.name,
          role: req.user.role,
          image: null,
        },
        hostel: {
          id: hostel.id,
          name: hostel.name,
        },
        room: null, // Will be populated if needed
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
      };
    });

    res.json({ complaints: formattedComplaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

// ✅ Get Student's Single Complaint by ID
exports.getMyComplaintById = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;
    const { id } = req.params;

    const complaint = await Complaint.findOne({
      where: { id, userId, hostelId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
    });

    // Get room allocation for the student
    const roomAllocation = await RoomAllocation.findOne({
      where: { userId, hostelId, status: "active" },
      include: [
        {
          model: Room,
          as: "room",
          attributes: ["roomNumber", "block"],
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Get hostel info for the response
    const hostel = await Hostel.findByPk(hostelId, {
      attributes: ["id", "name"],
    });

    // Transform data to match frontend expectations
    const formattedComplaint = {
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      status:
        complaint.status === "pending"
          ? "Open"
          : complaint.status === "in_progress"
          ? "In Progress"
          : complaint.status === "resolved"
          ? "Resolved"
          : complaint.status === "closed"
          ? "Closed"
          : "Open",
      priority: complaint.priority || "Medium",
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      resolvedAt: complaint.resolvedAt,
      resolution: complaint.resolution,
      resolutionNotes: complaint.resolutionNotes,
      user: {
        name: complaint.user.name,
        email: complaint.user.email,
      },
      hostel: {
        id: hostel.id,
        name: hostel.name,
      },
      room: roomAllocation?.room ? {
        roomNumber: roomAllocation.room.roomNumber,
        block: roomAllocation.room.block,
      } : null,
    };

    res.json(formattedComplaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch complaint details" });
  }
};

// ✅ Get Student's Visitor Logs
exports.getMyVisitorLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;

    const logs = await VisitorLog.findAll({
      where: { studentId: userId, hostelId },
      include: [
        {
          model: Hostel,
          as: "hostel",
          attributes: ["id", "name"],
        },
      ],
      order: [["checkIn", "DESC"]],
    });

    // Enhance logs with room allocation information
    const enhancedLogs = await Promise.all(
      logs.map(async (log) => {
        const logData = log.toJSON();

        // Get room allocation for the student
        const roomAllocation = await RoomAllocation.findOne({
          where: {
            userId,
            hostelId,
            status: "active",
          },
          include: [
            {
              model: Room,
              as: "room",
              attributes: ["id", "roomNumber", "block"],
            },
          ],
        });

        if (roomAllocation && roomAllocation.room) {
          logData.student = {
            ...logData.student,
            room: roomAllocation.room.roomNumber,
            block: roomAllocation.room.block,
          };
        }

        return logData;
      })
    );

    res.json(enhancedLogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch visitor logs" });
  }
};

// ✅ Create Visitor Log (Student can log their own visitors)
exports.createMyVisitorLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;
    const { visitorName, relation } = req.body;

    if (!visitorName || !relation) {
      return res
        .status(400)
        .json({ message: "Visitor name and relation are required" });
    }

    // Enhanced validation
    if (visitorName.trim().length < 2 || visitorName.trim().length > 50) {
      return res
        .status(400)
        .json({ message: "Visitor name must be between 2 and 50 characters" });
    }

    if (relation.trim().length < 2 || relation.trim().length > 30) {
      return res
        .status(400)
        .json({ message: "Relation must be between 2 and 30 characters" });
    }

    // Check if student has a room allocated
    const allocation = await RoomAllocation.findOne({
      where: { userId, hostelId, status: "active" },
    });

    if (!allocation) {
      return res.status(403).json({
        message:
          "You must have a room allocated before you can register visitors. Please contact your hostel administrator.",
      });
    }

    const log = await VisitorLog.create({
      hostelId,
      studentId: userId,
      visitorName: visitorName.trim(),
      relation: relation.trim(),
      checkIn: new Date(),
    });

    res.status(201).json({ message: "Visitor logged in successfully", log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create visitor log" });
  }
};

// ✅ Update student's own visitor log
exports.updateMyVisitorLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, hostelId } = req.user;
    const { visitorName, relation } = req.body;
    console.log("Updating visitor log:", { id, userId, hostelId, visitorName, relation });
    const log = await VisitorLog.findOne({
      where: { id, studentId: userId, hostelId },
    });
    if (!log) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    // Check time restrictions (24 hours)
    const hoursSinceCreation = (Date.now() - log.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(403).json({
        message: "Can only edit logs within 24 hours",
      });
    }

    // Cannot edit if visitor is already checked out
    if (log.checkOut) {
      return res.status(400).json({
        message: "Cannot edit visitor log after checkout",
      });
    }

    // Update the log
    await log.update({
      visitorName: visitorName || log.visitorName,
      relation: relation || log.relation,
    });

    res.json({
      message: "Visitor log updated successfully",
      log,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update visitor log" });
  }
};

// ✅ Delete student's own visitor log
exports.deleteMyVisitorLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, hostelId } = req.user;

    const log = await VisitorLog.findOne({
      where: { id, studentId: userId, hostelId },
    });
    if (!log) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    // Check time restrictions (24 hours)
    const hoursSinceCreation = (Date.now() - log.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(403).json({
        message: "Can only delete logs within 24 hours",
      });
    }

    // Cannot delete if visitor is already checked out
    if (log.checkOut) {
      return res.status(400).json({
        message: "Cannot delete visitor log after checkout",
      });
    }

    await log.destroy();
    res.json({ message: "Visitor log deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete visitor log" });
  }
};

// ✅ Checkout visitor (Student can checkout their own visitors)
exports.checkoutMyVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, hostelId } = req.user;

    const log = await VisitorLog.findOne({
      where: { id, studentId: userId, hostelId },
    });
    if (!log) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    // Cannot checkout if already checked out
    if (log.checkOut) {
      return res.status(400).json({ message: "Visitor already checked out" });
    }

    // Students can only checkout their own visitors
    if (log.studentId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only checkout your own visitors" });
    }

    await log.update({ checkOut: new Date() });

    res.json({
      message: "Visitor checked out successfully",
      log,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to checkout visitor" });
  }
};

// ✅ Get Student Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;

    // Get room allocation with full room details
    const allocation = await RoomAllocation.findOne({
      where: { userId, status: "active" },
      include: [
        { 
          model: Room, 
          as: "room", 
          attributes: ["roomNumber", "block", "capacity", "occupied"] 
        },
      ],
    });

    // Get complaint counts
    const totalComplaints = await Complaint.count({
      where: { userId, hostelId },
    });
    const pendingComplaints = await Complaint.count({
      where: { userId, hostelId, status: "pending" },
    });
    const resolvedComplaints = await Complaint.count({
      where: { userId, hostelId, status: "resolved" },
    });

    // Get recent complaints
    const recentComplaints = await Complaint.findAll({
      where: { userId, hostelId },
      order: [["createdAt", "DESC"]],
      limit: 3,
    });

    // Get today's visitors
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysVisitors = await VisitorLog.count({
      where: {
        studentId: userId,
        hostelId,
        checkIn: {
          [require("sequelize").Op.gte]: today,
          [require("sequelize").Op.lt]: tomorrow,
        },
      },
    });

    res.json({
      room: allocation ? allocation.room : null,
      roomAllocation: allocation ? {
        id: allocation.id,
        allocationDate: allocation.allocationDate,
        status: allocation.status,
      } : null,
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        resolved: resolvedComplaints,
        recent: recentComplaints,
      },
      todaysVisitors,
      hasRoom: !!allocation,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
};

// ✅ Update My Complaint (Student can update their own complaints)
exports.updateMyComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;
    const complaintId = req.params.id;
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    // Find the complaint and verify ownership
    const complaint = await Complaint.findOne({
      where: { id: complaintId, userId, hostelId },
    });

    if (!complaint) {
      return res
        .status(404)
        .json({
          message: "Complaint not found or you do not have access to it",
        });
    }

    // Only allow updates if complaint is not resolved or closed
    if (complaint.status === "resolved" || complaint.status === "closed") {
      return res
        .status(403)
        .json({ message: "Cannot update resolved or closed complaints" });
    }

    // Update the complaint
    await complaint.update({
      title,
      description,
      updatedAt: new Date(),
    });

    res.json({ message: "Complaint updated successfully", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update complaint" });
  }
};

// ✅ Delete My Complaint (Student can delete their own complaints)
exports.deleteMyComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const hostelId = req.user.hostelId;
    const complaintId = req.params.id;

    // Find the complaint and verify ownership
    const complaint = await Complaint.findOne({
      where: { id: complaintId, userId, hostelId },
    });

    if (!complaint) {
      return res
        .status(404)
        .json({
          message: "Complaint not found or you do not have access to it",
        });
    }

    // Only allow deletion if complaint is not resolved or closed
    if (complaint.status === "resolved" || complaint.status === "closed") {
      return res
        .status(403)
        .json({ message: "Cannot delete resolved or closed complaints" });
    }

    // Delete the complaint
    await complaint.destroy();

    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete complaint" });
  }
};
