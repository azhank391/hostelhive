"use strict";

/**
 * 🔐 PERMISSION MANAGEMENT UTILITIES
 * 
 * Scalable permission management system to handle permission growth.
 * Provides consistent categories and expansion strategies.
 */

const { Permission, Role, RolePermission } = require('../models');

/**
 * Permission categories for consistent organization
 */
const PERMISSION_CATEGORIES = {
  HOSTEL: 'hostel',
  ROOMS: 'rooms',
  STUDENTS: 'students',
  COMPLAINTS: 'complaints',
  VISITORS: 'visitors',
  REPORTS: 'reports',
  ROLES: 'roles',
  SYSTEM: 'system',
  FINANCIAL: 'financial',
  MAINTENANCE: 'maintenance'
};

/**
 * Permission naming conventions
 */
const PERMISSION_PATTERNS = {
  MANAGE: 'manage_',
  VIEW: 'view_',
  CREATE: 'create_',
  UPDATE: 'update_',
  DELETE: 'delete_',
  EXPORT: 'export_',
  IMPORT: 'import_',
  APPROVE: 'approve_',
  REJECT: 'reject_'
};

/**
 * Creates a new permission with consistent naming and categorization
 * @param {Object} permissionData - Permission data
 * @returns {Object} - Created permission
 */
async function createPermission(permissionData) {
  const {
    name,
    displayName,
    description,
    category,
    isSystemPermission = true
  } = permissionData;

  // Validate category
  if (!Object.values(PERMISSION_CATEGORIES).includes(category)) {
    throw new Error(`Invalid permission category: ${category}. Must be one of: ${Object.values(PERMISSION_CATEGORIES).join(', ')}`);
  }

  // Validate naming convention
  const validPattern = Object.values(PERMISSION_PATTERNS).some(pattern => 
    name.startsWith(pattern)
  );
  
  if (!validPattern) {
    console.warn(`⚠️ Permission '${name}' doesn't follow naming conventions. Consider using: ${Object.values(PERMISSION_PATTERNS).join(', ')}`);
  }

  try {
    const permission = await Permission.create({
      name,
      displayName,
      description,
      category,
      isSystemPermission
    });

    console.log(`✅ Created permission: ${name} (${category})`);
    return permission;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error(`Permission '${name}' already exists`);
    }
    throw error;
  }
}

/**
 * Gets all permissions by category
 * @param {string} category - Permission category
 * @returns {Array} - Array of permissions
 */
async function getPermissionsByCategory(category) {
  if (!Object.values(PERMISSION_CATEGORIES).includes(category)) {
    throw new Error(`Invalid permission category: ${category}`);
  }

  return await Permission.findAll({
    where: { category },
    order: [['name', 'ASC']]
  });
}

/**
 * Gets all permissions grouped by category
 * @returns {Object} - Permissions grouped by category
 */
async function getPermissionsByCategoryGrouped() {
  const permissions = await Permission.findAll({
    order: [['category', 'ASC'], ['name', 'ASC']]
  });

  const grouped = {};
  for (const permission of permissions) {
    if (!grouped[permission.category]) {
      grouped[permission.category] = [];
    }
    grouped[permission.category].push(permission);
  }

  return grouped;
}

/**
 * Assigns permission to a role
 * @param {string} roleId - Role ID
 * @param {string} permissionId - Permission ID
 * @returns {Object} - Role permission assignment
 */
async function assignPermissionToRole(roleId, permissionId) {
  try {
    const rolePermission = await RolePermission.create({
      roleId,
      permissionId
    });

    console.log(`✅ Assigned permission ${permissionId} to role ${roleId}`);
    return rolePermission;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Permission already assigned to this role');
    }
    throw error;
  }
}

/**
 * Removes permission from a role
 * @param {string} roleId - Role ID
 * @param {string} permissionId - Permission ID
 * @returns {boolean} - Success status
 */
async function removePermissionFromRole(roleId, permissionId) {
  const deleted = await RolePermission.destroy({
    where: { roleId, permissionId }
  });

  if (deleted > 0) {
    console.log(`✅ Removed permission ${permissionId} from role ${roleId}`);
    return true;
  }
  
  return false;
}

/**
 * Gets all permissions for a role
 * @param {string} roleId - Role ID
 * @returns {Array} - Array of permissions
 */
async function getRolePermissions(roleId) {
  const role = await Role.findByPk(roleId, {
    include: [{
      model: Permission,
      as: 'permissions',
      through: { attributes: [] }
    }]
  });

  return role ? role.permissions : [];
}

/**
 * Checks if a role has a specific permission
 * @param {string} roleId - Role ID
 * @param {string} permissionName - Permission name
 * @returns {boolean} - True if role has permission
 */
async function roleHasPermission(roleId, permissionName) {
  const role = await Role.findByPk(roleId, {
    include: [{
      model: Permission,
      as: 'permissions',
      where: { name: permissionName },
      required: false
    }]
  });

  return role && role.permissions.length > 0;
}

/**
 * Bulk assigns permissions to a role
 * @param {string} roleId - Role ID
 * @param {Array} permissionIds - Array of permission IDs
 * @returns {Object} - Assignment results
 */
async function bulkAssignPermissionsToRole(roleId, permissionIds) {
  const results = {
    assigned: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  for (const permissionId of permissionIds) {
    try {
      await assignPermissionToRole(roleId, permissionId);
      results.assigned++;
      results.details.push({ permissionId, status: 'assigned' });
    } catch (error) {
      if (error.message.includes('already assigned')) {
        results.skipped++;
        results.details.push({ permissionId, status: 'skipped', reason: 'already assigned' });
      } else {
        results.errors++;
        results.details.push({ permissionId, status: 'error', reason: error.message });
      }
    }
  }

  return results;
}

/**
 * Creates a new custom role with permissions
 * @param {Object} roleData - Role data
 * @param {Array} permissionIds - Array of permission IDs to assign
 * @returns {Object} - Created role with permissions
 */
async function createCustomRole(roleData, permissionIds = []) {
  const {
    name,
    displayName,
    description,
    hostelId,
    createdBy
  } = roleData;

  try {
    // Create the role
    const role = await Role.create({
      name,
      displayName,
      description,
      isSystemRole: false,
      hostelId,
      createdBy
    });

    // Assign permissions if provided
    if (permissionIds.length > 0) {
      await bulkAssignPermissionsToRole(role.id, permissionIds);
    }

    console.log(`✅ Created custom role: ${name} with ${permissionIds.length} permissions`);
    return role;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error(`Role '${name}' already exists for this hostel`);
    }
    throw error;
  }
}

/**
 * Gets permission statistics
 * @returns {Object} - Permission statistics
 */
async function getPermissionStats() {
  const totalPermissions = await Permission.count();
  const permissionsByCategory = await Permission.findAll({
    attributes: [
      'category',
      [Permission.sequelize.fn('COUNT', Permission.sequelize.col('id')), 'count']
    ],
    group: ['category'],
    raw: true
  });

  const totalRoles = await Role.count();
  const systemRoles = await Role.count({ where: { isSystemRole: true } });
  const customRoles = await Role.count({ where: { isSystemRole: false } });

  return {
    permissions: {
      total: totalPermissions,
      byCategory: permissionsByCategory
    },
    roles: {
      total: totalRoles,
      system: systemRoles,
      custom: customRoles
    }
  };
}

module.exports = {
  PERMISSION_CATEGORIES,
  PERMISSION_PATTERNS,
  createPermission,
  getPermissionsByCategory,
  getPermissionsByCategoryGrouped,
  assignPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  roleHasPermission,
  bulkAssignPermissionsToRole,
  createCustomRole,
  getPermissionStats
};

