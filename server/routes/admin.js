const express = require("express");
const router = express.Router();
const {
  getHostelStats,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAllWardens,
  createWarden,
  updateWarden,
  deleteWarden,
  allocateRoom,
  deallocateRoom,
  getAllComplaints,
  resolveComplaint,
  deleteComplaint,
  updateComplaintStatus,
  getAllVisitorLogs,
  createVisitorLog,
  checkoutVisitor,
  updateVisitorLog, // ✅ NEW
  deleteVisitorLog, // ✅ NEW
  getVisitorStats, // ✅ NEW
  exportVisitorLogs, // ✅ NEW
  exportStudents, // ✅ NEW
} = require("../controllers/adminController");
const { getUserHostels } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  validateHostelAccess,
} = require("../middleware/hostelAccessMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

// 🔧 SIMPLE MIDDLEWARE: Handle both URL-based and JWT-based hostelId
const flexibleHostelAccess = (req, res, next) => {
  // If hostelId is in URL params (owner routes), skip this middleware
  // The existing validateHostelAccess will handle it
  if (req.params.hostelId) {
    return next();
  }

  // If no hostelId in URL (warden routes), validate JWT has hostelId
  if (!req.user || !req.user.hostelId) {
    return res.status(400).json({
      success: false,
      message: "Hostel ID is required (either in URL or JWT)",
    });
  }

  // Set hostelId from JWT for warden routes
  req.hostelId = req.user.hostelId;
  next();
};

// Apply flexible hostel access validation to all admin routes
router.use(verifyToken, flexibleHostelAccess);

// For owner routes, we need to apply validateHostelAccess after the flexible middleware
// This ensures that owner routes still get proper hostel validation
router.use((req, res, next) => {
  if (req.params.hostelId) {
    return validateHostelAccess(req, res, next);
  }
  next();
});

// Dashboard & Analytics
router.get(
  "/stats",
  verifyToken,
  requirePermission("view_hostel_stats"),
  getHostelStats
);

// Hostel Management
router.get(
  "/hostels",
  verifyToken,
  requirePermission("hostel_read"),
  getUserHostels
);

// Room Management
router.get("/rooms", verifyToken, requirePermission("room_read"), getAllRooms);
router.post(
  "/rooms",
  verifyToken,
  requirePermission("room_create"),
  createRoom
);
router.put(
  "/rooms/:id",
  verifyToken,
  requirePermission("room_update"),
  updateRoom
);
router.delete(
  "/rooms/:id",
  verifyToken,
  requirePermission("room_delete"),
  deleteRoom
);

// Student Management
router.get(
  "/students",
  verifyToken,
  requirePermission("student_read"),
  getAllStudents
);
router.post(
  "/students",
  verifyToken,
  requirePermission("student_create"),
  createStudent
);
router.put(
  "/students/:id",
  verifyToken,
  requirePermission("student_update"),
  updateStudent
);
router.delete(
  "/students/:id",
  verifyToken,
  requirePermission("student_delete"),
  deleteStudent
);

// Warden Management
router.get(
  "/wardens",
  verifyToken,
  requirePermission("staff_read"),
  getAllWardens
);
router.post(
  "/wardens",
  verifyToken,
  requirePermission("staff_create"),
  createWarden
);
router.put(
  "/wardens/:id",
  verifyToken,
  requirePermission("staff_update"),
  updateWarden
);
router.delete(
  "/wardens/:id",
  verifyToken,
  requirePermission("staff_delete"),
  deleteWarden
);

// Room Allocation
router.post(
  "/allocate-room",
  verifyToken,
  requirePermission("room_allocation_create"),
  allocateRoom
);
router.put(
  "/deallocate-room/:allocationId",
  verifyToken,
  requirePermission("room_allocation_delete"),
  deallocateRoom
);

// Complaint Management
router.get(
  "/complaints",
  verifyToken,
  requirePermission("complaint_read"),
  getAllComplaints
);
router.put(
  "/complaints/:id",
  verifyToken,
  requirePermission("complaint_update"),
  updateComplaintStatus
);
router.put(
  "/complaints/:id/resolve",
  verifyToken,
  requirePermission("complaint_update"),
  resolveComplaint
);
router.put(
  "/complaints/:id",
  verifyToken,
  requirePermission("complaint_delete"),
  deleteComplaint
);

// Visitor Log Management
router.get(
  "/visitor-logs",
  verifyToken,
  requirePermission("visitor_read"),
  getAllVisitorLogs
);
router.post(
  "/visitor-logs",
  verifyToken,
  requirePermission("visitor_create"),
  createVisitorLog
);
router.put(
  "/visitor-logs/:id/checkout",
  verifyToken,
  requirePermission("visitor_update"),
  checkoutVisitor
);
router.put(
  "/visitor-logs/:id",
  verifyToken,
  requirePermission("visitor_update"),
  updateVisitorLog
); // ✅ NEW
router.delete(
  "/visitor-logs/:id",
  verifyToken,
  requirePermission("visitor_delete"),
  deleteVisitorLog
); // ✅ NEW
router.get(
  "/visitor-stats",
  verifyToken,
  requirePermission("visitor_read"),
  getVisitorStats
); // aligned
router.get(
  "/visitor-logs/export",
  verifyToken,
  requirePermission("export_visitor_data"),
  exportVisitorLogs
); // ✅ NEW

// ✅ Student export route
router.get(
  "/students/export",
  verifyToken,
  requirePermission("export_student_data"),
  exportStudents
); // ✅ NEW

module.exports = router;
