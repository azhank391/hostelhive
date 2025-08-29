const express = require('express');
const router = express.Router();
const { verifyToken, requireOwner, requireOwnerOrWarden, requireRole } = require('../middleware/authMiddleware');
const { validateHostelAccess, requireHostelOwner, requireHostelRole } = require('../middleware/hostelAccessMiddleware');

// Import controllers
const hostelController = require('../controllers/hostelController');
const adminController = require('../controllers/adminController');

// ========================================
// BASE HOSTEL ROUTES (No hostelId required)
// ========================================

/**
 * @route GET /api/hostels
 * @desc Get all hostels user has access to
 * @access Private (All authenticated users)
 */
router.get('/', verifyToken, hostelController.getUserHostels);

/**
 * @route POST /api/hostels
 * @desc Create a new hostel
 * @access Private (Owner only)
 */
router.post('/', verifyToken, requireOwner, hostelController.createHostel);

// ========================================
// HOSTEL-SPECIFIC ROUTES (require hostelId + access validation)
// ========================================

// Apply hostel access validation to all routes with :hostelId
router.use('/:hostelId', verifyToken, validateHostelAccess);

/**
 * @route GET /api/hostels/:hostelId
 * @desc Get specific hostel details
 * @access Private (Owner, Warden, Student of the hostel)
 */
router.get('/:hostelId', hostelController.getHostelDetails);

/**
 * @route PUT /api/hostels/:hostelId
 * @desc Update hostel details
 * @access Private (Owner only)
 */
router.put('/:hostelId', requireHostelOwner, hostelController.updateHostel);

// ========================================
// DASHBOARD ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/dashboard
 * @desc Get dashboard metrics for hostel
 * @access Private (Owner, Warden)
 */
router.get('/:hostelId/dashboard', requireHostelRole('owner', 'warden'), hostelController.getDashboardMetrics);

/**
 * @route GET /api/hostels/:hostelId/stats
 * @desc Get detailed stats for hostel
 * @access Private (Owner, Warden)
 */
router.get('/:hostelId/stats', requireHostelRole('owner', 'warden'), adminController.getHostelStats);

// ========================================
// VISITOR MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/visitors
 * @desc Get all visitors for hostel
 * @access Private (Owner, Warden)
 */
router.get('/:hostelId/visitors', requireHostelRole('owner', 'warden'), adminController.getAllVisitorLogs);

/**
 * @route POST /api/hostels/:hostelId/visitors
 * @desc Create new visitor log
 * @access Private (Owner, Warden)
 */
router.post('/:hostelId/visitors', requireHostelRole('owner', 'warden'), adminController.createVisitorLog);

/**
 * @route PUT /api/hostels/:hostelId/visitors/:visitorId
 * @desc Update visitor log
 * @access Private (Owner, Warden)
 */
router.put('/:hostelId/visitors/:visitorId', requireHostelRole('owner', 'warden'), adminController.updateVisitorLog);

/**
 * @route DELETE /api/hostels/:hostelId/visitors/:visitorId
 * @desc Delete visitor log
 * @access Private (Owner, Warden)
 */
router.delete('/:hostelId/visitors/:visitorId', requireHostelRole('owner', 'warden'), adminController.deleteVisitorLog);

/**
 * @route POST /api/hostels/:hostelId/visitors/:visitorId/checkout
 * @desc Checkout visitor
 * @access Private (Owner, Warden)
 */
router.post('/:hostelId/visitors/:visitorId/checkout', requireHostelRole('owner', 'warden'), adminController.checkoutVisitor);

// ========================================
// STUDENT MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/students
 * @desc Get all students for hostel
 * @access Private (Owner, Warden)
 */
router.get('/:hostelId/students', requireHostelRole('owner', 'warden'), adminController.getAllStudents);

/**
 * @route POST /api/hostels/:hostelId/students
 * @desc Create new student
 * @access Private (Owner, Warden)
 */
router.post('/:hostelId/students', requireHostelRole('owner', 'warden'), adminController.createStudent);

/**
 * @route PUT /api/hostels/:hostelId/students/:studentId
 * @desc Update student
 * @access Private (Owner, Warden)
 */
router.put('/:hostelId/students/:studentId', requireHostelRole('owner', 'warden'), adminController.updateStudent);

/**
 * @route DELETE /api/hostels/:hostelId/students/:studentId
 * @desc Delete student
 * @access Private (Owner, Warden)
 */
router.delete('/:hostelId/students/:studentId', requireHostelRole('owner', 'warden'), adminController.deleteStudent);

// ========================================
// COMPLAINT MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/complaints
 * @desc Get all complaints for hostel
 * @access Private (Owner, Warden, Student)
 */
router.get('/:hostelId/complaints', adminController.getAllComplaints);

/**
 * @route POST /api/hostels/:hostelId/complaints
 * @desc Create new complaint
 * @access Private (Owner, Warden, Student)
 */
router.post('/:hostelId/complaints', adminController.createComplaint);

/**
 * @route POST /api/hostels/:hostelId/complaints/:complaintId/resolve
 * @desc Resolve complaint
 * @access Private (Owner, Warden)
 */
router.post('/:hostelId/complaints/:complaintId/resolve', validateHostelAccess, requireHostelRole('owner', 'warden'), adminController.resolveComplaint);

/**
 * @route PUT /api/hostels/:hostelId/complaints/:complaintId/status
 * @desc Update complaint status and priority
 * @access Private (Owner, Warden)
 */
router.put('/:hostelId/complaints/:complaintId/status', validateHostelAccess, requireHostelRole('owner', 'warden'), adminController.updateComplaintStatus);

/**
 * @route DELETE /api/hostels/:hostelId/complaints/:complaintId
 * @desc Delete complaint
 * @access Private (Owner, Warden)
 */
router.delete('/:hostelId/complaints/:complaintId', validateHostelAccess, requireHostelRole('owner', 'warden'), adminController.deleteComplaint);

// ========================================
// ROOM MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/rooms
 * @desc Get all rooms for hostel
 * @access Private (Owner, Warden)
 */
router.get('/:hostelId/rooms', requireHostelRole('owner', 'warden'), adminController.getAllRooms);

/**
 * @route POST /api/hostels/:hostelId/rooms
 * @desc Create new room
 * @access Private (Owner, Warden)
 */
router.post('/:hostelId/rooms', requireHostelRole('owner', 'warden'), adminController.createRoom);

/**
 * @route PUT /api/hostels/:hostelId/rooms/:roomId
 * @desc Update room
 * @access Private (Owner, Warden)
 */
router.put('/:hostelId/rooms/:roomId', requireHostelRole('owner', 'warden'), adminController.updateRoom);

/**
 * @route DELETE /api/hostels/:hostelId/rooms/:roomId
 * @desc Delete room
 * @access Private (Owner, Warden)
 */
router.delete('/:hostelId/rooms/:roomId', requireHostelRole('owner', 'warden'), adminController.deleteRoom);

/**
 * @route GET /api/hostels/:hostelId/rooms/:roomId/students
 * @desc Get all students in a specific room
 * @access Private (Owner, Warden)
 */
router.get('/:hostelId/rooms/:roomId/students', requireHostelRole('owner', 'warden'), adminController.getRoomStudents);

// ========================================
// ROOM ALLOCATION ROUTES
// ========================================

/**
 * @route POST /api/hostels/:hostelId/room-allocations
 * @desc Allocate room to student
 * @access Private (Owner, Warden)
 */
router.post('/:hostelId/room-allocations', requireHostelRole('owner', 'warden'), adminController.allocateRoom);

/**
 * @route DELETE /api/hostels/:hostelId/room-allocations/:studentId
 * @desc Deallocate room from student (using student ID)
 * @access Private (Owner, Warden)
 */
router.delete('/:hostelId/room-allocations/:allocationId', requireHostelRole('owner', 'warden'), adminController.deallocateRoom);

// ========================================
// WARDEN MANAGEMENT ROUTES (Owner only)
// ========================================

/**
 * @route GET /api/hostels/:hostelId/wardens
 * @desc Get all wardens for hostel
 * @access Private (Owner)
 */
router.get('/:hostelId/wardens', requireHostelOwner, adminController.getAllWardens);

/**
 * @route POST /api/hostels/:hostelId/wardens
 * @desc Create new warden
 * @access Private (Owner)
 */
router.post('/:hostelId/wardens', requireHostelOwner, adminController.createWarden);

/**
 * @route PUT /api/hostels/:hostelId/wardens/:wardenId
 * @desc Update warden
 * @access Private (Owner)
 */
router.put('/:hostelId/wardens/:wardenId', requireHostelOwner, adminController.updateWarden);

/**
 * @route DELETE /api/hostels/:hostelId/wardens/:wardenId
 * @desc Delete warden
 * @access Private (Owner)
 */
router.delete('/:hostelId/wardens/:wardenId', requireHostelOwner, adminController.deleteWarden);

module.exports = router;
