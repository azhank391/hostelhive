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
    
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    // Extract search parameter
    const search = req.query.search;
    
    // Build where clause
    let whereClause = { hostelId };
    
    // Add search functionality if needed
    if (search) {
      whereClause.roomNumber = { [Op.like]: `%${search}%` };
    }

    // Get total count for pagination
    const total = await Room.count({ where: whereClause });
    
    // Get rooms with pagination
    const rooms = await Room.findAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

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
        hasPrev: page > 1
      }
    });
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
  console.log(`[updateRoom] Function called with params:`, req.params);
  console.log(`[updateRoom] Request body:`, req.body);
  console.log(`[updateRoom] User:`, req.user);
  
  try {
    // Extract hostelId and roomId from URL parameters
    const { hostelId, roomId } = req.params;
    const { roomNumber, capacity, block } = req.body;

    console.log(`[updateRoom] Updating room ${roomId} in hostel ${hostelId}`);
    console.log(`[updateRoom] Request body:`, { roomNumber, capacity, block });

    const room = await Room.findOne({ where: { id: roomId, hostelId } });
    if (!room) {
      console.log(`[updateRoom] Room ${roomId} not found in hostel ${hostelId}`);
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
      code: err.code
    });
    res.status(500).json({ 
      message: "Failed to update room",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    // Extract hostelId and roomId from URL parameters
    const { hostelId, roomId } = req.params;

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
    const { hostelId, roomId } = req.params;

    console.log(`[getRoomStudents] Fetching students for room ${roomId} in hostel ${hostelId}`);

    // Verify room exists and belongs to the hostel
    const room = await Room.findOne({ 
      where: { id: roomId, hostelId },
      attributes: ['id', 'roomNumber', 'capacity', 'occupied']
    });

    if (!room) {
      console.log(`[getRoomStudents] Room ${roomId} not found in hostel ${hostelId}`);
      return res.status(404).json({ message: "Room not found" });
    }

    // Get all students allocated to this specific room
    const students = await User.findAll({
      where: { 
        hostelId, 
        role: "student" 
      },
      include: [{
        model: RoomAllocation,
        as: "allocations",
        where: { 
          roomId, 
          status: "active" 
        },
        required: true
      }],
      attributes: [
        'id', 
        'name', 
        'email', 
        'role', 
        'hostelId'
      ],
      order: [['name', 'ASC']]
    });

    console.log(`[getRoomStudents] Found ${students.length} students in room ${roomId}`);

    res.json({
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        occupied: room.occupied
      },
      students,
      totalStudents: students.length
    });

  } catch (err) {
    console.error("Error fetching room students:", err);
    res.status(500).json({ message: "Failed to fetch room students" });
  }
};

// ✅ Student Management
exports.getAllStudents = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

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
          as: 'allocations',
          where: { status: 'active' },
          required: false,
          include: [
            {
              model: Room,
              as: 'room',
              attributes: ['id', 'roomNumber', 'capacity', 'occupied']
            }
          ]
        }
      ]
    });

    console.log(`[getAllStudents] Found ${students.length} students`);

    // Transform the data to include room information
    const studentsWithRooms = students.map(student => {
      const studentData = student.toJSON();
      if (studentData.allocations && studentData.allocations[0] && studentData.allocations[0].room) {
        studentData.roomNumber = studentData.allocations[0].room.roomNumber;
        studentData.roomId = studentData.allocations[0].room.id;
      }
      // Remove the complex allocations object for cleaner response
      delete studentData.allocations;
      return studentData;
    });

    console.log(`[getAllStudents] Returning ${studentsWithRooms.length} students with room data`);

    res.json(studentsWithRooms);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

exports.createStudent = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { name, email, phone } = req.body;

    console.log(`[createStudent] Creating student in hostel ${hostelId}`);
    console.log(`[createStudent] Request body:`, { name, email, phone });

    if (!name || !email) {
      return res
        .status(400)
        .json({ message: "Name and email are required" });
    }

    // Check if email already exists WITHIN THE SAME HOSTEL (not globally)
    const existingUser = await User.findOne({ where: { email, hostelId } });
    if (existingUser) {
      console.log(`[createStudent] Email ${email} already exists in hostel ${hostelId}`);
      return res
        .status(400)
        .json({ message: "Email already exists in this hostel" });
    }

    // Set default password for new students
    const defaultPassword = "123456";
    
    // Hash the default password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "student",
      hostelId,
      isActive: true,
      // Only students need to change their default password
      requiresPasswordChange: true
    });

    console.log(`[createStudent] Student created successfully:`, student.id);

    const { password: _, ...studentData } = student.toJSON();
    
    // Add a note about the default password in the response
    res.status(201).json({
      ...studentData,
      message: "Student created successfully with default password: 123456"
    });
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ message: "Failed to create student" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    // Extract hostelId and studentId from URL parameters
    const { hostelId, studentId } = req.params;
    const { name, email, phone } = req.body;

    console.log(`[updateStudent] Updating student ${studentId} in hostel ${hostelId}`);
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
      console.log(`[updateStudent] Student ${studentId} not found in hostel ${hostelId}`);
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
    // Extract hostelId and studentId from URL parameters
    const { hostelId, studentId } = req.params;

    console.log(`[deleteStudent] Deleting student ${studentId} from hostel ${hostelId}`);

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await User.findOne({
      where: { id: studentId, hostelId, role: "student" },
    });

    if (!student) {
      console.log(`[deleteStudent] Student ${studentId} not found in hostel ${hostelId}`);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log(`[deleteStudent] Found student:`, student.toJSON());

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

    // Hash the password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const warden = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "warden", // Always set to "warden"
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
    // Extract hostelId and wardenId from URL parameters
    const { hostelId } = req.params;
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
    // Extract hostelId and wardenId from URL parameters
    const { hostelId } = req.params;
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

// ✅ Room Allocation Management (Using RoomAllocation model)
exports.allocateRoom = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { studentId, roomId } = req.body;

    console.log(`[allocateRoom] Allocating room ${roomId} to student ${studentId} in hostel ${hostelId}`);

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
      console.log(`[allocateRoom] Student ${studentId} not found in hostel ${hostelId}`);
      return res.status(404).json({ message: "Student not found" });
    }
    if (!room) {
      console.log(`[allocateRoom] Room ${roomId} not found in hostel ${hostelId}`);
      return res.status(404).json({ message: "Room not found" });
    }

    console.log(`[allocateRoom] Found student:`, student.toJSON());
    console.log(`[allocateRoom] Found room:`, room.toJSON());

    // Check if student already has active allocation
    const existingAllocation = await RoomAllocation.findOne({
      where: { userId: studentId, status: "active" },
    });

    if (existingAllocation) {
      console.log(`[allocateRoom] Student ${studentId} already has active allocation`);
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
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { allocationId: studentId } = req.params; // Accept studentId instead of allocationId

    console.log(`[deallocateRoom] Deallocating student ${studentId} from hostel ${hostelId}`);

    // Find the active allocation for this student in this hostel
    const allocation = await RoomAllocation.findOne({
      where: { 
        userId: studentId, 
        hostelId, 
        status: "active" 
      },
      include: [{ model: Room, as: "room" }],
    });

    if (!allocation) {
      console.log(`[deallocateRoom] No active allocation found for student ${studentId} in hostel ${hostelId}`);
      return res.status(404).json({ message: "Active allocation not found for this student" });
    }

    console.log(`[deallocateRoom] Found allocation ${allocation.id} for student ${studentId} in room ${allocation.room.roomNumber}`);

    // Update allocation status
    await allocation.update({ status: "left" });

    // Update room occupancy
    await allocation.room.update({ occupied: allocation.room.occupied - 1 });

    console.log(`[deallocateRoom] Successfully deallocated student ${studentId} from room ${allocation.room.roomNumber}`);

    res.json({ message: "Room deallocated successfully" });
  } catch (err) {
    console.error("Error deallocating room:", err);
    res.status(500).json({ message: "Failed to deallocate room" });
  }
};

// ✅ Complaint Management
exports.createComplaint = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
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
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { page = 1, limit = 10, status, priority, search } = req.query;

    // Build where clause
    const whereClause = { hostelId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
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
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages
      }
    });
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
    const { status, priority } = req.body;

    const complaint = await Complaint.findOne({
      where: { id, hostelId },
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
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const complaint = await Complaint.findOne({
      where: { id, hostelId },
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

exports.getAllVisitorLogs = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

    const visitorLogs = await VisitorLog.findAll({
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

    res.json(visitorLogs);
  } catch (err) {
    console.error("Error fetching visitor logs:", err);
    res.status(500).json({ message: "Failed to fetch visitor logs" });
  }
};

exports.createVisitorLog = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

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
      hostelId
    });

    res.status(201).json(visitorLog);
  } catch (err) {
    console.error("Error creating visitor log:", err);
    res.status(500).json({ message: "Failed to create visitor log" });
  }
};

exports.checkoutVisitor = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { visitorId } = req.params;

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
      checkOut: new Date()
    });
    
    res.json({ message: "Visitor checked out successfully", visitor });
  } catch (err) {
    console.error("Error checking out visitor:", err);
    res.status(500).json({ message: "Failed to check out visitor" });
  }
};

exports.updateVisitorLog = async (req, res) => {
  try {
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
    const { id } = req.params;
    const updateData = req.body;

    const visitor = await VisitorLog.findOne({
      where: { id, hostelId },
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
    // Extract hostelId from URL parameters and visitorId from route params
    const { hostelId } = req.params;
    const { visitorId } = req.params;

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
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;

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
    // Extract hostelId from URL parameters
    const { hostelId } = req.params;
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
          attributes: ["name", "email"],
        },
      ],
      order: [["checkIn", "DESC"]],
    });

    if (format === "csv") {
      // Convert to CSV format
      const csvData = [
        ["Visitor Name", "Relation", "Student Name", "Check In", "Check Out"],
        ...visitorLogs.map((log) => [
          log.visitorName,
          log.relation,
          log.student?.name || "N/A",
          log.checkIn?.toISOString() || "N/A",
          log.checkOut?.toISOString() || "Not checked out",
        ]),
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
      res.json({
        count: visitorLogs.length,
        visitorLogs,
      });
    }
  } catch (err) {
    console.error("Error exporting visitor logs:", err);
    res.status(500).json({ message: "Failed to export visitor logs" });
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
