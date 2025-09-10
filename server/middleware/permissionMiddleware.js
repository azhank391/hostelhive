"use strict";

const rbacService = require('../services/rbacService');

/**
 * 🔐 Permission Middleware
 * 
 * This middleware provides permission-based access control for routes.
 * It integrates with the RBAC service to check user permissions before
 * allowing access to protected endpoints.
 * 
 * @author HostelHive RBAC System
 * @version 1.0.0
 */

/**
 * Check for specific permission
 * @param {string} permissionName - Required permission name
 * @returns {Function} Express middleware function
 */
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Permission Check: Checking '${permissionName}' for user: ${req.user?.id}`);
      
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Owner role should have all permissions (legacy support)
      if (userRole === 'owner') {
        console.log(`✅ Owner Access Granted: User ${userId} has all permissions including '${permissionName}'`);
        return next();
      }
      
      // Superadmin has all permissions
      if (userRole === 'superadmin') {
        console.log(`✅ Superadmin Access Granted: User ${userId} has all permissions including '${permissionName}'`);
        return next();
      }
      
      // For other roles, check RBAC permissions
      try {
        let hasPermission = false;
        
        // First, try to use permissions directly from JWT token (fastest method)
        if (req.user.permissions && Array.isArray(req.user.permissions)) {
          hasPermission = req.user.permissions.includes(permissionName);
          console.log(`🔍 Using JWT permissions: [${req.user.permissions.join(', ')}] - ${hasPermission ? 'HAS' : 'DOES NOT HAVE'} '${permissionName}'`);
        } else if (req.userPermissions && Array.isArray(req.userPermissions)) {
          // Fallback to req.userPermissions if available (set by addUserPermissions middleware)
          hasPermission = req.userPermissions.includes(permissionName);
          console.log(`🔍 Using req.userPermissions: [${req.userPermissions.join(', ')}] - ${hasPermission ? 'HAS' : 'DOES NOT HAVE'} '${permissionName}'`);
        } else {
          // Last resort: database call for legacy tokens
          console.log(`🔍 No permissions in JWT or req, making database call for '${permissionName}'`);
          hasPermission = await rbacService.hasPermission(userId, permissionName);
        }
        
        if (!hasPermission) {
          console.log(`❌ Permission Denied: User ${userId} lacks permission '${permissionName}'`);
          return res.status(403).json({
            success: false,
            message: `Access denied. Required permission: ${permissionName}`,
            required_permission: permissionName,
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
        
        console.log(`✅ Permission Granted: User ${userId} has permission '${permissionName}'`);
        next();
      } catch (rbacError) {
        console.error('❌ RBAC permission check failed:', rbacError);
        // If RBAC check fails, fall back to legacy role check for backward compatibility
        if (userRole === 'warden' || userRole === 'student') {
          console.log(`✅ Legacy role access granted: User ${userId} with role ${userRole} has access`);
          return next();
        }
        
        // For unknown roles or RBAC failures, deny access
        console.log(`❌ Permission Denied: User ${userId} with role ${userRole} lacks permission '${permissionName}' - RBAC failed and no legacy support`);
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permissionName}`,
          required_permission: permissionName,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    } catch (error) {
      console.error('❌ Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Check for multiple permissions (user must have at least one)
 * @param {string[]} permissionNames - Array of permission names
 * @returns {Function} Express middleware function
 */
const requireAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Permission Check: Checking any of [${permissionNames.join(', ')}] for user: ${req.user?.id}`);
      
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Owner role should have all permissions (legacy support)
      if (userRole === 'owner') {
        console.log(`✅ Owner Access Granted: User ${userId} has all permissions including any of [${permissionNames.join(', ')}]`);
        return next();
      }
      
      // Superadmin has all permissions
      if (userRole === 'superadmin') {
        console.log(`✅ Superadmin Access Granted: User ${userId} has all permissions including any of [${permissionNames.join(', ')}]`);
        return next();
      }
      
      // For other roles, check RBAC permissions
      try {
        const hasAnyPermission = await rbacService.hasAnyPermission(userId, permissionNames);
        
        if (!hasAnyPermission) {
          console.log(`❌ Permission Denied: User ${userId} lacks any of permissions [${permissionNames.join(', ')}]`);
          return res.status(403).json({
            success: false,
            message: `Access denied. Required permissions: ${permissionNames.join(' OR ')}`,
            required_permissions: permissionNames,
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
        
        console.log(`✅ Permission Granted: User ${userId} has at least one of the required permissions`);
        next();
      } catch (rbacError) {
        console.error('❌ RBAC permission check failed:', rbacError);
        // If RBAC check fails, fall back to legacy role check for backward compatibility
        if (userRole === 'warden' || userRole === 'student') {
          console.log(`✅ Legacy role access granted: User ${userId} with role ${userRole} has access`);
          return next();
        }
        
        // For unknown roles or RBAC failures, deny access
        console.log(`❌ Permission Denied: User ${userId} with role ${userRole} lacks any of permissions [${permissionNames.join(', ')}] - RBAC failed and no legacy support`);
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${permissionNames.join(' OR ')}`,
          required_permissions: permissionNames,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    } catch (error) {
      console.error('❌ Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Check for multiple permissions (user must have all)
 * @param {string[]} permissionNames - Array of permission names
 * @returns {Function} Express middleware function
 */
const requireAllPermissions = (permissionNames) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Permission Check: Checking all of [${permissionNames.join(', ')}] for user: ${req.user?.id}`);
      
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Owner role should have all permissions (legacy support)
      if (userRole === 'owner') {
        console.log(`✅ Owner Access Granted: User ${userId} has all permissions including all of [${permissionNames.join(', ')}]`);
        return next();
      }
      
      // Superadmin has all permissions
      if (userRole === 'superadmin') {
        console.log(`✅ Superadmin Access Granted: User ${userId} has all permissions including all of [${permissionNames.join(', ')}]`);
        return next();
      }
      
      // For other roles, check RBAC permissions
      try {
        const hasAllPermissions = await rbacService.hasAllPermissions(userId, permissionNames);
        
        if (!hasAllPermissions) {
          console.log(`❌ Permission Denied: User ${userId} lacks all of permissions [${permissionNames.join(', ')}]`);
          return res.status(403).json({
            success: false,
            message: `Access denied. Required permissions: ${permissionNames.join(' AND ')}`,
            required_permissions: permissionNames,
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
        
        console.log(`✅ Permission Granted: User ${userId} has all required permissions`);
        next();
      } catch (rbacError) {
        console.error('❌ RBAC permission check failed:', rbacError);
        // If RBAC check fails, fall back to legacy role check for backward compatibility
        if (userRole === 'warden' || userRole === 'student') {
          console.log(`✅ Legacy role access granted: User ${userId} with role ${userRole} has access`);
          return next();
        }
        
        // For unknown roles or RBAC failures, deny access
        console.log(`❌ Permission Denied: User ${userId} with role ${userRole} lacks all of permissions [${permissionNames.join(', ')}] - RBAC failed and no legacy support`);
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${permissionNames.join(' AND ')}`,
          required_permissions: permissionNames,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    } catch (error) {
      console.error('❌ Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Check for system admin permissions (superadmin only)
 * @returns {Function} Express middleware function
 */
const requireSystemAdmin = requirePermission('manage_system');

/**
 * Check for hostel owner permissions
 * @returns {Function} Express middleware function
 */
const requireOwner = requirePermission('hostel_update');

/**
 * Check for hostel management permissions (owner or warden)
 * @returns {Function} Express middleware function
 */
const requireHostelManagement = requireAnyPermission(['hostel_update', 'view_hostel_stats']);

/**
 * Check for student management permissions
 * @returns {Function} Express middleware function
 */
const requireStudentManagement = requireAnyPermission(['student_update', 'student_read']);

/**
 * Check for room management permissions
 * @returns {Function} Express middleware function
 */
const requireRoomManagement = requireAnyPermission(['room_update', 'room_read']);

/**
 * Check for complaint management permissions
 * @returns {Function} Express middleware function
 */
const requireComplaintManagement = requireAnyPermission(['complaint_update', 'complaint_read']);

/**
 * Check for visitor management permissions
 * @returns {Function} Express middleware function
 */
const requireVisitorManagement = requireAnyPermission(['visitor_update', 'visitor_read']);

/**
 * Check for profile management permissions
 * @returns {Function} Express middleware function
 */
const requireProfileManagement = requirePermission('manage_profile');

/**
 * Check for basic view permissions (any user with basic access)
 * @returns {Function} Express middleware function
 */
const requireBasicAccess = requireAnyPermission(['view_own_data', 'view_profile']);

/**
 * Check for owner role OR specific permission (for special cases like creating first hostel)
 * @param {string} permissionName - Required permission name
 * @returns {Function} Express middleware function
 */
const requireOwnerOrPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Owner or Permission Check: Checking owner role OR '${permissionName}' for user: ${req.user?.id}`);
      
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Allow if user is owner (legacy role check)
      if (userRole === 'owner') {
        console.log(`✅ Owner Access Granted: User ${userId} is an owner`);
        return next();
      }
      
      // Otherwise check for the specific permission
      const hasPermission = await rbacService.hasPermission(userId, permissionName);
      
      if (!hasPermission) {
        console.log(`❌ Permission Denied: User ${userId} is not owner and lacks permission '${permissionName}'`);
        return res.status(403).json({
          success: false,
          message: `Access denied. Required: owner role or ${permissionName} permission`,
          required_permission: permissionName,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      console.log(`✅ Permission Granted: User ${userId} has permission '${permissionName}'`);
      next();
    } catch (error) {
      console.error('❌ Owner or permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Dynamic permission checker - allows runtime permission checking
 * @param {Function} permissionChecker - Function that returns permission name(s)
 * @returns {Function} Express middleware function
 */
const requireDynamicPermission = (permissionChecker) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Dynamic Permission Check: Evaluating permissions for user: ${req.user?.id}`);
      
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const userId = req.user.id;
      const requiredPermissions = permissionChecker(req);
      
      if (!requiredPermissions) {
        console.log(`❌ Dynamic Permission Error: No permissions specified`);
        return res.status(500).json({
          success: false,
          message: 'Permission configuration error',
          code: 'PERMISSION_CONFIG_ERROR'
        });
      }
      
      // Handle single permission
      if (typeof requiredPermissions === 'string') {
        const hasPermission = await rbacService.hasPermission(userId, requiredPermissions);
        if (!hasPermission) {
          console.log(`❌ Dynamic Permission Denied: User ${userId} lacks permission '${requiredPermissions}'`);
          return res.status(403).json({
            success: false,
            message: `Access denied. Required permission: ${requiredPermissions}`,
            required_permission: requiredPermissions,
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
      }
      // Handle multiple permissions (any)
      else if (Array.isArray(requiredPermissions)) {
        const hasAnyPermission = await rbacService.hasAnyPermission(userId, requiredPermissions);
        if (!hasAnyPermission) {
          console.log(`❌ Dynamic Permission Denied: User ${userId} lacks any of permissions [${requiredPermissions.join(', ')}]`);
          return res.status(403).json({
            success: false,
            message: `Access denied. Required permissions: ${requiredPermissions.join(' OR ')}`,
            required_permissions: requiredPermissions,
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
      }
      
      console.log(`✅ Dynamic Permission Granted: User ${userId} has required permissions`);
      next();
    } catch (error) {
      console.error('❌ Dynamic permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Permission checker for hostel-specific operations
 * @param {string} basePermission - Base permission name
 * @returns {Function} Express middleware function
 */
const requireHostelPermission = (basePermission) => {
  return requireDynamicPermission((req) => {
    // Check if user is superadmin (has system-wide access)
    if (req.user?.role === 'superadmin') {
      return 'manage_system';
    }
    
    // For hostel-specific operations, check if user has access to the specific hostel
    const hostelId = req.params.hostelId || req.body.hostelId || req.query.hostelId;
    
    if (!hostelId) {
      return basePermission;
    }
    
    // Return the base permission - the RBAC service will handle hostel scoping
    return basePermission;
  });
};

/**
 * Middleware to add user permissions to request object
 * @returns {Function} Express middleware function
 */
const addUserPermissions = async (req, res, next) => {
  try {
    console.log('🔍 DEBUG: addUserPermissions - Starting');
    console.log('🔍 DEBUG: addUserPermissions - req.user:', req.user);
    
    if (req.user && req.user.id) {
      console.log(`🔍 Adding user permissions to request for user: ${req.user.id}`);
      
      // First, try to use permissions from JWT token (preferred method)
      if (req.user.permissions && Array.isArray(req.user.permissions)) {
        req.userPermissions = req.user.permissions;
        req.userRole = req.user.role;
        console.log(`✅ User permissions from JWT: [${req.userPermissions.join(', ')}]`);
      } else {
        // Fallback: fetch permissions from database (for legacy tokens)
        console.log('🔍 DEBUG: No permissions in JWT, fetching from database');
        const userRoleData = await rbacService.getUserRoleAndPermissions(req.user.id);
        console.log('🔍 DEBUG: addUserPermissions - userRoleData:', userRoleData);
        
        req.userPermissions = userRoleData.permissions.map(p => p.name);
        req.userRole = userRoleData.role;
        
        console.log(`✅ User permissions from database: [${req.userPermissions.join(', ')}]`);
      }
    } else {
      console.log('❌ DEBUG: addUserPermissions - No user found');
    }
    next();
  } catch (error) {
    console.error('❌ Error adding user permissions:', error);
    // Don't fail the request, just continue without permissions
    req.userPermissions = [];
    req.userRole = null;
    next();
  }
};

/**
 * Middleware to check if user can access specific hostel
 * @returns {Function} Express middleware function
 */
const requireHostelAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const hostelId = req.params.hostelId || req.body.hostelId || req.query.hostelId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!hostelId) {
      return res.status(400).json({
        success: false,
        message: 'Hostel ID required',
        code: 'HOSTEL_ID_REQUIRED'
      });
    }
    
    // Superadmin has access to all hostels
    if (userRole === 'superadmin') {
      console.log(`✅ Superadmin access granted to hostel: ${hostelId}`);
      return next();
    }
    
    // Owner role should have access to their own hostels (legacy support)
    // This check is redundant since validateHostelAccess already verified ownership,
    // but we keep it for extra safety
    if (userRole === 'owner') {
      console.log(`✅ Owner access granted to hostel: ${hostelId} (legacy role)`);
      return next();
    }
    
    // For other roles, check RBAC permissions
    try {
      const hasBasicAccess = await rbacService.hasAnyPermission(userId, ['hostel_read', 'hostel_update']);
      
      if (!hasBasicAccess) {
        console.log(`❌ Hostel Access Denied: User ${userId} cannot access hostel ${hostelId} - no RBAC permissions`);
        return res.status(403).json({
          success: false,
          message: 'Access denied to this hostel',
          code: 'HOSTEL_ACCESS_DENIED'
        });
      }
      
      console.log(`✅ Hostel Access Granted: User ${userId} can access hostel ${hostelId} via RBAC permissions`);
      next();
    } catch (rbacError) {
      console.error('❌ RBAC permission check failed:', rbacError);
      // If RBAC check fails, fall back to legacy role check for backward compatibility
      if (userRole === 'warden' || userRole === 'student') {
        console.log(`✅ Legacy role access granted: User ${userId} with role ${userRole} can access hostel ${hostelId}`);
        return next();
      }
      
      // For unknown roles or RBAC failures, deny access
      console.log(`❌ Hostel Access Denied: User ${userId} with role ${userRole} cannot access hostel ${hostelId} - RBAC failed and no legacy support`);
      return res.status(403).json({
        success: false,
        message: 'Access denied to this hostel',
        code: 'HOSTEL_ACCESS_DENIED'
      });
    }
  } catch (error) {
    console.error('❌ Hostel access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Hostel access check failed',
      code: 'HOSTEL_ACCESS_CHECK_ERROR'
    });
  }
};

module.exports = {
  // Core permission middleware
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireDynamicPermission,
  
  // Predefined permission middleware
  requireSystemAdmin,
  requireOwner,
  requireHostelManagement,
  requireStudentManagement,
  requireRoomManagement,
  requireComplaintManagement,
  requireVisitorManagement,
  requireProfileManagement,
  requireBasicAccess,
  requireOwnerOrPermission,
  
  // Hostel-specific middleware
  requireHostelPermission,
  requireHostelAccess,
  
  // Utility middleware
  addUserPermissions
};
