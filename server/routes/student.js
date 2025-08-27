const express = require('express');
const router = express.Router();
const {
  getMyRoom,
  getMyProfile,
  updateMyProfile,
  lodgeComplaint,
  getMyComplaints,
  getMyVisitorLogs,
  createMyVisitorLog,
  getDashboardSummary,
  updateMyComplaint,
  deleteMyComplaint,
  updateMyVisitorLog,      // ✅ NEW
  deleteMyVisitorLog,      // ✅ NEW
  checkoutMyVisitor        // ✅ NEW
} = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Dashboard
router.get('/dashboard', verifyToken, requireRole('student'), getDashboardSummary);

// Profile Management
router.get('/profile', verifyToken, requireRole('student'), getMyProfile);
router.put('/profile', verifyToken, requireRole('student'), updateMyProfile);

// Room Details
router.get('/room', verifyToken, requireRole('student'), getMyRoom);

// Complaint Management
router.post('/complaints', verifyToken, requireRole('student'), lodgeComplaint);
router.get('/complaints', verifyToken, requireRole('student'), getMyComplaints);
router.put('/complaints/:id', verifyToken, requireRole('student'), updateMyComplaint);
router.delete('/complaints/:id', verifyToken, requireRole('student'), deleteMyComplaint);

// Visitor Log Management
router.get('/visitor-logs', verifyToken, requireRole('student'), getMyVisitorLogs);
router.post('/visitor-logs', verifyToken, requireRole('student'), createMyVisitorLog);
router.put('/visitor-logs/:id', verifyToken, requireRole('student'), updateMyVisitorLog);    // ✅ NEW
router.delete('/visitor-logs/:id', verifyToken, requireRole('student'), deleteMyVisitorLog); // ✅ NEW
router.put('/visitor-logs/:id/checkout', verifyToken, requireRole('student'), checkoutMyVisitor); // ✅ NEW

module.exports = router; 