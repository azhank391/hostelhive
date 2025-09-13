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

// 🚀 HELPER: Extract hostelId from URL params or JWT token
const getHostelIdFromRequest = (req) => {
  // First try to get from URL params (for owner endpoints)
  if (req.params.hostelId) {
    return req.params.hostelId;
  }

  // Check if middleware already set hostelId (for warden endpoints)
  if (req.hostelId) {
    return req.hostelId;
  }

  // Fallback to JWT token (for warden endpoints)
  if (req.user && req.user.hostelId) {
    return req.user.hostelId;
  }

  // If neither exists, throw error
  throw new Error("Hostel ID is required");
};

// 🚀 HELPER: Extract ID parameter based on route type
const getIdFromRequest = (req, paramName) => {
  // For owner routes (/:hostelId/.../:roomId), use the specific parameter
  if (req.params.hostelId && req.params[paramName]) {
    return req.params[paramName];
  }

  // For warden routes (/admin/.../:id), use the generic :id parameter
  if (req.params.id) {
    return req.params.id;
  }

  // Fallback
  return req.params[paramName] || req.params.id;
};

// ✅ Get Hostel Statistics (Dashboard)
exports.getHostelStats = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

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
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Increased default limit to get more rooms
    const offset = (page - 1) * limit;

    // Extract search parameter
    const search = req.query.search;

    // Build where clause
    let whereClause = { hostelId };

    // Add search functionality if needed
    if (search) {
      whereClause.roomNumber = { [Op.like]: `%${search}%` };
    }

    console.log(`[getAllRooms] Fetching rooms for hostel: ${hostelId}`);
    console.log(
      `[getAllRooms] Pagination: page=${page}, limit=${limit}, offset=${offset}`
    );
    console.log(`[getAllRooms] Where clause:`, whereClause);

    // Get total count for pagination
    const total = await Room.count({ where: whereClause });
    console.log(`[getAllRooms] Total rooms found: ${total}`);

    // Get ALL rooms first (without includes to ensure we get all rooms)
    const allRooms = await Room.findAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    console.log(
      `[getAllRooms] All rooms query returned: ${allRooms.length} rooms`
    );

    // Now get allocations for these rooms separately
    const roomIds = allRooms.map((r) => r.id);
    const allocations = await RoomAllocation.findAll({
      where: {
        roomId: { [Op.in]: roomIds },
        status: "active",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
          where: { role: "student" },
        },
      ],
    });

    // Group allocations by roomId
    const allocationsByRoom = {};
    allocations.forEach((allocation) => {
      if (!allocationsByRoom[allocation.roomId]) {
        allocationsByRoom[allocation.roomId] = [];
      }
      allocationsByRoom[allocation.roomId].push(allocation);
    });

    // Attach allocations to rooms
    allRooms.forEach((room) => {
      room.dataValues.allocations = allocationsByRoom[room.id] || [];
    });

    // Use the result with manually attached allocations
    const rooms = allRooms;

    console.log(`[getAllRooms] Rooms returned: ${rooms.length}`);
    console.log(
      `[getAllRooms] Room IDs:`,
      rooms.map((r) => r.id)
    );

    // Log rooms without allocations to verify they're included
    const roomsWithoutAllocations = rooms.filter(
      (r) => !r.allocations || r.allocations.length === 0
    );
    console.log(
      `[getAllRooms] Rooms without allocations: ${roomsWithoutAllocations.length}`
    );
    if (roomsWithoutAllocations.length > 0) {
      console.log(
        `[getAllRooms] Rooms without allocations IDs:`,
        roomsWithoutAllocations.map((r) => r.id)
      );
    }

    // Calculate pagination info
    const pages = Math.ceil(total / limit);

    // Return paginated response
    res.json({
      data: rooms,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
};

exports.createRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

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
  console.log(`[updateRoom] Function called with params:`, req.params);
  console.log(`[updateRoom] Request body:`, req.body);
  console.log(`[updateRoom] User:`, req.user);

  try {
    // Extract hostelId from URL parameters or JWT token, roomId from URL params
    const hostelId = getHostelIdFromRequest(req);
    const roomId = getIdFromRequest(req, "roomId"); // Route-aware parameter extraction
    const { roomNumber, capacity, block } = req.body;

    console.log(`[updateRoom] Updating room ${roomId} in hostel ${hostelId}`);
    console.log(`[updateRoom] Request body:`, { roomNumber, capacity, block });

    const room = await Room.findOne({ where: { id: roomId, hostelId } });
    if (!room) {
      console.log(
        `[updateRoom] Room ${roomId} not found in hostel ${hostelId}`
      );
      return res.status(404).json({ message: "Room not found" });
    }

    console.log(`[updateRoom] Found room:`, room.toJSON());

    await room.update({ roomNumber, capacity, block });

    console.log(`[updateRoom] Room updated successfully`);
    res.json(room);
  } catch (err) {
    console.error("Error updating room:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      message: err.message,
      name: err.name,
      code: err.code,
    });
    res.status(500).json({
      message: "Failed to update room",
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token, roomId from URL params
    const hostelId = getHostelIdFromRequest(req);
    const roomId = getIdFromRequest(req, "roomId"); // Route-aware parameter extraction

    const room = await Room.findOne({ where: { id: roomId, hostelId } });
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

// ✅ Get Students in a Specific Room
exports.getRoomStudents = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token, roomId from URL params
    const hostelId = getHostelIdFromRequest(req);
    const roomId = getIdFromRequest(req, "roomId"); // Route-aware parameter extraction

    console.log(
      `[getRoomStudents] Fetching students for room ${roomId} in hostel ${hostelId}`
    );

    // Verify room exists and belongs to the hostel
    const room = await Room.findOne({
      where: { id: roomId, hostelId },
      attributes: ["id", "roomNumber", "capacity", "occupied"],
    });

    if (!room) {
      console.log(
        `[getRoomStudents] Room ${roomId} not found in hostel ${hostelId}`
      );
      return res.status(404).json({ message: "Room not found" });
    }

    // Get all students allocated to this specific room
    const students = await User.findAll({
      where: {
        hostelId,
        role: "student",
      },
      include: [
        {
          model: RoomAllocation,
          as: "allocations",
          where: {
            roomId,
            status: "active",
          },
          required: true,
        },
      ],
      attributes: ["id", "name", "email", "role", "hostelId"],
      order: [["name", "ASC"]],
    });

    console.log(
      `[getRoomStudents] Found ${students.length} students in room ${roomId}`
    );

    res.json({
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        occupied: room.occupied,
      },
      students,
      totalStudents: students.length,
    });
  } catch (err) {
    console.error("Error fetching room students:", err);
    res.status(500).json({ message: "Failed to fetch room students" });
  }
};

// ✅ Student Management
exports.getAllStudents = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

    console.log(`[getAllStudents] Fetching students for hostel ${hostelId}`);

    const students = await User.findAll({
      where: {
        hostelId,
        role: "student",
      },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: RoomAllocation,
          as: "allocations",
          where: { status: "active" },
          required: false,
          include: [
            {
              model: Room,
              as: "room",
              attributes: ["id", "roomNumber", "capacity", "occupied", "block"],
            },
          ],
        },
      ],
    });

    console.log(`[getAllStudents] Found ${students.length} students`);

    // Transform the data to include room information and allocation status
    const studentsWithRooms = students.map((student) => {
      const studentData = student.toJSON();

      // Check if student has an active room allocation
      const hasActiveAllocation =
        studentData.allocations &&
        studentData.allocations.length > 0 &&
        studentData.allocations[0].status === "active";

      if (hasActiveAllocation && studentData.allocations[0].room) {
        studentData.roomNumber = studentData.allocations[0].room.roomNumber;
        studentData.roomId = studentData.allocations[0].room.id;
        studentData.roomBlock = studentData.allocations[0].room.block;
        studentData.hasRoom = true;
        studentData.allocationId = studentData.allocations[0].id;
      } else {
        studentData.hasRoom = false;
        studentData.roomNumber = null;
        studentData.roomId = null;
        studentData.roomBlock = null;
        studentData.allocationId = null;
      }

      // Keep the allocations data for frontend use
      // studentData.allocations will contain the room allocation information

      return studentData;
    });

    console.log(
      `[getAllStudents] Returning ${studentsWithRooms.length} students with room allocation data`
    );
    console.log(
      `[getAllStudents] Students with rooms: ${
        studentsWithRooms.filter((s) => s.hasRoom).length
      }`
    );
    console.log(
      `[getAllStudents] Students without rooms: ${
        studentsWithRooms.filter((s) => !s.hasRoom).length
      }`
    );

    res.json(studentsWithRooms);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

exports.createStudent = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { name, email, phone } = req.body;

    console.log(`[createStudent] Creating student in hostel ${hostelId}`);
    console.log(`[createStudent] Request body:`, { name, email, phone });

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if email already exists WITHIN THE SAME HOSTEL (not globally)
    const existingUser = await User.findOne({ where: { email, hostelId } });
    if (existingUser) {
      console.log(
        `[createStudent] Email ${email} already exists in hostel ${hostelId}`
      );
      return res
        .status(400)
        .json({ message: "Email already exists in this hostel" });
    }

    // Set default password for new students
    const defaultPassword = "123456";

    // Hash the default password
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Find the student system role
    const { Role } = require("../models");
    const studentRole = await Role.findOne({
      where: { name: "student", isSystemRole: true },
    });

    if (!studentRole) {
      console.error("❌ Student system role not found in database");
      return res.status(500).json({ message: "System configuration error" });
    }

    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "student",
      role_id: studentRole.id, // Set the RBAC role ID (snake_case for database)
      hostelId,
      isActive: true,
      // Only students need to change their default password
      requiresPasswordChange: true,
    });

    console.log(`[createStudent] Student created successfully:`, student.id);

    const { password: _, ...studentData } = student.toJSON();

    // Add a note about the default password in the response
    res.status(201).json({
      ...studentData,
      message: "Student created successfully with default password: 123456",
    });
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ message: "Failed to create student" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token, studentId from URL params
    const hostelId = getHostelIdFromRequest(req);
    const studentId = getIdFromRequest(req, "studentId"); // Route-aware parameter extraction
    const { name, email, phone } = req.body;

    console.log(
      `[updateStudent] Updating student ${studentId} in hostel ${hostelId}`
    );
    console.log(`[updateStudent] Request body:`, { name, email, phone });

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const student = await User.findOne({
      where: { id: studentId, hostelId, role: "student" },
    });

    if (!student) {
      console.log(
        `[updateStudent] Student ${studentId} not found in hostel ${hostelId}`
      );
      return res.status(404).json({ message: "Student not found" });
    }

    console.log(`[updateStudent] Found student:`, student.toJSON());

    // Update student with all provided fields
    const updateData = { name: name.trim(), email: email.trim() };
    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    await student.update(updateData);

    console.log(`[updateStudent] Student updated successfully`);

    const { password: _, ...studentData } = student.toJSON();
    res.json(studentData);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ message: "Failed to update student" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token, studentId from URL params
    const hostelId = getHostelIdFromRequest(req);
    const studentId = getIdFromRequest(req, "studentId"); // Route-aware parameter extraction

    console.log(
      `[deleteStudent] Deleting student ${studentId} from hostel ${hostelId}`
    );

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await User.findOne({
      where: { id: studentId, hostelId, role: "student" },
    });

    if (!student) {
      console.log(
        `[deleteStudent] Student ${studentId} not found in hostel ${hostelId}`
      );
      return res.status(404).json({ message: "Student not found" });
    }

    console.log(`[deleteStudent] Found student:`, student.toJSON());

    // Check if student has active room allocations
    const { RoomAllocation } = require("../models");
    const activeAllocations = await RoomAllocation.findAll({
      where: {
        userId: studentId,
        status: "active",
      },
    });

    if (activeAllocations.length > 0) {
      console.log(
        `[deleteStudent] Student ${studentId} has ${activeAllocations.length} active room allocation(s)`
      );
      return res.status(400).json({
        message:
          "Cannot delete student with active room allocation. Please remove the student from their room first.",
        hasActiveAllocation: true,
        allocationCount: activeAllocations.length,
      });
    }

    // Check if student has any pending complaints
    const { Complaint } = require("../models");
    const pendingComplaints = await Complaint.findAll({
      where: {
        userId: studentId,
        status: ["pending", "in_progress"],
      },
    });

    if (pendingComplaints.length > 0) {
      console.log(
        `[deleteStudent] Student ${studentId} has ${pendingComplaints.length} pending complaint(s)`
      );
      return res.status(400).json({
        message:
          "Cannot delete student with pending complaints. Please resolve all complaints first.",
        hasPendingComplaints: true,
        complaintCount: pendingComplaints.length,
      });
    }

    // Check if student has any active visitor logs
    const { VisitorLog } = require("../models");
    const activeVisitorLogs = await VisitorLog.findAll({
      where: {
        studentId: studentId,
        checkOut: null, // Active visitor = checked in but not checked out
      },
    });

    if (activeVisitorLogs.length > 0) {
      console.log(
        `[deleteStudent] Student ${studentId} has ${activeVisitorLogs.length} active visitor log(s)`
      );
      return res.status(400).json({
        message:
          "Cannot delete student with active visitor logs. Please check out all visitors first.",
        hasActiveVisitors: true,
        visitorCount: activeVisitorLogs.length,
      });
    }

    // Safe to delete - no active allocations, complaints, or visitor logs
    await student.destroy();

    console.log(`[deleteStudent] Student deleted successfully`);

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: "Failed to delete student" });
  }
};

// ✅ Warden Management
exports.getAllWardens = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

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
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

    const { name, email, password, phone } = req.body;

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

    // Find the warden system role
    const { Role } = require("../models");
    const wardenRole = await Role.findOne({
      where: { name: "warden", isSystemRole: true },
    });

    if (!wardenRole) {
      console.error("❌ Warden system role not found in database");
      return res.status(500).json({ message: "System configuration error" });
    }

    // Hash the password
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);

    const warden = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "warden", // Always set to "warden"
      role_id: wardenRole.id, // Set the RBAC role ID (snake_case for database)
      hostelId,
      requiresPasswordChange: true, // Force password change on first login
    });

    const { password: _, ...wardenData } = warden.toJSON();
    res.status(201).json(wardenData);
  } catch (err) {
    console.error("Error creating warden:", err);
    res.status(500).json({ message: "Failed to create warden" });
  }
};

exports.updateWarden = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token, wardenId from URL params
    const hostelId = getHostelIdFromRequest(req);
    const { wardenId } = req.params;
    const { name, email, phone } = req.body;

    const warden = await User.findOne({
      where: { id: wardenId, hostelId, role: "warden" },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // Check if new email conflicts with existing WITHIN THE SAME HOSTEL
    if (email && email !== warden.email) {
      const existingUser = await User.findOne({ where: { email, hostelId } });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email already registered in this hostel" });
      }
    }

    await warden.update({
      name: name || warden.name,
      email: email || warden.email,
      phone: phone !== undefined ? phone : warden.phone,
    });

    const { password: _, ...wardenData } = warden.toJSON();
    res.json({ message: "Warden updated successfully", warden: wardenData });
  } catch (err) {
    console.error("Error updating warden:", err);
    res.status(500).json({ message: "Failed to update warden" });
  }
};

exports.deleteWarden = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token, wardenId from URL params
    const hostelId = getHostelIdFromRequest(req);
    const { wardenId } = req.params;

    const warden = await User.findOne({
      where: { id: wardenId, hostelId, role: "warden" },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    await warden.destroy();
    res.json({ message: "Warden deleted successfully" });
  } catch (err) {
    console.error("Error deleting warden:", err);
    res.status(500).json({ message: "Failed to delete warden" });
  }
};

// ✅ Room Assignment
exports.assignRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

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

// ✅ Room Allocation Management (Using RoomAllocation model)
exports.allocateRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { studentId, roomId } = req.body;

    console.log(
      `[allocateRoom] Allocating room ${roomId} to student ${studentId} in hostel ${hostelId}`
    );

    if (!studentId || !roomId) {
      return res
        .status(400)
        .json({ message: "Student ID and Room ID are required" });
    }

    // Verify student and room belong to this hostel
    const student = await User.findOne({
      where: { id: studentId, hostelId, role: "student" },
    });
    const room = await Room.findOne({ where: { id: roomId, hostelId } });

    if (!student) {
      console.log(
        `[allocateRoom] Student ${studentId} not found in hostel ${hostelId}`
      );
      return res.status(404).json({ message: "Student not found" });
    }
    if (!room) {
      console.log(
        `[allocateRoom] Room ${roomId} not found in hostel ${hostelId}`
      );
      return res.status(404).json({ message: "Room not found" });
    }

    console.log(`[allocateRoom] Found student:`, student.toJSON());
    console.log(`[allocateRoom] Found room:`, room.toJSON());

    // Check if student already has active allocation
    const existingAllocation = await RoomAllocation.findOne({
      where: { userId: studentId, status: "active" },
    });

    if (existingAllocation) {
      console.log(
        `[allocateRoom] Student ${studentId} already has active allocation`
      );
      return res
        .status(400)
        .json({ message: "Student already has an active room allocation" });
    }

    // Check if room has available capacity
    if (room.occupied >= room.capacity) {
      console.log(`[allocateRoom] Room ${roomId} is at full capacity`);
      return res.status(400).json({ message: "Room is at full capacity" });
    }

    // Create allocation
    const allocation = await RoomAllocation.create({
      hostelId,
      userId: studentId,
      roomId,
      allocationDate: new Date(),
      status: "active",
    });

    // Update room occupancy
    await room.update({ occupied: room.occupied + 1 });

    console.log(`[allocateRoom] Room allocated successfully`);

    res
      .status(201)
      .json({ message: "Room allocated successfully", allocation });
  } catch (err) {
    console.error("Error allocating room:", err);
    res.status(500).json({ message: "Failed to allocate room" });
  }
};

exports.deallocateRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { allocationId: studentId } = req.params; // Accept studentId instead of allocationId

    console.log(
      `[deallocateRoom] Deallocating student ${studentId} from hostel ${hostelId}`
    );

    // Find the active allocation for this student in this hostel
    const allocation = await RoomAllocation.findOne({
      where: {
        userId: studentId,
        hostelId,
        status: "active",
      },
      include: [{ model: Room, as: "room" }],
    });

    if (!allocation) {
      console.log(
        `[deallocateRoom] No active allocation found for student ${studentId} in hostel ${hostelId}`
      );
      return res
        .status(404)
        .json({ message: "Active allocation not found for this student" });
    }

    console.log(
      `[deallocateRoom] Found allocation ${allocation.id} for student ${studentId} in room ${allocation.room.roomNumber}`
    );

    // Update allocation status
    await allocation.update({ status: "left" });

    // Update room occupancy
    await allocation.room.update({ occupied: allocation.room.occupied - 1 });

    console.log(
      `[deallocateRoom] Successfully deallocated student ${studentId} from room ${allocation.room.roomNumber}`
    );

    res.json({ message: "Room deallocated successfully" });
  } catch (err) {
    console.error("Error deallocating room:", err);
    res.status(500).json({ message: "Failed to deallocate room" });
  }
};

// ✅ Complaint Management
exports.createComplaint = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { title, description, userId } = req.body;

    if (!title || !description || !userId) {
      return res.status(400).json({
        message: "Title, description, and userId are required",
      });
    }

    // Verify that the user belongs to this hostel
    const user = await User.findOne({
      where: { id: userId, hostelId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found in this hostel",
      });
    }

    const complaint = await Complaint.create({
      title,
      description,
      userId,
      hostelId,
      status: "pending",
    });

    // Return complaint with user details
    const complaintWithUser = await Complaint.findByPk(complaint.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
    });

    res.status(201).json({
      message: "Complaint created successfully",
      complaint: complaintWithUser,
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    res.status(500).json({ message: "Failed to create complaint" });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { page = 1, limit = 10, status, priority, search } = req.query;

    // Build where clause
    const whereClause = { hostelId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Get total count for pagination
    const total = await Complaint.count({ where: whereClause });

    // Get complaints with pagination
    const complaints = await Complaint.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
          include: [
            {
              model: RoomAllocation,
              as: "allocations",
              required: false,
              include: [
                {
                  model: Room,
                  as: "room",
                  attributes: ["id", "roomNumber", "block"],
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    // Debug: Check what data is being returned
    if (complaints.length > 0) {
      console.log(
        "🔍 Backend: First complaint user:",
        complaints[0].user?.name
      );
      console.log(
        "🔍 Backend: First complaint allocations:",
        complaints[0].user?.allocations?.length || 0
      );
      if (
        complaints[0].user?.allocations &&
        complaints[0].user.allocations.length > 0
      ) {
        console.log(
          "🔍 Backend: First allocation room:",
          complaints[0].user.allocations[0].room?.roomNumber
        );
      }
    }

    res.json({
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const complaintId = getIdFromRequest(req, "complaintId"); // Route-aware parameter extraction
    const { status, priority } = req.body;

    console.log("🔍 Updating complaint:", {
      hostelId,
      complaintId,
      status,
      priority,
    });

    const complaint = await Complaint.findOne({
      where: { id: complaintId, hostelId },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    await complaint.update(updateData);
    res.json(complaint);
  } catch (err) {
    console.error("Error updating complaint:", err);
    res.status(500).json({ message: "Failed to update complaint" });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const complaintId = getIdFromRequest(req, "complaintId"); // Route-aware parameter extraction
    const { resolutionNotes } = req.body;

    console.log("🔍 Resolving complaint:", {
      hostelId,
      complaintId,
      resolutionNotes,
    });

    const complaint = await Complaint.findOne({
      where: { id: complaintId, hostelId },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    await complaint.update({
      status: "resolved",
      resolutionNotes,
      resolvedAt: new Date(),
    });

    res.json({ message: "Complaint resolved successfully", complaint });
  } catch (err) {
    console.error("Error resolving complaint:", err);
    res.status(500).json({ message: "Failed to resolve complaint" });
  }
};

// ✅ Delete Complaint
exports.deleteComplaint = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({
      where: { id: complaintId, hostelId },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Only allow deletion of pending or in_progress complaints
    // if (complaint.status === "resolved" || complaint.status === "rejected") {
    //   return res.status(403).json({
    //     message: "Cannot delete resolved or rejected complaints",
    //   });
    // }

    await complaint.destroy();
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Error deleting complaint:", err);
    res.status(500).json({ message: "Failed to delete complaint" });
  }
};

// ✅ Visitor Management
exports.getAllVisitors = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

    const visitors = await VisitorLog.findAll({
      where: { hostelId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["name", "email"],
        },
        {
          model: Room,
          as: "room",
          attributes: ["roomNumber"],
        }
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
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

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
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
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

exports.getAllVisitorLogs = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { status } = req.query; // Get status filter from query params

    let whereClause = { hostelId };

    // Handle status filtering based on checkIn/checkOut fields
    if (status === "checked-in") {
      whereClause.checkOut = null; // Active visitor = checked in but not checked out
    } else if (status === "checked-out") {
      whereClause.checkOut = { [Op.ne]: null }; // Checked out visitor
    }

    const visitorLogs = await VisitorLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Add virtual status field to each visitor log
    const visitorLogsWithStatus = visitorLogs.map((log) => {
      const logData = log.toJSON();
      logData.status = logData.checkOut ? "checked-out" : "checked-in";
      return logData;
    });

    res.json(visitorLogsWithStatus);
  } catch (err) {
    console.error("Error fetching visitor logs:", err);
    res.status(500).json({ message: "Failed to fetch visitor logs" });
  }
};

exports.createVisitorLog = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

    const { visitorName, relation, studentId, checkIn } = req.body;

    // Verify student belongs to this hostel
    const student = await User.findOne({
      where: { id: studentId, hostelId, role: "student" },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Student not found in this hostel" });
    }

    const visitorLog = await VisitorLog.create({
      visitorName,
      relation,
      studentId,
      checkIn: checkIn || new Date(),
      hostelId,
    });

    res.status(201).json(visitorLog);
  } catch (err) {
    console.error("Error creating visitor log:", err);
    res.status(500).json({ message: "Failed to create visitor log" });
  }
};

exports.checkoutVisitor = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const visitorId = getIdFromRequest(req, "visitorId"); // Route-aware parameter extraction

    if (!visitorId) {
      return res.status(400).json({ message: "Visitor ID is required" });
    }

    const visitor = await VisitorLog.findOne({
      where: { id: visitorId, hostelId },
    });

    if (!visitor) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    if (visitor.checkOut) {
      return res
        .status(400)
        .json({ message: "Visitor has already checked out" });
    }

    // Update checkOut time
    await visitor.update({
      checkOut: new Date(),
    });

    res.json({ message: "Visitor checked out successfully", visitor });
  } catch (err) {
    console.error("Error checking out visitor:", err);
    res.status(500).json({ message: "Failed to check out visitor" });
  }
};

exports.updateVisitorLog = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const visitorId = getIdFromRequest(req, "visitorId"); // Route-aware parameter extraction
    const updateData = req.body;

    const visitor = await VisitorLog.findOne({
      where: { id: visitorId, hostelId },
    });

    if (!visitor) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    await visitor.update(updateData);
    res.json({ message: "Visitor log updated successfully", visitor });
  } catch (err) {
    console.error("Error updating visitor log:", err);
    res.status(500).json({ message: "Failed to update visitor log" });
  }
};

// ✅ Delete Visitor Log
exports.deleteVisitorLog = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token, visitorId from route params
    const hostelId = getHostelIdFromRequest(req);
    const visitorId = getIdFromRequest(req, "visitorId"); // Route-aware parameter extraction

    const visitorLog = await VisitorLog.findOne({
      where: {
        id: visitorId,
        hostelId,
      },
    });

    if (!visitorLog) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    await visitorLog.destroy();

    res.json({ message: "Visitor log deleted successfully" });
  } catch (err) {
    console.error("Error deleting visitor log:", err);
    res.status(500).json({ message: "Failed to delete visitor log" });
  }
};

// ✅ Get Visitor Statistics
exports.getVisitorStats = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

    // Get total visitors count
    const totalVisitors = await VisitorLog.count({
      where: { hostelId },
    });

    // Get active visitors (not checked out)
    const activeVisitors = await VisitorLog.count({
      where: {
        hostelId,
        checkOut: null,
      },
    });

    // Get visitors by month for the current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await VisitorLog.findAll({
      where: {
        hostelId,
        checkIn: {
          [Op.gte]: new Date(`${currentYear}-01-01`),
          [Op.lt]: new Date(`${currentYear + 1}-01-01`),
        },
      },
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("checkIn")), "month"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [sequelize.fn("MONTH", sequelize.col("checkIn"))],
      order: [[sequelize.fn("MONTH", sequelize.col("checkIn")), "ASC"]],
    });

    // Get most frequent visitors
    const frequentVisitors = await VisitorLog.findAll({
      where: { hostelId },
      attributes: [
        "visitorName",
        [sequelize.fn("COUNT", sequelize.col("id")), "visitCount"],
      ],
      group: ["visitorName"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 10,
    });

    res.json({
      totalVisitors,
      activeVisitors,
      monthlyStats,
      frequentVisitors,
    });
  } catch (err) {
    console.error("Error fetching visitor stats:", err);
    res.status(500).json({ message: "Failed to fetch visitor statistics" });
  }
};

// ✅ Export Visitor Logs
exports.exportVisitorLogs = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { startDate, endDate, format = "json" } = req.query;

    let whereClause = { hostelId };

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.checkIn = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const visitorLogs = await VisitorLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id","name", "email"],
          include: [
            {
              model: RoomAllocation,
              as: 'allocations',
              where: { status: 'active' },
              required: false,
              include: [
                { model: Room, as: 'room', attributes: ['roomNumber','block','capacity'] }
              ]
            }
          ]
        },
      ],
      order: [["checkIn", "DESC"]],
    });

    if (format === "csv") {
      // Convert to CSV format
      const csvData = [
        ["Visitor Name", "Relation", "Student Name", "Student Email", "Room Number", "Room Block", "Check In", "Check Out"],
        ...visitorLogs.map((log) => {
          const allocation = log.student?.allocations?.[0];
            return [
              (log.visitorName||'').replace(/\n|\r|,/g,' '),
              (log.relation||'').replace(/\n|\r|,/g,' '),
              log.student?.name || "N/A",
              log.student?.email || "N/A",
              allocation?.room?.roomNumber || 'N/A',
              allocation?.room?.block || 'N/A',
              log.checkIn?.toISOString() || "N/A",
              log.checkOut?.toISOString() || "Not checked out"
            ];
        }),
      ];

      const csvString = csvData.map((row) => row.join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="visitor-logs-${hostelId}.csv"`
      );
      res.send(csvString);
    } else {
      // Return JSON format
      const serialized = visitorLogs.map(v => {
        const allocation = v.student?.allocations?.[0];
        return {
          id: v.id,
          visitorName: v.visitorName,
          relation: v.relation,
            student: v.student ? {
              id: v.student.id,
              name: v.student.name,
              email: v.student.email,
              room: allocation ? {
                roomNumber: allocation.room?.roomNumber,
                block: allocation.room?.block,
                capacity: allocation.room?.capacity
              } : null
            } : null,
          checkIn: v.checkIn,
          checkOut: v.checkOut
        };
      });
      res.json({ count: serialized.length, visitorLogs: serialized });
    }
  } catch (err) {
    console.error("Error exporting visitor logs:", err);
    res.status(500).json({ message: "Failed to export visitor logs" });
  }
};

// ✅ Export Students Data
exports.exportStudents = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);
    const { format = "json" } = req.query;

    const students = await User.findAll({
      where: { 
        hostelId,
        role: 'student'
      },
      include: [
        {
          model: RoomAllocation,
          as: "roomAllocation",
          include: [
            {
              model: Room,
              as: "room",
              attributes: ["roomNumber", "type"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    if (format === "csv") {
      // Convert to CSV format
      const csvData = [
        ["Name", "Email", "Phone", "Room Number", "Room Type", "Registration Date"],
        ...students.map((student) => [
          student.name,
          student.email,
          student.phone || "N/A",
          student.roomAllocation?.room?.roomNumber || "Not allocated",
          student.roomAllocation?.room?.type || "N/A",
          student.createdAt?.toISOString().split('T')[0] || "N/A",
        ]),
      ];

      const csvString = csvData.map((row) => row.join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="students-${hostelId}.csv"`
      );
      res.send(csvString);
    } else {
      // Return JSON format
      res.json({
        count: students.length,
        students,
      });
    }
  } catch (err) {
    console.error("Error exporting students:", err);
    res.status(500).json({ message: "Failed to export students" });
  }
};

// ✅ Export Complaints Data
exports.exportComplaints = async (req, res) => {
  try {
    const hostelId = getHostelIdFromRequest(req);
    const { format = 'csv' } = req.query;

    const complaints = await Complaint.findAll({
      where: { hostelId },
      include: [
        { model: User, as: 'user', attributes: ['name','email','role'] }
      ],
      order: [['createdAt','DESC']]
    });

    if (format === 'csv') {
      const header = ['ID','Title','Description','Status','Priority','Author Name','Author Email','Created'];
      const rows = complaints.map(c => [
        c.id,
        (c.title||'').replace(/\n|\r|,/g,' '),
        (c.description||'').replace(/\n|\r|,/g,' '),
        c.status,
        c.priority || 'N/A',
        c.user?.name || 'N/A',
        c.user?.email || 'N/A',
        c.createdAt?.toISOString() || 'N/A'
      ]);
      const csv = [header,...rows].map(r=>r.join(',')).join('\n');
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition',`attachment; filename="complaints-${hostelId}.csv"`);
      return res.send(csv);
    }

    return res.json({ count: complaints.length, complaints });
  } catch (err) {
    console.error('Error exporting complaints:', err);
    return res.status(500).json({ message: 'Failed to export complaints' });
  }
};

// ✅ Export Rooms Data
exports.exportRooms = async (req, res) => {
  try {
    const hostelId = getHostelIdFromRequest(req);
    const { format = 'csv' } = req.query;
    // Fetch rooms first
    const rooms = await Room.findAll({
      where: { hostelId },
      order: [['roomNumber','ASC']]
    });

    // Fetch active allocations with student & room
    const roomIds = rooms.map(r => r.id);
    const allocations = await RoomAllocation.findAll({
      where: { roomId: { [Op.in]: roomIds }, status: 'active' },
      include: [
        { model: User, as: 'user', attributes: ['id','name','email','role'], where: { role: 'student' } },
        { model: Room, as: 'room', attributes: ['id','roomNumber','capacity','block'] }
      ]
    });
    const allocationsByRoom = {};
    allocations.forEach(a => {
      if (!allocationsByRoom[a.roomId]) allocationsByRoom[a.roomId] = [];
      allocationsByRoom[a.roomId].push(a);
    });

    if (format === 'csv') {
      const header = ['ID','Room Number','Block','Capacity','Occupied','Available','Students','Created'];
      const rows = rooms.map(r => {
        const list = allocationsByRoom[r.id] || [];
        const occupied = list.length;
        const students = list.map(a => (a.user?.name||'').replace(/\n|\r|,/g,' ')).join('; ');
        const available = Math.max(0, (r.capacity||0) - occupied);
        return [
          r.id,
          r.roomNumber,
          r.block || 'N/A',
          r.capacity,
          occupied,
          available,
          students || 'None',
          r.createdAt?.toISOString() || 'N/A'
        ];
      });
      const csv = [header, ...rows].map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition',`attachment; filename="rooms-${hostelId}.csv"`);
      return res.send(csv);
    }
    const enriched = rooms.map(r => {
      const list = allocationsByRoom[r.id] || [];
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        block: r.block,
        capacity: r.capacity,
        occupied: list.length,
        available: Math.max(0,(r.capacity||0)-list.length),
        students: list.map(a => ({ id: a.user?.id, name: a.user?.name, email: a.user?.email })),
        createdAt: r.createdAt
      };
    });
    return res.json({ count: enriched.length, rooms: enriched });
  } catch (err) {
    console.error('Error exporting rooms:', err);
    return res.status(500).json({ message: 'Failed to export rooms' });
  }
};

// ✅ Export Staff Data
exports.exportStaff = async (req, res) => {
  try {
    const hostelId = getHostelIdFromRequest(req);
    const { format = 'csv' } = req.query;

    const staff = await User.findAll({
      where: { hostelId, role: { [Op.ne]: 'student' } },
      attributes: ['id','name','email','phone','role','createdAt','isActive'],
      order: [['name','ASC']]
    });

    if (format === 'csv') {
      const header = ['ID','Name','Email','Phone','Role','Active','Created'];
      const rows = staff.map(s => [
        s.id,
        (s.name||'').replace(/\n|\r|,/g,' '),
        s.email,
        s.phone || 'N/A',
        s.role,
        s.isActive ? 'YES' : 'NO',
        s.createdAt?.toISOString() || 'N/A'
      ]);
      const csv = [header,...rows].map(r=>r.join(',')).join('\n');
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition',`attachment; filename="staff-${hostelId}.csv"`);
      return res.send(csv);
    }

    return res.json({ count: staff.length, staff });
  } catch (err) {
    console.error('Error exporting staff:', err);
    return res.status(500).json({ message: 'Failed to export staff' });
  }
};

// ✅ Dashboard Analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Extract hostelId from URL parameters or JWT token
    const hostelId = getHostelIdFromRequest(req);

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

// ========================================
// STAFF MANAGEMENT METHODS
// ========================================

/**
 * Get all staff members for a hostel
 */
exports.getAllStaff = async (req, res) => {
  try {
    const hostelId = getHostelIdFromRequest(req);

    // Get all users with custom roles (non-system roles) for this hostel
    const staff = await User.findAll({
      where: {
        hostelId,
        role: {
          [Op.ne]: "student", // Exclude students
        },
      },
      include: [
        {
          model: require("../models").Role,
          as: "rbacRole",
          attributes: ["id", "name", "displayName", "isSystemRole"],
          required: false, // LEFT JOIN to include users even if they don't have a role_id
        },
      ],
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "role",
        "role_id",
        "isActive",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the data to include role information and permissions
    const staffWithRoles = await Promise.all(
      staff.map(async (member) => {
        let roleData = null;
        let permissions = [];

        if (member.rbacRole) {
          roleData = {
            id: member.rbacRole.id,
            name: member.rbacRole.name,
            displayName: member.rbacRole.displayName,
            isSystemRole: member.rbacRole.isSystemRole,
          };

          // Get permissions for this role
          if (!member.rbacRole.isSystemRole) {
            const rolePermissions =
              await require("../models").RolePermission.findAll({
                where: { roleId: member.rbacRole.id },
                include: [
                  {
                    model: require("../models").Permission,
                    as: "permission",
                    attributes: ["id", "name", "displayName", "category"],
                  },
                ],
              });
            permissions = rolePermissions.map((rp) => rp.permission);
          } else {
            // For system roles, get permissions from the system role
            const systemRolePermissions =
              await require("../models").RolePermission.findAll({
                where: { roleId: member.rbacRole.id },
                include: [
                  {
                    model: require("../models").Permission,
                    as: "permission",
                    attributes: ["id", "name", "displayName", "category"],
                  },
                ],
              });
            permissions = systemRolePermissions.map((rp) => rp.permission);
          }
        } else if (member.role) {
          // Fallback: if no rbacRole but has legacy role, try to find the role (system or custom)
          const role = await require("../models").Role.findOne({
            where: {
              name: member.role,
            },
          });

          if (role) {
            roleData = {
              id: role.id,
              name: role.name,
              displayName: role.displayName,
              isSystemRole: role.isSystemRole,
            };

            // Get permissions for the role (both system and custom roles)
            const rolePermissions =
              await require("../models").RolePermission.findAll({
                where: { roleId: role.id },
                include: [
                  {
                    model: require("../models").Permission,
                    as: "permission",
                    attributes: ["id", "name", "displayName", "category"],
                  },
                ],
              });
            permissions = rolePermissions.map((rp) => rp.permission);
          } else {
            // If no role found, create a fallback role data
            roleData = {
              id: null,
              name: member.role,
              displayName:
                member.role.charAt(0).toUpperCase() + member.role.slice(1),
              isSystemRole: false,
            };
          }
        }

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: roleData,
          permissions,
          isActive: member.isActive,
          createdAt: member.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: staffWithRoles,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff members",
    });
  }
};

/**
 * Create a new staff member
 */
exports.createStaff = async (req, res) => {
  try {
    const hostelId = getHostelIdFromRequest(req);
    const { name, email, phone, roleId, password } = req.body;

    // Validate required fields
    if (!name || !email || !roleId || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, role, and password are required",
      });
    }

    // Check if email already exists WITHIN THE SAME HOSTEL (not globally)
    const existingUser = await User.findOne({ where: { email, hostelId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists in this hostel",
      });
    }

    // Verify the role exists and belongs to this hostel (or is a system role)
    const role = await require("../models").Role.findOne({
      where: {
        id: roleId,
        [require("sequelize").Op.or]: [
          { hostelId: hostelId }, // Custom role for this hostel
          { isSystemRole: true }, // System role (owner, student, warden)
        ],
      },
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected or role does not belong to this hostel",
      });
    }

    // Hash the password
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the staff member
    const staffMember = await User.create({
      name,
      email,
      phone,
      password: hashedPassword, // Use hashed password
      role: role.name,
      roleId: roleId, // Use camelCase field name as defined in the model
      hostelId,
      isActive: true,
      requiresPasswordChange: true, // Force password change on first login
    });

    // Get the created staff member with role information and permissions
    const createdStaff = await User.findByPk(staffMember.id, {
      include: [
        {
          model: require("../models").Role,
          as: "rbacRole",
          attributes: ["id", "name", "displayName", "isSystemRole"],
        },
      ],
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "role",
        "isActive",
        "createdAt",
      ],
    });

    // Get permissions for the role
    let permissions = [];
    if (createdStaff.rbacRole) {
      const rolePermissions = await require("../models").RolePermission.findAll(
        {
          where: { roleId: createdStaff.rbacRole.id },
          include: [
            {
              model: require("../models").Permission,
              as: "permission",
              attributes: ["id", "name", "displayName", "category"],
            },
          ],
        }
      );
      permissions = rolePermissions.map((rp) => rp.permission);
    }

    // Transform the data to match the format expected by the frontend
    const staffWithPermissions = {
      id: createdStaff.id,
      name: createdStaff.name,
      email: createdStaff.email,
      phone: createdStaff.phone,
      role: createdStaff.rbacRole
        ? {
            id: createdStaff.rbacRole.id,
            name: createdStaff.rbacRole.name,
            displayName: createdStaff.rbacRole.displayName,
            isSystemRole: createdStaff.rbacRole.isSystemRole,
          }
        : null,
      permissions,
      isActive: createdStaff.isActive,
      createdAt: createdStaff.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: staffWithPermissions,
    });
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create staff member",
    });
  }
};

/**
 * Update a staff member
 */
exports.updateStaff = async (req, res) => {
  try {
    const hostelId = getHostelIdFromRequest(req);
    const staffId = getIdFromRequest(req, "staffId");
    const { name, email, phone, roleId } = req.body;

    // Find the staff member
    const staffMember = await User.findOne({
      where: { id: staffId, hostelId },
      include: [
        {
          model: require("../models").Role,
          as: "rbacRole",
          attributes: ["id", "name", "displayName", "isSystemRole"],
        },
      ],
    });

    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== staffMember.email) {
      const existingUser = await User.findOne({
        where: { email, id: { [Op.ne]: staffId } },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Verify the role exists if being changed
    if (roleId && roleId !== staffMember.roleId) {
      const role = await require("../models").Role.findOne({
        where: { id: roleId },
      });

      if (!role) {
        return res.status(400).json({
          success: false,
          message: "Invalid role selected",
        });
      }
    }

    // Update the staff member
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (roleId) {
      updateData.role_id = roleId; // Use snake_case for database
      updateData.role = (await require("../models").Role.findByPk(roleId)).name;
    }

    await staffMember.update(updateData);

    // Get the updated staff member
    const updatedStaff = await User.findByPk(staffId, {
      include: [
        {
          model: require("../models").Role,
          as: "rbacRole",
          attributes: ["id", "name", "displayName", "isSystemRole"],
        },
      ],
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "role",
        "isActive",
        "createdAt",
      ],
    });

    res.json({
      success: true,
      message: "Staff member updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update staff member",
    });
  }
};

/**
 * Delete a staff member with cascading deletion
 */
exports.deleteStaff = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction();

  try {
    const hostelId = getHostelIdFromRequest(req);
    const staffId = getIdFromRequest(req, "staffId");

    // Find the staff member with their role information
    const staffMember = await User.findOne({
      where: { id: staffId, hostelId },
      include: [
        {
          model: require("../models").Role,
          as: "rbacRole",
          attributes: ["id", "name", "isSystemRole"],
        },
      ],
      transaction,
    });

    if (!staffMember) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Don't allow deleting the owner
    if (staffMember.role === "owner") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot delete the hostel owner",
      });
    }

    console.log("🗑️ Starting cascading deletion for staff member:", {
      staffId,
      name: staffMember.name,
      role: staffMember.role,
      roleId: staffMember.roleId,
      isSystemRole: staffMember.rbacRole?.isSystemRole,
    });

    // 🚀 CASCADE DELETE: Handle all related records

    // 1. Check if this staff member created any custom roles
    const createdRoles = await require("../models").Role.findAll({
      where: {
        createdBy: staffId,
        hostelId: hostelId,
      },
      transaction,
    });

    console.log(
      "🗑️ Found custom roles created by staff member:",
      createdRoles.length
    );

    // 2. For each custom role created by this staff member:
    // ✅ PRESERVE ROLES: Don't delete the roles, just unassign users from them
    let usersReassigned = 0;
    for (const role of createdRoles) {
      console.log("� Preserving custom role but unassigning users:", role.name);

      // Update any users assigned to this role to remove the role assignment
      const updatedUsers = await User.update(
        { roleId: null, role: "student" }, // Reset to default student role
        {
          where: { roleId: role.id },
          transaction,
        }
      );

      usersReassigned += updatedUsers[0] || 0;

      // ✅ PRESERVE: Keep the role and its permissions intact
      // The role can be reassigned to other staff members later
      console.log(`🔄 Role "${role.name}" preserved for future assignment`);
    }

    // 3. Delete any complaints filed by this staff member
    const complaintsDeleted = await require("../models").Complaint.destroy({
      where: { userId: staffId },
      transaction,
    });
    console.log(
      "🗑️ Deleted complaints filed by staff member:",
      complaintsDeleted
    );

    // 4. Delete any room allocations for this staff member (if they were a student)
    const allocationsDeleted =
      await require("../models").RoomAllocation.destroy({
        where: { userId: staffId },
        transaction,
      });
    console.log("🗑️ Deleted room allocations:", allocationsDeleted);

    // 5. Delete any visitor logs where this staff member was the student
    const visitorLogsDeleted = await require("../models").VisitorLog.destroy({
      where: { studentId: staffId },
      transaction,
    });
    console.log("🗑️ Deleted visitor logs:", visitorLogsDeleted);

    // 6. Finally, delete the staff member themselves
    await staffMember.destroy({ transaction });

    // 7. Commit the transaction
    await transaction.commit();

    console.log(
      "✅ Successfully deleted staff member and handled related records"
    );

    res.json({
      success: true,
      message:
        "Staff member deleted successfully. Custom roles preserved for reassignment.",
      deletedRecords: {
        customRoles: 0, // Roles were preserved, not deleted
        rolesPreserved: createdRoles.length, // New field to indicate preserved roles
        usersReassigned: usersReassigned, // Users unassigned from preserved roles
        complaints: complaintsDeleted,
        roomAllocations: allocationsDeleted,
        visitorLogs: visitorLogsDeleted,
      },
    });
  } catch (error) {
    console.error("❌ Error during cascading deletion:", error);
    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: "Failed to delete staff member and related records",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Toggle staff member active status
 */
exports.toggleStaffStatus = async (req, res) => {
  try {
    const hostelId = getHostelIdFromRequest(req);
    const staffId = getIdFromRequest(req, "staffId");
    const { isActive } = req.body;

    // Find the staff member
    const staffMember = await User.findOne({
      where: { id: staffId, hostelId },
    });

    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Don't allow deactivating the owner
    if (staffMember.role === "owner" && !isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate the hostel owner",
      });
    }

    // Update the status
    await staffMember.update({ isActive });

    res.json({
      success: true,
      message: `Staff member ${
        isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling staff status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update staff status",
    });
  }
};
