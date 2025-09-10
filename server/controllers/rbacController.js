"use strict";

const rbacService = require('../services/rbacService');
const UnifiedDependencyResolver = require('../utils/unifiedDependencyResolver');

/**
 * 🔐 RBAC Controller
 * 
 * This controller handles all Role-Based Access Control operations including
 * user permissions, role management, and permission management.
 * 
 * @author HostelHive RBAC System
 * @version 1.0.0
 */

/**
 * Get user's role and permissions (for sidebar rendering)
 * @route GET /api/rbac/user-permissions
 * @access Private (All authenticated users)
 */
const getUserPermissions = async (req, res) => {
  try {
    console.log(`🔍 Fetching permissions for user: ${req.user.id}`);
    
    const userId = req.user.id;
    const userRoleData = await rbacService.getUserRoleAndPermissions(userId);
    
    console.log(`✅ User permissions fetched successfully for user: ${userId}`);
    
    res.json({
      success: true,
      data: userRoleData
    });
  } catch (error) {
    console.error('❌ Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all permissions (for role creation form)
 * @route GET /api/rbac/permissions
 * @access Private (Users with manage_roles permission)
 */
const getAllPermissions = async (req, res) => {
  try {
    console.log(`🔍 Fetching all permissions for user: ${req.user.id}`);
    
    const permissions = await rbacService.getAllPermissions();
    
    console.log(`✅ All permissions fetched successfully. Categories: ${Object.keys(permissions).length}`);
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get granular permissions grouped by category and operation
 * @route GET /api/rbac/permissions/granular
 * @access Private (Users with manage_roles permission)
 */
const getGranularPermissions = async (req, res) => {
  try {
    console.log(`🔍 Fetching granular permissions for user: ${req.user.id}`);
    
    const permissions = await rbacService.getGranularPermissions();
    
    // Group permissions by category and operation
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const { category, operation } = permission;
      
      if (!acc[category]) {
        acc[category] = {
          category,
          displayName: category.charAt(0).toUpperCase() + category.slice(1),
          operations: {}
        };
      }
      
      if (!acc[category].operations[operation]) {
        acc[category].operations[operation] = [];
      }
      
      acc[category].operations[operation].push({
        id: permission.id,
        name: permission.name,
        displayName: permission.displayName,
        description: permission.description,
        operation: permission.operation
      });
      
      return acc;
    }, {});
    
    console.log(`✅ Granular permissions fetched successfully. Categories: ${Object.keys(groupedPermissions).length}`);
    
    res.json({
      success: true,
      data: {
        permissions: groupedPermissions,
        totalCount: permissions.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching granular permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch granular permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get permission dependencies for a specific permission
 * @route GET /api/rbac/permissions/:permissionName/dependencies
 * @access Private (Users with manage_roles permission)
 */
const getPermissionDependencies = async (req, res) => {
  try {
    const { permissionName } = req.params;
    
    console.log(`🔍 Fetching dependencies for permission: ${permissionName}`);
    
    const dependencies = await UnifiedDependencyResolver.getUnifiedDependencies(permissionName);
    
    console.log(`✅ Dependencies fetched for ${permissionName}. Count: ${dependencies.length}`);
    
    res.json({
      success: true,
      data: {
        permission: permissionName,
        dependencies
      }
    });
  } catch (error) {
    console.error('❌ Error fetching permission dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permission dependencies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Validate permission assignment with dependencies
 * @route POST /api/rbac/permissions/validate
 * @access Private (Users with manage_roles permission)
 */
const validatePermissionAssignment = async (req, res) => {
  try {
    const { permissionNames } = req.body;
    
    if (!Array.isArray(permissionNames)) {
      return res.status(400).json({
        success: false,
        message: 'Permission names must be an array'
      });
    }
    
    console.log(`🔍 Validating permission assignment for ${permissionNames.length} permissions`);
    
    // Validate that all permissions exist
    const validation = { isValid: true, missingPermissions: [] };
    const { Permission } = require('../models');
    const existingPermissions = await Permission.findAll({
      where: { name: permissionNames },
      attributes: ['name']
    });
    const existingNames = existingPermissions.map(p => p.name);
    validation.missingPermissions = permissionNames.filter(name => !existingNames.includes(name));
    if (validation.missingPermissions.length > 0) {
      validation.isValid = false;
    }
    
    console.log(`✅ Permission validation completed. Valid: ${validation.isValid}`);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('❌ Error validating permission assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate permission assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all system roles
 * @route GET /api/rbac/system-roles
 * @access Private (Users with manage_roles permission)
 */
const getSystemRoles = async (req, res) => {
  try {
    console.log(`🔍 Fetching system roles for user: ${req.user.id}`);
    
    const systemRoles = await rbacService.getSystemRoles();
    
    console.log(`✅ System roles fetched successfully. Count: ${systemRoles.length}`);
    
    res.json({
      success: true,
      data: systemRoles
    });
  } catch (error) {
    console.error('❌ Error fetching system roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system roles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create custom role
 * @route POST /api/hostels/:hostelId/roles
 * @access Private (Users with manage_roles permission)
 */
const createCustomRole = async (req, res) => {
  try {
    const { name, displayName, description, permissionNames } = req.body;
    const createdById = req.user.id;
    const hostelId = req.params.hostelId;
    
    console.log(`🔍 Creating custom role '${displayName}' for hostel: ${hostelId} by user: ${createdById}`);
    
    // Validate required fields
    if (!name || !displayName || !permissionNames || permissionNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, display name, and at least one permission are required'
      });
    }
    
    // Validate permission names are provided
    if (!Array.isArray(permissionNames)) {
      return res.status(400).json({
        success: false,
        message: 'Permission names must be an array'
      });
    }
    
    // Use permission dependency resolver to create role with automatic dependencies
    // Use RBAC service to create role with dependencies
    const result = await rbacService.createCustomRole({
      name,
      displayName,
      description,
      hostelId,
      permissionNames
    }, createdById, hostelId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
    console.log(`✅ Custom role '${displayName}' created successfully with ID: ${result.role.id}`);
    console.log(`📋 Assigned ${result.permissions.resolvedCount} permissions (${result.permissions.originalCount} original + ${result.permissions.dependencies.length} dependencies)`);
    
    res.status(201).json({
      success: true,
      message: 'Custom role created successfully',
      data: {
        role: result.role,
        permissions: result.permissions
      }
    });
  } catch (error) {
    console.error('❌ Error creating custom role:', error);
    
    // Handle specific error cases
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create custom role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get hostel's custom roles
 * @route GET /api/hostels/:hostelId/roles
 * @access Private (Users with view_roles permission)
 */
const getCustomRoles = async (req, res) => {
  try {
    const hostelId = req.params.hostelId;
    
    console.log(`🔍 Fetching custom roles for hostel: ${hostelId}`);
    
    const roles = await rbacService.getHostelCustomRoles(hostelId);
    
    console.log(`✅ Custom roles fetched successfully. Count: ${roles.length}`);
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('❌ Error fetching custom roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom roles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update custom role
 * @route PUT /api/hostels/:hostelId/roles/:roleId
 * @access Private (Users with manage_roles permission)
 */
const updateCustomRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { displayName, description, permissionIds } = req.body;
    
    console.log(`🔍 Updating custom role: ${roleId} by user: ${req.user.id}`);
    
    // Validate permission IDs if provided
    if (permissionIds && !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'Permission IDs must be an array'
      });
    }
    
    const updatedRole = await rbacService.updateCustomRole(roleId, {
      displayName,
      description,
      permissionIds
    });
    
    console.log(`✅ Custom role ${roleId} updated successfully`);
    
    res.json({
      success: true,
      message: 'Custom role updated successfully',
      data: updatedRole
    });
  } catch (error) {
    console.error('❌ Error updating custom role:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found') || error.message.includes('cannot update system roles')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update custom role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete custom role
 * @route DELETE /api/hostels/:hostelId/roles/:roleId
 * @access Private (Users with manage_roles permission)
 */
const deleteCustomRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    console.log(`🔍 Deleting custom role: ${roleId} by user: ${req.user.id}`);
    
    const result = await rbacService.deleteCustomRole(roleId);
    
    console.log(`✅ Custom role ${roleId} deleted successfully`);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Error deleting custom role:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found') || error.message.includes('cannot delete system roles')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete custom role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Assign role to user
 * @route POST /api/hostels/:hostelId/users/:userId/assign-role
 * @access Private (Users with manage_roles permission)
 */
const assignRoleToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    
    console.log(`🔍 Assigning role ${roleId} to user ${userId} by user: ${req.user.id}`);
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }
    
    const updatedUser = await rbacService.assignRoleToUser(userId, roleId);
    
    console.log(`✅ Role ${roleId} assigned to user ${userId} successfully`);
    
    res.json({
      success: true,
      message: 'Role assigned to user successfully',
      data: {
        userId: updatedUser.id,
        roleId: updatedUser.roleId,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('❌ Error assigning role to user:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to assign role to user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if user has specific permission
 * @route POST /api/rbac/check-permission
 * @access Private (All authenticated users)
 */
const checkPermission = async (req, res) => {
  try {
    const { permissionName } = req.body;
    const userId = req.user.id;
    
    console.log(`🔍 Checking permission '${permissionName}' for user: ${userId}`);
    
    if (!permissionName) {
      return res.status(400).json({
        success: false,
        message: 'Permission name is required'
      });
    }
    
    const hasPermission = await rbacService.hasPermission(userId, permissionName);
    
    console.log(`✅ Permission check completed. User ${userId} has '${permissionName}': ${hasPermission}`);
    
    res.json({
      success: true,
      data: {
        hasPermission,
        permissionName,
        userId
      }
    });
  } catch (error) {
    console.error('❌ Error checking permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if user has any of the specified permissions
 * @route POST /api/rbac/check-any-permission
 * @access Private (All authenticated users)
 */
const checkAnyPermission = async (req, res) => {
  try {
    const { permissionNames } = req.body;
    const userId = req.user.id;
    
    console.log(`🔍 Checking any permission from [${permissionNames?.join(', ')}] for user: ${userId}`);
    
    if (!permissionNames || !Array.isArray(permissionNames) || permissionNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permission names array is required'
      });
    }
    
    const hasAnyPermission = await rbacService.hasAnyPermission(userId, permissionNames);
    
    console.log(`✅ Any permission check completed. User ${userId} has any of [${permissionNames.join(', ')}]: ${hasAnyPermission}`);
    
    res.json({
      success: true,
      data: {
        hasAnyPermission,
        permissionNames,
        userId
      }
    });
  } catch (error) {
    console.error('❌ Error checking any permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check any permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if user has all of the specified permissions
 * @route POST /api/rbac/check-all-permissions
 * @access Private (All authenticated users)
 */
const checkAllPermissions = async (req, res) => {
  try {
    const { permissionNames } = req.body;
    const userId = req.user.id;
    
    console.log(`🔍 Checking all permissions from [${permissionNames?.join(', ')}] for user: ${userId}`);
    
    if (!permissionNames || !Array.isArray(permissionNames) || permissionNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permission names array is required'
      });
    }
    
    const hasAllPermissions = await rbacService.hasAllPermissions(userId, permissionNames);
    
    console.log(`✅ All permissions check completed. User ${userId} has all of [${permissionNames.join(', ')}]: ${hasAllPermissions}`);
    
    res.json({
      success: true,
      data: {
        hasAllPermissions,
        permissionNames,
        userId
      }
    });
  } catch (error) {
    console.error('❌ Error checking all permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check all permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get page-specific dependencies
 * @route GET /api/rbac/pages/:pageName/dependencies
 * @access Private (Users with manage_roles permission)
 */
const getPageDependencies = async (req, res) => {
  try {
    const { pageName } = req.params;
    
    if (!pageName) {
      return res.status(400).json({
        success: false,
        message: 'Page name is required'
      });
    }
    
    // Get page dependencies using unified resolver
    const dependencies = await UnifiedDependencyResolver.getUnifiedDependencies(pageName);
    
    res.json({
      success: true,
      data: {
        pageName,
        dependencies
      }
    });
  } catch (error) {
    console.error('❌ Error getting page dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get page dependencies',
      error: error.message
    });
  }
};

/**
 * Get multiple permission dependencies
 * @route POST /api/rbac/permissions/multiple-dependencies
 * @access Private (Users with manage_roles permission)
 */
const getMultipleDependencies = async (req, res) => {
  try {
    const { permissions } = req.body;
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required'
      });
    }
    
    // Get dependencies for multiple permissions
    const allDependencies = new Set();
    for (const permission of permissions) {
      const deps = await UnifiedDependencyResolver.getUnifiedDependencies(permission);
      deps.forEach(dep => allDependencies.add(dep));
    }
    const dependencies = Array.from(allDependencies);
    
    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('❌ Error getting multiple dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get multiple dependencies',
      error: error.message
    });
  }
};

module.exports = {
  // User permission management
  getUserPermissions,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,

  // Permission management
  getAllPermissions,
  getGranularPermissions,
  getPermissionDependencies,
  validatePermissionAssignment,
  getPageDependencies,
  getMultipleDependencies,
  
  // Role management
  getSystemRoles,
  createCustomRole,
  getCustomRoles,
  updateCustomRole,
  deleteCustomRole,
  assignRoleToUser
};

