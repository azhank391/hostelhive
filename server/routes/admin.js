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
  getAllVisitorLogs,
  createVisitorLog,
  checkoutVisitor,
  updateVisitorLog, // ✅ NEW
  deleteVisitorLog, // ✅ NEW
  getVisitorStats, // ✅ NEW
  exportVisitorLogs, // ✅ NEW
} = require("../controllers/adminController");
const { getUserHostels } = require("../controllers/authController");
const {
  verifyToken,
  requireOwnerOrWarden,
  requireOwner,
} = require("../middleware/authMiddleware");
const {
  validateHostelAccess,
  requireHostelOwner,
} = require("../middleware/hostelAccessMiddleware");

// Apply hostel access validation to all admin routes
router.use(verifyToken, validateHostelAccess);

// Dashboard & Analytics (Owner or Warden)
router.get("/stats", requireOwnerOrWarden, getHostelStats);

// Hostel Management (Owner or Warden)
router.get("/hostels", requireOwnerOrWarden, getUserHostels);

// Room Management (Owner or Warden)
router.get("/rooms", requireOwnerOrWarden, getAllRooms);
router.post("/rooms", requireOwnerOrWarden, createRoom);
router.put("/rooms/:id", requireOwnerOrWarden, updateRoom);
router.delete("/rooms/:id", requireOwnerOrWarden, deleteRoom);

// Student Management (Owner or Warden)
router.get("/students", requireOwnerOrWarden, getAllStudents);
router.post("/students", requireOwnerOrWarden, createStudent);
router.put("/students/:id", requireOwnerOrWarden, updateStudent);
router.delete("/students/:id", requireOwnerOrWarden, deleteStudent);

// Warden Management (Owner only)
router.get("/wardens", requireOwner, getAllWardens);
router.post("/wardens", requireOwner, createWarden);
router.put("/wardens/:id", requireOwner, updateWarden);
router.delete("/wardens/:id", requireOwner, deleteWarden);

// Room Allocation (Owner or Warden)
router.post("/allocate-room", requireOwnerOrWarden, allocateRoom);
router.put(
  "/deallocate-room/:allocationId",
  requireOwnerOrWarden,
  deallocateRoom
);

// Complaint Management (Owner or Warden)
router.get("/complaints", requireOwnerOrWarden, getAllComplaints);
router.put("/complaints/:id/resolve", requireOwnerOrWarden, resolveComplaint);

// Visitor Log Management (Owner or Warden)
router.get("/visitor-logs", requireOwnerOrWarden, getAllVisitorLogs);
router.post("/visitor-logs", requireOwnerOrWarden, createVisitorLog);
router.put("/visitor-logs/:id", requireOwnerOrWarden, updateVisitorLog); // ✅ NEW
router.delete("/visitor-logs/:id", requireOwnerOrWarden, deleteVisitorLog); // ✅ NEW
router.put("/visitor-logs/:id/checkout", requireOwnerOrWarden, checkoutVisitor);
router.get("/visitor-stats", requireOwnerOrWarden, getVisitorStats); // ✅ NEW
router.get("/visitor-logs/export", requireOwnerOrWarden, exportVisitorLogs); // ✅ NEW

module.exports = router;
