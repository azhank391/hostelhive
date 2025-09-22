const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  validateHostelAccess,
} = require("../middleware/hostelAccessMiddleware");

// Import permission middleware
const {
  requirePermission,
  requireOwnerOrPermission,
} = require("../middleware/permissionMiddleware");

// Import controllers
const hostelController = require("../controllers/hostelController");
const adminController = require("../controllers/adminController");
const { enforceQuota } = require("../middleware/quotaMiddleware");

// ========================================
// BASE HOSTEL ROUTES (No hostelId required)
// ========================================

/**
 * @route GET /api/hostels
 * @desc Get all hostels user has access to
 * @access Private (All authenticated users with hostel_read permission)
 */
router.get(
  "/",
  verifyToken,
  requirePermission("hostel_read"),
  hostelController.getUserHostels
);

/**
 * @route POST /api/hostels
 * @desc Create a new hostel
 * @access Private (Owners can create their first hostel, or users with hostel_create permission)
 */
router.post(
  "/",
  verifyToken,
  requireOwnerOrPermission("hostel_create"),
  enforceQuota('hostels'),
  hostelController.createHostel
);

// ========================================
// HOSTEL-SPECIFIC ROUTES (require hostelId + access validation)
// ========================================

// Apply hostel access validation and permission middleware to all routes with :hostelId
router.use("/:hostelId", verifyToken, validateHostelAccess);

/**
 * @route GET /api/hostels/:hostelId
 * @desc Get specific hostel details
 * @access Private (Users with hostel_read permission)
 */
router.get(
  "/:hostelId",
  requirePermission("hostel_read"),
  hostelController.getHostelDetails
);

/**
 * @route PUT /api/hostels/:hostelId
 * @desc Update hostel details
 * @access Private (Users with hostel_update permission)
 */
router.put(
  "/:hostelId",
  requirePermission("hostel_update"),
  hostelController.updateHostel
);

/**
 * @route DELETE /api/hostels/:hostelId
 * @desc Delete hostel (Owner only)
 * @access Private (Users with hostel_delete permission)
 */
router.delete(
  "/:hostelId",
  requirePermission("hostel_delete"),
  hostelController.deleteHostel
);

// ========================================
// DASHBOARD ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/dashboard
 * @desc Get hostel dashboard metrics
 * @access Private (Users with hostel_read permission)
 */
router.get(
  "/:hostelId/dashboard",
  requirePermission("hostel_read"),
  hostelController.getDashboardMetrics
);

// ========================================
// STATS & ANALYTICS ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/stats
 * @desc Get hostel statistics
 * @access Private (Users with hostel_stats_read permission)
 */
router.get(
  "/:hostelId/stats",
  requirePermission("view_hostel_stats"),
  adminController.getHostelStats
);

/**
 * @route GET /api/hostels/:hostelId/stats
 * @desc Get detailed stats for hostel
 * @access Private (Users with view_hostel permission)
 */
router.get(
  "/:hostelId/stats",
  requirePermission("hostel_read"),
  adminController.getHostelStats
);

// ========================================
// VISITOR MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/visitors
 * @desc Get all visitors for hostel
 * @access Private (Users with visitor_read permission)
 */
router.get(
  "/:hostelId/visitors",
  requirePermission("visitor_read"),
  adminController.getAllVisitorLogs
);

/**
 * @route POST /api/hostels/:hostelId/visitors
 * @desc Create new visitor log
 * @access Private (Users with visitor_create permission)
 */
router.post(
  "/:hostelId/visitors",
  requirePermission("visitor_create"),
  enforceQuota('visitors'),
  adminController.createVisitorLog
);

/**
 * @route PUT /api/hostels/:hostelId/visitors/:visitorId
 * @desc Update visitor log
 * @access Private (Users with visitor_update permission)
 */
router.put(
  "/:hostelId/visitors/:visitorId",
  requirePermission("visitor_update"),
  adminController.updateVisitorLog
);

/**
 * @route DELETE /api/hostels/:hostelId/visitors/:visitorId
 * @desc Delete visitor log
 * @access Private (Users with visitor_delete permission)
 */
router.delete(
  "/:hostelId/visitors/:visitorId",
  requirePermission("visitor_delete"),
  adminController.deleteVisitorLog
);

/**
 * @route POST /api/hostels/:hostelId/visitors/:visitorId/checkout
 * @desc Checkout visitor
 * @access Private (Users with visitor_update permission)
 */
router.post(
  "/:hostelId/visitors/:visitorId/checkout",
  requirePermission("visitor_update"),
  adminController.checkoutVisitor
);

/**
 * @route GET /api/hostels/:hostelId/visitors/export?format=csv|json
 * @desc Export visitor logs (hostel scoped)
 * @access Private (Users with export_visitor_data permission)
 */
router.get(
  "/:hostelId/visitors/export",
  requirePermission("export_visitor_data"),
  adminController.exportVisitorLogs
);

// ========================================
// STUDENT MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/students
 * @desc Get all students for hostel
 * @access Private (Users with student_read permission)
 */
router.get(
  "/:hostelId/students",
  requirePermission("student_read"),
  adminController.getAllStudents
);

/**
 * @route POST /api/hostels/:hostelId/students
 * @desc Create new student
 * @access Private (Users with student_create permission)
 */
router.post(
  "/:hostelId/students",
  requirePermission("student_create"),
  enforceQuota('students'),
  adminController.createStudent
);

/**
 * @route PUT /api/hostels/:hostelId/students/:studentId
 * @desc Update student
 * @access Private (Users with student_update permission)
 */
router.put(
  "/:hostelId/students/:studentId",
  requirePermission("student_update"),
  adminController.updateStudent
);

/**
 * @route DELETE /api/hostels/:hostelId/students/:studentId
 * @desc Delete student
 * @access Private (Users with student_delete permission)
 */
router.delete(
  "/:hostelId/students/:studentId",
  requirePermission("student_delete"),
  adminController.deleteStudent
);

/**
 * @route GET /api/hostels/:hostelId/students/export
 * @desc Export students data
 * @access Private (Users with export_student_data permission)
 */
router.get(
  "/:hostelId/students/export",
  requirePermission("export_student_data"),
  adminController.exportStudents
);

// ========================================
// COMPLAINT MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/complaints
 * @desc Get all complaints for hostel
 * @access Private (Users with complaint_read permission)
 */
router.get(
  "/:hostelId/complaints",
  requirePermission("complaint_read"),
  adminController.getAllComplaints
);

/**
 * @route POST /api/hostels/:hostelId/complaints
 * @desc Create new complaint
 * @access Private (Users with complaint_create permission)
 */
router.post(
  "/:hostelId/complaints",
  requirePermission("complaint_create"),
  enforceQuota('complaints'),
  adminController.createComplaint
);

/**
 * @route POST /api/hostels/:hostelId/complaints/:complaintId/resolve
 * @desc Resolve complaint
 * @access Private (Users with complaint_resolve permission)
 */
router.post(
  "/:hostelId/complaints/:complaintId/resolve",
  requirePermission("complaint_update"),
  adminController.resolveComplaint
);

/**
 * @route PUT /api/hostels/:hostelId/complaints/:complaintId/status
 * @desc Update complaint status and priority
 * @access Private (Users with complaint_update permission)
 */
router.put(
  "/:hostelId/complaints/:complaintId/status",
  requirePermission("complaint_update"),
  adminController.updateComplaintStatus
);

/**
 * @route DELETE /api/hostels/:hostelId/complaints/:complaintId
 * @desc Delete complaint
 * @access Private (Users with complaint_delete permission)
 */
router.delete(
  "/:hostelId/complaints/:complaintId",
  requirePermission("complaint_delete"),
  adminController.deleteComplaint
);

/**
 * @route GET /api/hostels/:hostelId/complaints/export?format=csv|json
 * @desc Export complaints for a hostel
 * @access Private (Users with export_complaint_data permission)
 */
router.get(
  "/:hostelId/complaints/export",
  requirePermission("export_complaint_data"),
  adminController.exportComplaints
);

// ========================================
// ROOM MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/rooms
 * @desc Get all rooms for hostel
 * @access Private (Users with room_read permission)
 */
router.get(
  "/:hostelId/rooms",
  requirePermission("room_read"),
  adminController.getAllRooms
);

/**
 * @route POST /api/hostels/:hostelId/rooms
 * @desc Create new room
 * @access Private (Users with room_create permission)
 */
router.post(
  "/:hostelId/rooms",
  requirePermission("room_create"),
  enforceQuota('rooms'),
  adminController.createRoom
);

/**
 * @route PUT /api/hostels/:hostelId/rooms/:roomId
 * @desc Update room
 * @access Private (Users with room_update permission)
 */
router.put(
  "/:hostelId/rooms/:roomId",
  requirePermission("room_update"),
  adminController.updateRoom
);

/**
 * @route DELETE /api/hostels/:hostelId/rooms/:roomId
 * @desc Delete room
 * @access Private (Users with room_delete permission)
 */
router.delete(
  "/:hostelId/rooms/:roomId",
  requirePermission("room_delete"),
  adminController.deleteRoom
);

/**
 * @route GET /api/hostels/:hostelId/rooms/:roomId/students
 * @desc Get all students in a specific room
 * @access Private (Users with room_allocation_read permission)
 */
router.get(
  "/:hostelId/rooms/:roomId/students",
  requirePermission("room_allocation_read"),
  adminController.getRoomStudents
);

/**
 * @route GET /api/hostels/:hostelId/rooms/export?format=csv|json
 * @desc Export rooms list
 * @access Private (Users with export_room_data permission)
 */
router.get(
  "/:hostelId/rooms/export",
  requirePermission("export_room_data"),
  adminController.exportRooms
);

// ========================================
// ROOM ALLOCATION ROUTES
// ========================================

/**
 * @route POST /api/hostels/:hostelId/room-allocations
 * @desc Allocate room to student
 * @access Private (Users with room_allocation_create permission)
 */
router.post(
  "/:hostelId/room-allocations",
  requirePermission("room_allocation_create"),
  adminController.allocateRoom
);

/**
 * @route DELETE /api/hostels/:hostelId/room-allocations/:allocationId
 * @desc Deallocate room from student
 * @access Private (Users with room_allocation_delete permission)
 */
router.delete(
  "/:hostelId/room-allocations/:allocationId",
  requirePermission("room_allocation_delete"),
  adminController.deallocateRoom
);

// ========================================
// WARDEN MANAGEMENT ROUTES (Owner only)
// ========================================

/**
 * @route GET /api/hostels/:hostelId/wardens
 * @desc Get all wardens for hostel
 * @access Private (Users with staff_read permission)
 */
router.get(
  "/:hostelId/wardens",
  requirePermission("staff_read"),
  adminController.getAllWardens
);

/**
 * @route POST /api/hostels/:hostelId/wardens
 * @desc Create new warden
 * @access Private (Users with staff_create permission)
 */
router.post(
  "/:hostelId/wardens",
  requirePermission("staff_create"),
  enforceQuota('wardens'),
  adminController.createWarden
);

/**
 * @route PUT /api/hostels/:hostelId/wardens/:wardenId
 * @desc Update warden
 * @access Private (Users with staff_update permission)
 */
router.put(
  "/:hostelId/wardens/:wardenId",
  requirePermission("staff_update"),
  adminController.updateWarden
);

/**
 * @route DELETE /api/hostels/:hostelId/wardens/:wardenId
 * @desc Delete warden
 * @access Private (Users with staff_delete permission)
 */
router.delete(
  "/:hostelId/wardens/:wardenId",
  requirePermission("staff_delete"),
  adminController.deleteWarden
);

// ========================================
// STAFF MANAGEMENT ROUTES (Owner only)
// ========================================

/**
 * @route GET /api/hostels/:hostelId/staff
 * @desc Get all staff members for hostel
 * @access Private (Users with staff_read permission)
 */
router.get(
  "/:hostelId/staff",
  requirePermission("staff_read"),
  adminController.getAllStaff
);

/**
 * @route POST /api/hostels/:hostelId/staff
 * @desc Create new staff member
 * @access Private (Users with staff_create permission)
 */
router.post(
  "/:hostelId/staff",
  requirePermission("staff_create"),
  enforceQuota('staff'),
  adminController.createStaff
);

/**
 * @route PUT /api/hostels/:hostelId/staff/:staffId
 * @desc Update staff member
 * @access Private (Users with staff_update permission)
 */
router.put(
  "/:hostelId/staff/:staffId",
  requirePermission("staff_update"),
  adminController.updateStaff
);

/**
 * @route DELETE /api/hostels/:hostelId/staff/:staffId
 * @desc Delete staff member
 * @access Private (Users with staff_delete permission)
 */
router.delete(
  "/:hostelId/staff/:staffId",
  requirePermission("staff_delete"),
  adminController.deleteStaff
);

/**
 * @route PATCH /api/hostels/:hostelId/staff/:staffId/status
 * @desc Toggle staff member active status
 * @access Private (Users with staff_update permission)
 */
router.patch(
  "/:hostelId/staff/:staffId/status",
  requirePermission("staff_update"),
  adminController.toggleStaffStatus
);

/**
 * @route GET /api/hostels/:hostelId/staff/export?format=csv|json
 * @desc Export staff list
 * @access Private (Users with export_staff_data permission)
 */
router.get(
  "/:hostelId/staff/export",
  requirePermission("export_staff_data"),
  adminController.exportStaff
);

module.exports = router;
