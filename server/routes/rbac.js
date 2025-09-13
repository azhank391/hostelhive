"use strict";

const express = require('express');
const router = express.Router();

// Import middleware
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  requirePermission
} = require('../middleware/permissionMiddleware');

// Import controller
const rbacController = require('../controllers/rbacController');

/**
 * 🔐 RBAC Routes
 * 
 * This router handles all Role-Based Access Control operations including
 * user permissions, role management, and permission management.
 * 
 * @author HostelHive RBAC System
 * @version 1.0.0
 */

// ========================================
// USER PERMISSION ROUTES
// ========================================

/**
 * @route GET /api/rbac/user-permissions
 * @desc Get user's role and permissions (for sidebar rendering)
 * @access Private (All authenticated users)
 */
router.get('/user-permissions', verifyToken, rbacController.getUserPermissions);

/**
 * @route POST /api/rbac/check-permission
 * @desc Check if user has specific permission
 * @access Private (All authenticated users)
 */
router.post('/check-permission', verifyToken, rbacController.checkPermission);

/**
 * @route POST /api/rbac/check-any-permission
 * @desc Check if user has any of the specified permissions
 * @access Private (All authenticated users)
 */
router.post('/check-any-permission', verifyToken, rbacController.checkAnyPermission);

/**
 * @route POST /api/rbac/check-all-permissions
 * @desc Check if user has all of the specified permissions
 * @access Private (All authenticated users)
 */
router.post('/check-all-permissions', verifyToken, rbacController.checkAllPermissions);

// ========================================
// PERMISSION MANAGEMENT ROUTES
// ========================================

/**
 * @route GET /api/rbac/permissions
 * @desc Get all permissions (for role creation form)
 * @access Private (Users with staff_create permission)
 */
router.get('/permissions', verifyToken, requirePermission('staff_create'), rbacController.getAllPermissions);

/**
 * @route GET /api/rbac/permissions/granular
 * @desc Get granular permissions grouped by category and operation
 * @access Private (Users with staff_create permission)
 */
router.get('/permissions/granular', verifyToken, requirePermission('staff_create'), rbacController.getGranularPermissions);

/**
 * @route GET /api/rbac/permissions/:permissionName/dependencies
 * @desc Get permission dependencies for a specific permission
 * @access Private (Users with staff_create permission)
 */
router.get('/permissions/:permissionName/dependencies', verifyToken, requirePermission('staff_create'), rbacController.getPermissionDependencies);

/**
 * @route POST /api/rbac/permissions/validate
 * @desc Validate permission assignment with dependencies
 * @access Private (Users with staff_create permission)
 */
router.post('/permissions/validate', verifyToken, requirePermission('staff_create'), rbacController.validatePermissionAssignment);

/**
 * @route GET /api/rbac/pages/:pageName/dependencies
 * @desc Get page-specific dependencies based on frontend analysis
 * @access Private (Users with staff_create permission)
 */
router.get('/pages/:pageName/dependencies', verifyToken, requirePermission('staff_create'), rbacController.getPageDependencies);

/**
 * @route POST /api/rbac/permissions/multiple-dependencies
 * @desc Get dependencies for multiple permissions
 * @access Private (Users with staff_create permission)
 */
router.post('/permissions/multiple-dependencies', verifyToken, requirePermission('staff_create'), rbacController.getMultipleDependencies);

// ========================================
// SYSTEM ROLE ROUTES
// ========================================

/**
 * @route GET /api/rbac/system-roles
 * @desc Get all system roles
 * @access Private (Users with staff_create permission)
 */
router.get('/system-roles', verifyToken, requirePermission('staff_create'), rbacController.getSystemRoles);

// ========================================
// HOSTEL-SPECIFIC ROLE ROUTES
// ========================================

/**
 * @route GET /api/hostels/:hostelId/roles
 * @desc Get hostel's custom roles
 * @access Private (Users with staff_read permission)
 */
router.get('/hostels/:hostelId/roles', verifyToken, requirePermission('staff_read'), rbacController.getCustomRoles);

/**
 * @route POST /api/hostels/:hostelId/roles
 * @desc Create custom role
 * @access Private (Users with staff_create permission)
 */
router.post('/hostels/:hostelId/roles', verifyToken, requirePermission('staff_create'), rbacController.createCustomRole);

/**
 * @route PUT /api/hostels/:hostelId/roles/:roleId
 * @desc Update custom role
 * @access Private (Users with staff_update permission)
 */
router.put('/hostels/:hostelId/roles/:roleId', verifyToken, requirePermission('staff_update'), rbacController.updateCustomRole);

/**
 * @route DELETE /api/hostels/:hostelId/roles/:roleId
 * @desc Delete custom role
 * @access Private (Users with staff_delete permission)
 */
router.delete('/hostels/:hostelId/roles/:roleId', verifyToken, requirePermission('staff_delete'), rbacController.deleteCustomRole);

// ========================================
// USER ROLE ASSIGNMENT ROUTES
// ========================================

/**
 * @route POST /api/hostels/:hostelId/users/:userId/assign-role
 * @desc Assign role to user
 * @access Private (Users with staff_assign permission)
 */
router.post('/hostels/:hostelId/users/:userId/assign-role', verifyToken, requirePermission('role_assign'), rbacController.assignRoleToUser);

module.exports = router;




