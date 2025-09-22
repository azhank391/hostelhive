const express = require("express");
const router = express.Router();
const {
  getMyRoom,
  getMyProfile,
  updateMyProfile,
  lodgeComplaint,
  getMyComplaints,
  getMyComplaintById,
  getMyVisitorLogs,
  createMyVisitorLog,
  getDashboardSummary,
  updateMyComplaint,
  deleteMyComplaint,
  updateMyVisitorLog, // ✅ NEW
  deleteMyVisitorLog, // ✅ NEW
  checkoutMyVisitor, // ✅ NEW
} = require("../controllers/studentController");
const { verifyToken } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { enforceQuota } = require("../middleware/quotaMiddleware");

// Dashboard
router.get(
  "/dashboard",
  verifyToken,
  requirePermission("view_own_data"),
  getDashboardSummary
);

// Hostel Information (for students only)
router.get("/my-hostel", verifyToken, async (req, res) => {
  try {
    const { Hostel } = require("../models");

    // Only allow students to access this endpoint
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Access denied. Only students can access this endpoint.",
      });
    }

    // Check if student has a hostel assigned
    if (!req.user.hostelId) {
      return res.status(400).json({
        message: "No hostel assigned to this student.",
      });
    }

    // Fetch hostel with only safe, student-relevant fields that exist in the model
    const hostel = await Hostel.findByPk(req.user.hostelId, {
      attributes: ["id", "name", "subdomain", "isActive", "plan_id", "email"],
    });

    if (!hostel) {
      return res.status(404).json({
        message: "Hostel not found.",
      });
    }

    // Check if hostel is active
    if (!hostel.isActive) {
      return res.status(403).json({
        message: "Your hostel is currently inactive.",
      });
    }

    res.json(hostel);
  } catch (error) {
    console.error("Error fetching student hostel:", error);
    res.status(500).json({
      message: "Failed to fetch hostel information.",
    });
  }
});

// Profile Management
router.get(
  "/profile",
  verifyToken,
  requirePermission("view_own_data"), // Changed from "profile_read"
  getMyProfile
);
router.put(
  "/profile",
  verifyToken,
  requirePermission("view_own_data"), // Changed from "profile_update"
  updateMyProfile
);

// Room Details
router.get("/room", verifyToken, requirePermission("view_own_data"), getMyRoom);

// Complaint Management
router.post(
  "/complaints",
  verifyToken,
  requirePermission("complaint_create"),
  enforceQuota('complaints'),
  lodgeComplaint
);
router.get(
  "/complaints",
  verifyToken,
  requirePermission("complaint_read"),
  getMyComplaints
);
router.get(
  "/complaints/:id",
  verifyToken,
  requirePermission("complaint_read"),
  getMyComplaintById
);
router.put(
  "/complaints/:id",
  verifyToken,
  requirePermission("complaint_update"),
  updateMyComplaint
);
router.delete(
  "/complaints/:id",
  verifyToken,
  requirePermission("complaint_delete"),
  deleteMyComplaint
);

// Visitor Log Management
router.get(
  "/visitor-logs",
  verifyToken,
  requirePermission("visitor_read"),
  getMyVisitorLogs
);
router.post(
  "/visitor-logs",
  verifyToken,
  requirePermission("visitor_create"),
  enforceQuota('visitors'),
  createMyVisitorLog
);
router.put(
  "/visitor-logs/:id",
  verifyToken,
  requirePermission("visitor_update"),
  updateMyVisitorLog
); // ✅ NEW
router.delete(
  "/visitor-logs/:id",
  verifyToken,
  requirePermission("visitor_delete"), // Ensure this is added
  deleteMyVisitorLog
); // ✅ NEW
router.put(
  "/visitor-logs/:id/checkout",
  verifyToken,
  requirePermission("visitor_update"), // Changed from "visitor_checkout"
  checkoutMyVisitor
); // ✅ NEW

module.exports = router;
