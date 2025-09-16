"use strict";

const { Permission, RolePermission, Role } = require("../models");
const { Op } = require("sequelize");
const {
  PERMISSION_DEFINITIONS,
  getPermissionDefinition,
} = require("./permissionDefinitions");

/**
 * 🎯 PERMISSION DEPENDENCY RESOLVER
 *
 * Handles automatic permission assignment based on dependencies.
 * When a permission is assigned to a role, all its required permissions
 * are automatically assigned as well.
 *
 * Includes support for high-privilege permissions and their warnings.
 */

class PermissionDependencyResolver {
  /**
   * Get all dependencies for a given permission
   * @param {string} permissionName - Name of the permission
   * @returns {Array} Array of required permission names
   */
  static async getPermissionDependencies(permissionName) {
    try {
      // Get dependencies from our definitions first
      const permDef = getPermissionDefinition(permissionName);
      if (permDef) {
        return permDef.dependencies;
      }

      // Fallback to database if not in definitions
      const permission = await Permission.findOne({
        where: { name: permissionName },
        include: [
          {
            association: "requiredPermissions",
            through: {
              where: { is_automatic: true },
            },
          },
        ],
      });

      if (!permission) {
        console.warn(`⚠️ Permission '${permissionName}' not found`);
        return [];
      }

      return permission.requiredPermissions.map((p) => p.name);
    } catch (error) {
      console.error("❌ Error getting permission dependencies:", error);
      return [];
    }
  }

  /**
   * Check if a permission is high privilege
   * @param {string} permissionName - Name of the permission
   * @returns {Object} Object containing isHighPrivilege and warning if applicable
   */
  static isHighPrivilegePermission(permissionName) {
    const permDef = getPermissionDefinition(permissionName);
    if (!permDef) return { isHighPrivilege: false };

    return {
      isHighPrivilege: permDef.isHighPrivilege || false,
      warning: permDef.warning,
    };
  }

  /**
   * Get all permissions that depend on a given permission
   * @param {string} permissionName - Name of the permission
   * @returns {Array} Array of dependent permission names
   */
  static async getDependentPermissions(permissionName) {
    try {
      const permission = await Permission.findOne({
        where: { name: permissionName },
        include: [
          {
            association: "parentPermissions",
            through: {
              where: { is_automatic: true },
            },
          },
        ],
      });

      if (!permission) {
        console.warn(`⚠️ Permission '${permissionName}' not found`);
        return [];
      }

      return permission.parentPermissions.map((p) => p.name);
    } catch (error) {
      console.error("❌ Error getting dependent permissions:", error);
      return [];
    }
  }

  /**
   * Resolve all dependencies for a list of permissions
   * @param {Array} permissions - Array of permission names
   * @returns {Array} Array of all permissions including dependencies
   */
  static async resolveDependencies(permissions) {
    try {
      const resolvedPermissions = new Set();
      const toProcess = [...permissions];

      while (toProcess.length > 0) {
        const currentPermission = toProcess.shift();

        if (resolvedPermissions.has(currentPermission)) {
          continue;
        }

        // Add current permission
        resolvedPermissions.add(currentPermission);

        // Get dependencies
        const dependencies = await this.getPermissionDependencies(
          currentPermission
        );

        // Add dependencies to processing queue
        for (const dep of dependencies) {
          if (!resolvedPermissions.has(dep)) {
            toProcess.push(dep);
          }
        }
      }

      return Array.from(resolvedPermissions);
    } catch (error) {
      console.error("❌ Error resolving permission dependencies:", error);
      return permissions; // Return original list if error
    }
  }

  /**
   * Assign permissions to a role with automatic dependency resolution
   * @param {string} roleId - ID of the role
   * @param {Array} permissions - Array of permission names to assign
   * @returns {Object} Result object with success status and assigned permissions
   */
  static async assignPermissionsWithDependencies(roleId, permissions) {
    try {
      console.log(`🔗 Resolving dependencies for role ${roleId}...`);

      // Check for high privilege permissions
      const highPrivilegePerms = permissions.filter((perm) => {
        const { isHighPrivilege, warning } =
          this.isHighPrivilegePermission(perm);
        if (isHighPrivilege) {
          console.warn(`⚠️ High Privilege Permission: ${perm} - ${warning}`);
        }
        return isHighPrivilege;
      });

      if (highPrivilegePerms.length > 0) {
        console.log(
          `🚨 Including ${highPrivilegePerms.length} high privilege permissions`
        );
      }

      // Resolve all dependencies
      const allPermissions = await this.resolveDependencies(permissions);

      console.log(`📋 Original permissions: ${permissions.length}`);
      console.log(`📋 Resolved permissions: ${allPermissions.length}`);

      // Get permission IDs
      const permissions = await Permission.findAll({
        where: { name: { [Op.in]: allPermissions } },
      });

      const permissionIds = permissions.map((p) => p.id);

      // Remove existing permissions for this role
      await RolePermission.destroy({
        where: { roleId },
      });

      // Add all permissions (including dependencies)
      const rolePermissions = permissionIds.map((permissionId) => ({
        id: require("crypto").randomUUID(),
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date(),
        
      }));

      await RolePermission.bulkCreate(rolePermissions);

      console.log(
        `✅ Assigned ${permissionIds.length} permissions to role ${roleId}`
      );

      return {
        success: true,
        originalCount: permissions.length,
        resolvedCount: allPermissions.length,
        assignedPermissions: allPermissions,
        dependencies: allPermissions.filter(
          (p) => !permissions.includes(p)
        ),
      };
    } catch (error) {
      console.error("❌ Error assigning permissions with dependencies:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a custom role with permission dependencies
   * @param {Object} roleData - Role data
   * @param {Array} permissions - Array of permission names
   * @param {string} createdBy - ID of the user creating the role
   * @returns {Object} Result object with success status and role data
   */
  static async createRoleWithDependencies(
    roleData,
    permissions,
    createdBy
  ) {
    try {
      console.log(`🎭 Creating custom role: ${roleData.name}`);

      // Create the role
      const role = await Role.create({
        ...roleData,
        createdBy,
        isSystemRole: false,
      });

      // Assign permissions with dependencies
      const result = await this.assignPermissionsWithDependencies(
        role.id,
        permissions
      );

      if (!result.success) {
        // Rollback role creation if permission assignment fails
        await Role.destroy({ where: { id: role.id } });
        throw new Error(result.error);
      }

      console.log(`✅ Custom role created successfully: ${role.name}`);

      return {
        success: true,
        role,
        permissions: result,
      };
    } catch (error) {
      console.error("❌ Error creating role with dependencies:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update role permissions with dependency resolution
   * @param {string} roleId - ID of the role
   * @param {Array} permissions - Array of permission names
   * @returns {Object} Result object with success status
   */
  static async updateRolePermissions(roleId, permissions) {
    try {
      console.log(`🔄 Updating permissions for role ${roleId}...`);

      const result = await this.assignPermissionsWithDependencies(
        roleId,
        permissions
      );

      if (result.success) {
        console.log(`✅ Role permissions updated successfully`);
      }

      return result;
    } catch (error) {
      console.error("❌ Error updating role permissions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get permission tree for a role (showing dependencies)
   * @param {string} roleId - ID of the role
   * @returns {Object} Permission tree with dependencies
   */
  static async getRolePermissionTree(roleId) {
    try {
      const role = await Role.findByPk(roleId, {
        include: [
          {
            association: "permissions",
            include: [
              {
                association: "requiredPermissions",
                through: {
                  where: { is_automatic: true },
                },
              },
            ],
          },
        ],
      });

      if (!role) {
        throw new Error("Role not found");
      }

      const permissionTree = {};

      for (const permission of role.permissions) {
        permissionTree[permission.name] = {
          displayName: permission.displayName,
          category: permission.category,
          operation: permission.operation,
          dependencies: permission.requiredPermissions.map((p) => ({
            name: p.name,
            displayName: p.displayName,
            category: p.category,
          })),
        };
      }

      return {
        success: true,
        role: {
          id: role.id,
          name: role.name,
          displayName: role.displayName,
        },
        permissions: permissionTree,
      };
    } catch (error) {
      console.error("❌ Error getting role permission tree:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate permission assignment (check if all dependencies are met)
   * @param {Array} permissions - Array of permission names to validate
   * @returns {Object} Validation result
   */
  static async validatePermissionAssignment(permissions) {
    try {
      const resolvedPermissions = await this.resolveDependencies(
        permissions
      );
      const missingDependencies = resolvedPermissions.filter(
        (p) => !permissions.includes(p)
      );

      return {
        success: true,
        originalPermissions: permissions,
        resolvedPermissions,
        missingDependencies,
        isValid: missingDependencies.length === 0,
      };
    } catch (error) {
      console.error("❌ Error validating permission assignment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all dependencies for multiple permissions (for frontend pages)
   * @param {Array} permissions - Array of permission names
   * @returns {Object} Object with permission names as keys and dependencies as values
   */
  static async getMultipleDependencies(permissions) {
    try {
      console.log(
        `🔍 Getting dependencies for multiple permissions:`,
        permissions
      );

      const results = {};

      for (const permissionName of permissions) {
        results[permissionName] = await this.getPermissionDependencies(
          permissionName
        );
      }

      console.log(
        `✅ Retrieved dependencies for ${permissions.length} permissions`
      );
      return results;
    } catch (error) {
      console.error("❌ Error getting multiple dependencies:", error);
      throw error;
    }
  }

  /**
   * Get page-specific dependencies based on frontend analysis
   * @param {string} pageName - The page name (e.g., 'dashboard', 'rooms', 'students')
   * @returns {Array} Array of required permission names for the page
   */
  static async getPageDependencies(pageName) {
    try {
      console.log(`🔍 Getting page dependencies for: ${pageName}`);

      const pageDependencies = {
        dashboard: ["view_dashboard_owner"],
        rooms: ["room_read"],
        students: ["student_read"],
        visitors: ["visitor_read"],
        complaints: ["complaint_read"],
        staff: ["staff_read"],
        settings: ["view_settings"],
        hostel_detail: ["view_hostel_details"],
        owner_hostels: ["hostel_read"],
      };

      const primaryPermissions = pageDependencies[pageName] || [];
      if (primaryPermissions.length === 0) {
        console.log(`❌ Unknown page: ${pageName}`);
        return [];
      }

      // Resolve all dependencies for the page
      const allPermissions = await this.resolveDependencies(primaryPermissions);

      console.log(
        `✅ Page ${pageName} requires ${allPermissions.length} permissions`
      );
      return allPermissions;
    } catch (error) {
      console.error("❌ Error getting page dependencies:", error);
      throw error;
    }
  }
}

module.exports = PermissionDependencyResolver;
