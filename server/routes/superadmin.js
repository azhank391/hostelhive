const express = require('express');
const router = express.Router();
const {
  loginSuperadmin,
  getDashboardData,
  registerHostel,
  getAllHostels,
  getHostelDetails,
  updateHostelPlan,
  updateHostelStatus,
  updateBillingStatus,
  deleteHostel,
  getHostelsByRegion,
  getBillingOverview,
  createOwner,
  getHostelStudents
} = require('../controllers/superadminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Authentication
router.post('/login', loginSuperadmin);

// Dashboard & Analytics
router.get('/dashboard', verifyToken, requireRole('superadmin'), getDashboardData);
router.get('/billing-overview', verifyToken, requireRole('superadmin'), getBillingOverview);

// Owner Management
router.post('/owners', verifyToken, requireRole('superadmin'), createOwner);

// Hostel Management
router.post('/hostels', verifyToken, requireRole('superadmin'), registerHostel);
router.get('/hostels', verifyToken, requireRole('superadmin'), getAllHostels);
router.get('/hostels/:id', verifyToken, requireRole('superadmin'), getHostelDetails);
router.get('/hostels/:id/students', verifyToken, requireRole('superadmin'), getHostelStudents);
router.put('/hostels/:id/plan', verifyToken, requireRole('superadmin'), updateHostelPlan);
router.put('/hostels/:id/status', verifyToken, requireRole('superadmin'), updateHostelStatus);
router.put('/hostels/:id/billing', verifyToken, requireRole('superadmin'), updateBillingStatus);
router.delete('/hostels/:id', verifyToken, requireRole('superadmin'), deleteHostel);

// Regional Analysis
router.get('/hostels-by-region', verifyToken, requireRole('superadmin'), getHostelsByRegion);

module.exports = router;
