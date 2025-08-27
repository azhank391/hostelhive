const {
  User,
  Hostel,
  Room,
  Complaint,
  RoomAllocation,
  VisitorLog,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

// ✅ Get Hostel Statistics (Dashboard)
exports.getHostelStats = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    console.log(`[getHostelStats] Fetching stats for hostel: ${hostelId}`);

    // Get counts
    const totalStudents = await User.count({
      where: { hostelId, role: "student" },
    });
    const totalRooms = await Room.count({ where: { hostelId } });
    const totalComplaints = await Complaint.count({ where: { hostelId } });
    const pendingComplaints = await Complaint.count({
      where: { hostelId, status: "pending" },
    });

    // Room occupancy
    const occupiedRooms = await Room.count({
      where: { hostelId, occupied: { [Op.gt]: 0 } },
    });
    const availableRooms = await Room.count({
      where: { hostelId, occupied: { [Op.eq]: 0 } },
    });

    // Recent complaints
    const recentComplaints = await Complaint.findAll({
      where: { hostelId },
      include: [{ model: User, as: "user", attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    console.log(
      `[getHostelStats] Successfully fetched stats for hostel: ${hostelId}`
    );

    res.json({
      stats: {
        totalStudents,
        totalRooms,
        totalComplaints,
        pendingComplaints,
        occupiedRooms,
        availableRooms,
      },
      recentComplaints,
    });
  } catch (err) {
    console.error("Error in getHostelStats:", err);
    res.status(500).json({ message: "Failed to fetch hostel stats" });
  }
};

// ✅ Room Management
exports.getAllRooms = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const rooms = await Room.findAll({
      where: { hostelId },
      include: [
        {
          model: User,
          as: "assignedStudents",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
};

exports.createRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const { roomNumber, capacity, block } = req.body;

    const room = await Room.create({
      roomNumber,
      capacity,
      block,
      hostelId,
    });

    res.status(201).json(room);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Failed to create room" });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;
    const { roomNumber, capacity, block } = req.body;

    const room = await Room.findOne({ where: { id, hostelId } });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    await room.update({ roomNumber, capacity, block });
    res.json(room);
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ message: "Failed to update room" });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;

    const room = await Room.findOne({ where: { id, hostelId } });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    await room.destroy();
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ message: "Failed to delete room" });
  }
};

// ✅ Student Management
exports.getAllStudents = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const students = await User.findAll({
      where: {
        hostelId,
        role: "student",
      },
      include: [
        {
          model: Room,
          as: "room",
          attributes: ["id", "roomNumber", "block"],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

exports.createStudent = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if email already exists WITHIN THE SAME HOSTEL (not globally)
    const existingUser = await User.findOne({ where: { email, hostelId } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already exists in this hostel" });
    }

    const student = await User.create({
      name,
      email,
      password,
      role: "student",
      hostelId,
    });

    const { password: _, ...studentData } = student.toJSON();
    res.status(201).json(studentData);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ message: "Failed to create student" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;
    const { name, email } = req.body;

    const student = await User.findOne({
      where: { id, hostelId, role: "student" },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await student.update({ name, email });

    const { password: _, ...studentData } = student.toJSON();
    res.json(studentData);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ message: "Failed to update student" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;

    const student = await User.findOne({
      where: { id, hostelId, role: "student" },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: "Failed to delete student" });
  }
};

// ✅ Warden Management
exports.getAllWardens = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const wardens = await User.findAll({
      where: {
        hostelId,
        role: "warden",
      },
      attributes: { exclude: ["password"] },
    });

    res.json(wardens);
  } catch (err) {
    console.error("Error fetching wardens:", err);
    res.status(500).json({ message: "Failed to fetch wardens" });
  }
};

exports.createWarden = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if email already exists WITHIN THE SAME HOSTEL (not globally)
    const existingUser = await User.findOne({ where: { email, hostelId } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already exists in this hostel" });
    }

    const warden = await User.create({
      name,
      email,
      password,
      role: "warden",
      hostelId,
    });

    const { password: _, ...wardenData } = warden.toJSON();
    res.status(201).json(wardenData);
  } catch (err) {
    console.error("Error creating warden:", err);
    res.status(500).json({ message: "Failed to create warden" });
  }
};

// ✅ Room Assignment
exports.assignRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const { studentId, roomId } = req.body;

    // Verify both student and room belong to this hostel
    const student = await User.findOne({
      where: { id: studentId, hostelId, role: "student" },
    });
    const room = await Room.findOne({
      where: { id: roomId, hostelId },
    });

    if (!student || !room) {
      return res
        .status(404)
        .json({ message: "Student or room not found in this hostel" });
    }

    // Check if room has capacity
    const currentOccupancy = await User.count({ where: { roomId, hostelId } });
    if (currentOccupancy >= room.capacity) {
      return res.status(400).json({ message: "Room is at full capacity" });
    }

    await student.update({ roomId });
    res.json({ message: "Room assigned successfully" });
  } catch (err) {
    console.error("Error assigning room:", err);
    res.status(500).json({ message: "Failed to assign room" });
  }
};

// ✅ Complaint Management
exports.getAllComplaints = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const complaints = await Complaint.findAll({
      where: { hostelId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(complaints);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findOne({
      where: { id, hostelId },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    await complaint.update({ status });
    res.json(complaint);
  } catch (err) {
    console.error("Error updating complaint:", err);
    res.status(500).json({ message: "Failed to update complaint" });
  }
};

// ✅ Visitor Management
exports.getAllVisitors = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const visitors = await VisitorLog.findAll({
      where: { hostelId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(visitors);
  } catch (err) {
    console.error("Error fetching visitors:", err);
    res.status(500).json({ message: "Failed to fetch visitors" });
  }
};

exports.createVisitor = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const { visitorName, visitorPhone, studentId, purpose, entryTime } =
      req.body;

    // Verify student belongs to this hostel
    const student = await User.findOne({
      where: { id: studentId, hostelId, role: "student" },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Student not found in this hostel" });
    }

    const visitor = await VisitorLog.create({
      visitorName,
      visitorPhone,
      studentId,
      purpose,
      entryTime,
      hostelId,
    });

    res.status(201).json(visitor);
  } catch (err) {
    console.error("Error creating visitor log:", err);
    res.status(500).json({ message: "Failed to create visitor log" });
  }
};

exports.updateVisitorExit = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;
    const { exitTime } = req.body;

    const visitor = await VisitorLog.findOne({
      where: { id, hostelId },
    });

    if (!visitor) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    await visitor.update({ exitTime });
    res.json(visitor);
  } catch (err) {
    console.error("Error updating visitor exit:", err);
    res.status(500).json({ message: "Failed to update visitor exit" });
  }
};

// ✅ Dashboard Analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    // Get visitor analytics for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const visitorAnalytics = await VisitorLog.findAll({
      where: {
        hostelId,
        entryTime: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("entryTime")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("entryTime"))],
      order: [[sequelize.fn("DATE", sequelize.col("entryTime")), "ASC"]],
    });

    // Get complaint analytics
    const complaintStats = await Complaint.findAll({
      where: { hostelId },
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
    });

    res.json({
      visitorAnalytics,
      complaintStats,
    });
  } catch (err) {
    console.error("Error fetching dashboard analytics:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};
