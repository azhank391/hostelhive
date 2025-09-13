/**
 * 🎯 PAGE PERMISSION MAPPING
 * 
 * This file maps each page to its required permissions based on the APIs it calls.
 * This is the foundation for intelligent page-level permission dependency resolution.
 */

const { getPageApis } = require('./pageApiMap');
const { getApiPermissions } = require('./apiPermissionMap');

/**
 * Map each page to its required permissions based on API calls
 */
const PAGE_PERMISSION_MAP = {
  // ========================================
  // DASHBOARD PAGE (Routing only - no API calls)
  // ========================================
  'dashboard': [
    // No direct API calls - this is a routing component
    // Uses context APIs only (useAuth, useHostel)
  ],

  // ========================================
  // MY HOSTELS PAGE
  // ========================================
  'my-hostels': [
    // Primary permissions
    'hostel_read',             // GET /api/auth/hostels
    'hostel_read',             // Alternative permission name
    'hostel_create',           // POST /api/hostels
    'hostel_update',           // PUT /api/hostels/:id
    'hostel_delete',           // DELETE /api/hostels/:id
    'hostel_settings_update'   // Hostel settings management
  ],

  // ========================================
  // STUDENTS PAGE
  // ========================================
  'students': [
    // Primary permissions (from main API calls)
    'student_read',           // GET /api/hostels/:hostelId/students
    'student_update',         // POST/PUT/DELETE /api/hostels/:hostelId/students
    
    // Room allocation permissions (from dependency APIs)
    'room_read',              // GET /api/hostels/:hostelId/rooms (for allocation dropdown)
    'room_allocation_create', // POST /api/hostels/:hostelId/room-allocations
    'room_allocation_delete', // DELETE /api/hostels/:hostelId/room-allocations/:allocationId
    
    // Universal dependency
    'hostel_read'              // Required for all hostel operations
  ],

  // ========================================
  // ROOMS PAGE
  // ========================================
  'rooms': [
    // Primary permissions
    'room_read',              // GET /api/hostels/:hostelId/rooms
    'room_update',            // POST/PUT/DELETE /api/hostels/:hostelId/rooms
    
    // Room details permissions
    'room_allocation_read',   // GET /api/hostels/:hostelId/rooms/:roomId/students
    'room_allocation_delete', // DELETE /api/hostels/:hostelId/room-allocations/:studentId
    
    // Universal dependency
    'hostel_read'              // Required for all hostel operations
  ],

  // ========================================
  // VISITORS PAGE
  // ========================================
  'visitors': [
    // Primary permissions
    'visitor_read',           // GET /api/hostels/:hostelId/visitors
    'visitor_create',         // POST /api/hostels/:hostelId/visitors
    'visitor_update',         // PUT/DELETE /api/hostels/:hostelId/visitors
    'visitor_update',         // POST /api/hostels/:hostelId/visitors/:visitorId/checkout
    
    // Dependency permissions (for visitor creation)
    'student_read',           // GET /api/hostels/:hostelId/students (for host selection)
    
    // Universal dependency
    'hostel_read'              // Required for all hostel operations
  ],

  // ========================================
  // COMPLAINTS PAGE
  // ========================================
  'complaints': [
    // Primary permissions
    'complaint_read',         // GET /api/hostels/:hostelId/complaints
    'complaint_update',       // PUT /api/hostels/:hostelId/complaints/:complaintId/status
    'complaint_delete',       // DELETE /api/hostels/:hostelId/complaints/:complaintId
    
    // Universal dependency
    'hostel_read'              // Required for all hostel operations
  ],

  // ========================================
  // STAFF PAGE
  // ========================================
  'staff': [
    // Primary permissions
    'staff_read',             // GET /api/hostels/:hostelId/staff
    'staff_create',           // POST /api/hostels/:hostelId/staff
    'staff_update',           // PUT /api/hostels/:hostelId/staff
    'staff_delete',           // DELETE /api/hostels/:hostelId/staff
    'staff_update',           // Toggle staff status
    
    // Universal dependency
    'hostel_read'             // Required for all hostel operations
  ],

  // ========================================
  // ========================================
  // HOSTEL DASHBOARD
  // ========================================
  'hostel-dashboard': [
    // Primary permissions
    'hostel_read',             // GET /api/hostels/:hostelId
    'hostel_update',           // PUT/DELETE /api/hostels/:hostelId
    'hostel_stats_read'        // GET /api/hostels/:hostelId/stats
  ],

  // ========================================
  // HOSTEL LIST
  // ========================================
  'hostel-list': [
    // Primary permissions
    'hostel_read',      // GET /api/auth/hostels
    'hostel_update'            // POST /api/hostels (create new hostel)
  ],

  // ========================================
  // BILLING PAGE (Superadmin Only)
  // ========================================
  'billing': [
    // Superadmin-only permissions
    'superadmin_billing_read',     // GET /api/superadmin/billing/overview
    'superadmin_billing_manage',   // Manage billing operations
    'superadmin_reports_generate'  // Generate billing reports
  ],

  // ========================================
  // REPORTS PAGE (Superadmin Only)
  // ========================================
  'reports': [
    // Superadmin-only permissions
    'superadmin_analytics_read',   // GET /api/superadmin/analytics/*
    'superadmin_reports_generate', // Generate analytics reports
    'superadmin_data_export'       // Export data
  ]
};

/**
 * Get permissions required for a specific page
 * @param {string} pageName - The page name
 * @returns {Array<string>} Array of required permission names
 */
function getPagePermissions(pageName) {
  return PAGE_PERMISSION_MAP[pageName] || [];
}

/**
 * Get all pages that require a specific permission
 * @param {string} permission - The permission name
 * @returns {Array<string>} Array of page names that require this permission
 */
function getPagesForPermission(permission) {
  const pages = [];
  Object.entries(PAGE_PERMISSION_MAP).forEach(([page, permissions]) => {
    if (permissions.includes(permission)) {
      pages.push(page);
    }
  });
  return pages;
}

/**
 * Get all unique permissions used across all pages
 * @returns {Array<string>} Array of unique permission names
 */
function getAllPagePermissions() {
  const permissions = new Set();
  Object.values(PAGE_PERMISSION_MAP).forEach(pagePermissions => {
    pagePermissions.forEach(permission => permissions.add(permission));
  });
  return Array.from(permissions).sort();
}

/**
 * Analyze page permission dependencies
 * @param {string} pageName - The page name
 * @returns {Object} Analysis of page permission dependencies
 */
function analyzePagePermissionDependencies(pageName) {
  const permissions = getPagePermissions(pageName);
  const apis = getPageApis(pageName);
  
  const analysis = {
    pageName,
    totalPermissions: permissions.length,
    totalApis: apis.length,
    primaryPermissions: [],
    dependencyPermissions: [],
    crossPagePermissions: [],
    permissionSources: {}
  };

  // Categorize permissions
  permissions.forEach(permission => {
    // Find which APIs require this permission
    const relatedApis = apis.filter(api => {
      const apiPermissions = getApiPermissions(api.split(' ')[0], api.split(' ')[1]);
      return apiPermissions.includes(permission);
    });

    analysis.permissionSources[permission] = relatedApis;

    // Categorize based on permission type
    if (permission.startsWith('view_') || permission.startsWith('manage_')) {
      analysis.primaryPermissions.push(permission);
    } else {
      analysis.dependencyPermissions.push(permission);
    }

    // Check for cross-page usage
    const otherPages = getPagesForPermission(permission);
    if (otherPages.length > 1) {
      analysis.crossPagePermissions.push({
        permission,
        sharedWith: otherPages.filter(p => p !== pageName)
      });
    }
  });

  return analysis;
}

/**
 * Get permission requirements for a role that needs to access specific pages
 * @param {Array<string>} pageNames - Array of page names the role needs to access
 * @returns {Object} Permission requirements analysis
 */
function getRolePermissionRequirements(pageNames) {
  const allPermissions = new Set();
  const pageAnalyses = {};

  pageNames.forEach(pageName => {
    const pagePermissions = getPagePermissions(pageName);
    pagePermissions.forEach(permission => allPermissions.add(permission));
    
    pageAnalyses[pageName] = analyzePagePermissionDependencies(pageName);
  });

  return {
    requiredPages: pageNames,
    totalUniquePermissions: allPermissions.size,
    allPermissions: Array.from(allPermissions).sort(),
    pageAnalyses,
    permissionBreakdown: {
      primary: Array.from(allPermissions).filter(p => p.startsWith('view_') || p.startsWith('manage_')),
      dependencies: Array.from(allPermissions).filter(p => !p.startsWith('view_') && !p.startsWith('manage_'))
    }
  };
}

/**
 * Validate that all page permissions exist in the database
 * @param {Array<string>} dbPermissions - Array of permissions that exist in database
 * @returns {Object} Validation results
 */
function validatePagePermissions(dbPermissions) {
  const allPagePermissions = getAllPagePermissions();
  const missingPermissions = allPagePermissions.filter(permission => 
    !dbPermissions.includes(permission)
  );
  const extraPermissions = dbPermissions.filter(permission => 
    !allPagePermissions.includes(permission)
  );

  return {
    totalPagePermissions: allPagePermissions.length,
    totalDbPermissions: dbPermissions.length,
    missingPermissions,
    extraPermissions,
    isValid: missingPermissions.length === 0
  };
}

module.exports = {
  PAGE_PERMISSION_MAP,
  getPagePermissions,
  getPagesForPermission,
  getAllPagePermissions,
  analyzePagePermissionDependencies,
  getRolePermissionRequirements,
  validatePagePermissions
};
