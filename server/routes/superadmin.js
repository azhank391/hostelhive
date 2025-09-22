const express = require('express');
const router = express.Router();
const {
  loginSuperadmin,
  getDashboardData,
  registerHostel,
  getAllHostels,
  getHostelDetails,
  updateHostelStatus,
  updateBillingStatus,
  deleteHostel,
  getHostelsByRegion,
  getBillingOverview,
  createOwner,
  getHostelStudents
} = require('../controllers/superadminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  requirePermission
} = require('../middleware/permissionMiddleware');

// Authentication
router.post('/login', loginSuperadmin);

// Dashboard & Analytics
router.get('/dashboard', verifyToken, requirePermission('view_dashboard'), getDashboardData);
router.get('/billing-overview', verifyToken, requirePermission('billing_read'), getBillingOverview);

// Owner Management
router.post('/owners', verifyToken, requirePermission('owner_manage'), createOwner);

// Hostel Management
router.post('/hostels', verifyToken, requirePermission('hostel_global_manage'), registerHostel);
router.get('/hostels', verifyToken, requirePermission('hostel_global_manage'), getAllHostels);
router.get('/hostels/:id', verifyToken, requirePermission('hostel_global_manage'), getHostelDetails);
router.get('/hostels/:id/students', verifyToken, requirePermission('hostel_global_manage'), getHostelStudents);
router.put('/hostels/:id/status', verifyToken, requirePermission('hostel_global_manage'), updateHostelStatus);
router.put('/hostels/:id/billing', verifyToken, requirePermission('billing_manage'), updateBillingStatus);
router.delete('/hostels/:id', verifyToken, requirePermission('hostel_global_manage'), deleteHostel);

// Regional Analysis
router.get('/hostels-by-region', verifyToken, requirePermission('system_stats_read'), getHostelsByRegion);

module.exports = router;
