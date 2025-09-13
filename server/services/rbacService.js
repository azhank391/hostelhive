"use strict";

const { v4: uuidv4 } = require("uuid");
const { User, Role, Permission, RolePermission } = require("../models");
const UnifiedDependencyResolver = require("../utils/unifiedDependencyResolver");

/**
 * 🔧 RBAC Service Layer
 *
 * This service handles all Role-Based Access Control operations including:
 * - User role and permission retrieval
 * - Permission checking
 * - Custom role creation and management
 * - Permission grouping and organization
 *
 * @author HostelHive RBAC System
 * @version 1.0.0
 */
class RBACService {
  /**
   * Get user's role and permissions
   * @param {string} userId - User ID
   * @returns {Object} User role and permissions data
   */
  async getUserRoleAndPermissions(userId) {
    try {
      console.log(`🔍 RBAC: Fetching role and permissions for user: ${userId}`);

      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: "rbacRole",
            include: [
              {
                model: Permission,
                as: "permissions",
                through: { attributes: [] }, // Exclude junction table attributes
              },
            ],
          },
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }

      // If user has no RBAC role, fall back to legacy role
      if (!user.rbacRole) {
        console.log(
          `⚠️ RBAC: User ${userId} has no RBAC role, using legacy role: ${user.role}`
        );
        console.log(
          `🔍 RBAC: User data - role_id: ${user.role_id}, role: ${user.role}`
        );

        // Map legacy role to system role
        const systemRole = await Role.findOne({
          where: { name: user.role },
          include: [
            {
              model: Permission,
              as: "permissions",
              through: { attributes: [] },
            },
          ],
        });

        console.log(
          `🔍 RBAC: System role lookup result:`,
          systemRole
            ? `Found role ${systemRole.name} with ${
                systemRole.permissions?.length || 0
              } permissions`
            : "No system role found"
        );

        if (!systemRole) {
          console.log(
            `⚠️ RBAC: System role not found for legacy role: ${user.role}, using fallback permissions`
          );

          // Return fallback permissions based on legacy role
          const fallbackPermissions = this.getLegacyRolePermissions(user.role);
          console.log(
            `🔍 RBAC: Fallback permissions for ${user.role}:`,
            fallbackPermissions.length,
            "permissions"
          );

          return {
            role: {
              id: `legacy-${user.role}`,
              name: user.role,
              displayName: this.getLegacyRoleDisplayName(user.role),
              isSystemRole: true,
            },
            permissions: fallbackPermissions,
            isLegacyRole: true,
          };
        }

        return {
          role: {
            id: systemRole.id,
            name: systemRole.name,
            displayName: systemRole.display_name,
            isSystemRole: systemRole.is_system_role,
          },
          permissions: systemRole.permissions.map((p) => ({
            id: p.id,
            name: p.name,
            displayName: p.display_name,
            category: p.category,
          })),
          isLegacyRole: true,
        };
      }

      console.log(
        `✅ RBAC: Found role ${user.rbacRole.name} with ${user.rbacRole.permissions.length} permissions`
      );
      console.log(
        `🔍 RBAC: Role details - id: ${user.rbacRole.id}, isSystemRole: ${user.rbacRole.is_system_role}`
      );
      console.log(
        `🔍 RBAC: Permission names:`,
        user.rbacRole.permissions.map((p) => p.name).join(", ")
      );

      return {
        role: {
          id: user.rbacRole.id,
          name: user.rbacRole.name,
          displayName: user.rbacRole.display_name,
          isSystemRole: user.rbacRole.is_system_role,
        },
        permissions: user.rbacRole.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.display_name,
          category: p.category,
        })),
        isLegacyRole: false,
      };
    } catch (error) {
      console.error(
        "❌ RBAC: Error fetching user role and permissions:",
        error
      );

      // Try to get the user's role for fallback
      let userRole = "owner"; // Default fallback
      try {
        const user = await User.findByPk(userId, { attributes: ["role"] });
        if (user && user.role) {
          userRole = user.role;
        }
      } catch (userError) {
        console.error(
          "❌ RBAC: Error fetching user role for fallback:",
          userError
        );
      }

      // Return fallback permissions based on the user's actual role
      console.log(
        `⚠️ RBAC: Returning fallback permissions for user ${userId} with role: ${userRole}`
      );
      const fallbackPermissions = this.getLegacyRolePermissions(userRole);

      return {
        role: {
          id: `legacy-${userRole}`,
          name: userRole,
          displayName: this.getLegacyRoleDisplayName(userRole),
          isSystemRole: true,
        },
        permissions: fallbackPermissions,
        isLegacyRole: true,
      };
    }
  }

  /**
   * Get fallback permissions for legacy roles
   */
  getLegacyRolePermissions(roleName) {
    // Legacy fallback collapsed: map old composite names to new granular ones for backward compatibility.
    const TRANSLATION = {
      room_allocate: 'room_allocation_create',
      room_deallocate: 'room_allocation_delete',
      visitor_checkout: 'visitor_update',
      visitor_export: 'export_visitor_data',
      student_export: 'export_student_data',
      visitor_stats_read: 'visitor_read',
      hostel_stats_read: 'view_hostel_stats',
      complaint_resolve: 'complaint_update',
      billing_manage: 'manage_billing',
      hostel_global_manage: 'manage_all_hostels',
      system_manage: 'manage_system',
      system_stats_read: 'view_system_stats',
      owner_manage: 'manage_owners'
    };

    const BASE_FALLBACK = {
      owner: [
        'hostel_read','hostel_create','hostel_update','hostel_delete','hostel_settings_update','view_hostel_stats',
        'room_read','room_create','room_update','room_delete','room_allocation_read','room_allocation_create','room_allocation_delete','room_allocation_update','export_room_data',
        'student_read','student_create','student_update','student_delete','manage_student_rooms','view_student_rooms','export_student_data',
        'staff_read','staff_create','staff_update','staff_delete','role_assign','export_staff_data',
        'visitor_read','visitor_create','visitor_update','visitor_delete','export_visitor_data',
        'complaint_read','complaint_create','complaint_update','complaint_delete','view_complaint_stats','export_complaint_data',
        'view_reports','view_analytics','view_billing',
        'manage_profile','view_profile','change_password','view_own_data'
      ],
      warden: [
        'hostel_read','view_hostel_stats',
        'room_read','room_update','room_allocation_read','room_allocation_create','room_allocation_delete','room_allocation_update','export_room_data',
        'student_read','student_update','manage_student_rooms','view_student_rooms',
        'visitor_read','visitor_create','visitor_update',
        'complaint_read','complaint_update','view_complaint_stats',
        'view_reports','view_analytics',
        'manage_profile','view_profile','change_password','view_own_data'
      ],
      student: [
        'manage_profile','view_profile','change_password','view_own_data',
        'complaint_create','complaint_read','visitor_create','visitor_read'
      ],
      superadmin: ['manage_system'] // will be expanded at runtime to actual DB-defined permissions
    };

    const perms = BASE_FALLBACK[roleName] || [];
    // Map any deprecated names if present
    return perms.map(p => TRANSLATION[p] || p).map(name => ({ id: `legacy-${name}`, name, displayName: name, category: 'legacy' }));
  }

  /**
   * Get display name for legacy roles
   */
  getLegacyRoleDisplayName(roleName) {
    const displayNames = {
      owner: "Hostel Owner",
      warden: "Warden",
      student: "Student",
      superadmin: "Super Admin",
    };

    return displayNames[roleName] || roleName;
  }

  /**
   * Check if user has specific permission
   * @param {string} userId - User ID
   * @param {string} permissionName - Permission name to check
   * @returns {boolean} Whether user has the permission
   */
  async hasPermission(userId, permissionName) {
    try {
      console.log(
        `🔍 RBAC: Checking permission '${permissionName}' for user: ${userId}`
      );

      const userRoleData = await this.getUserRoleAndPermissions(userId);
      const hasPermission = userRoleData.permissions.some(
        (p) => p.name === permissionName
      );

      console.log(
        `✅ RBAC: User ${userId} ${
          hasPermission ? "HAS" : "DOES NOT HAVE"
        } permission '${permissionName}'`
      );
      return hasPermission;
    } catch (error) {
      console.error("❌ RBAC: Error checking permission:", error);
      // For legacy owners, if RBAC fails, assume they have all permissions
      // This is a fallback for backward compatibility
      console.log(
        `⚠️ RBAC: Permission check failed for user ${userId}, assuming legacy owner has all permissions`
      );
      return true;
    }
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string} userId - User ID
   * @param {string[]} permissionNames - Array of permission names to check
   * @returns {boolean} Whether user has any of the permissions
   */
  async hasAnyPermission(userId, permissionNames) {
    try {
      console.log(
        `🔍 RBAC: Checking any of permissions [${permissionNames.join(
          ", "
        )}] for user: ${userId}`
      );

      const userRoleData = await this.getUserRoleAndPermissions(userId);
      const hasAnyPermission = permissionNames.some((permissionName) =>
        userRoleData.permissions.some((p) => p.name === permissionName)
      );

      console.log(
        `✅ RBAC: User ${userId} ${
          hasAnyPermission ? "HAS" : "DOES NOT HAVE"
        } any of the permissions`
      );
      return hasAnyPermission;
    } catch (error) {
      console.error("❌ RBAC: Error checking any permission:", error);
      // For legacy owners, if RBAC fails, assume they have all permissions
      console.log(
        `⚠️ RBAC: Any permission check failed for user ${userId}, assuming legacy owner has all permissions`
      );
      return true;
    }
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string} userId - User ID
   * @param {string[]} permissionNames - Array of permission names to check
   * @returns {boolean} Whether user has all of the permissions
   */
  async hasAllPermissions(userId, permissionNames) {
    try {
      console.log(
        `🔍 RBAC: Checking all permissions [${permissionNames.join(
          ", "
        )}] for user: ${userId}`
      );

      const userRoleData = await this.getUserRoleAndPermissions(userId);
      const hasAllPermissions = permissionNames.every((permissionName) =>
        userRoleData.permissions.some((p) => p.name === permissionName)
      );

      console.log(
        `✅ RBAC: User ${userId} ${
          hasAllPermissions ? "HAS" : "DOES NOT HAVE"
        } all permissions`
      );
      return hasAllPermissions;
    } catch (error) {
      console.error("❌ RBAC: Error checking all permissions:", error);
      // For legacy owners, if RBAC fails, assume they have all permissions
      console.log(
        `⚠️ RBAC: All permissions check failed for user ${userId}, assuming legacy owner has all permissions`
      );
      return true;
    }
  }

  /**
   * Get all available permissions (for role creation)
   * @returns {Object} Permissions grouped by category
   */
  async getAllPermissions() {
    try {
      console.log("🔍 RBAC: Fetching all available permissions");

      const permissions = await Permission.findAll({
        order: [
          ["category", "ASC"],
          ["displayName", "ASC"],
        ],
      });

      // Group by category
      const groupedPermissions = {};
      permissions.forEach((permission) => {
        if (!groupedPermissions[permission.category]) {
          groupedPermissions[permission.category] = [];
        }
        groupedPermissions[permission.category].push({
          id: permission.id,
          name: permission.name,
          displayName: permission.displayName,
          description: permission.description,
        });
      });

      console.log(
        `✅ RBAC: Found ${permissions.length} permissions across ${
          Object.keys(groupedPermissions).length
        } categories`
      );
      return groupedPermissions;
    } catch (error) {
      console.error("❌ RBAC: Error fetching permissions:", error);
      throw error;
    }
  }

  /**
   * Get granular permissions (CRUD operations)
   * @returns {Array} Array of granular permissions
   */
  async getGranularPermissions() {
    try {
      console.log("🔍 RBAC: Fetching granular permissions");

      const permissions = await Permission.findAll({
        where: {
          operation: {
            [require("sequelize").Op.ne]: null, // Only get permissions with operation field
          },
        },
        order: [
          ["category", "ASC"],
          ["operation", "ASC"],
          ["display_name", "ASC"],
        ],
      });

      console.log(`✅ RBAC: Found ${permissions.length} granular permissions`);
      return permissions;
    } catch (error) {
      console.error("❌ RBAC: Error fetching granular permissions:", error);
      throw error;
    }
  }

  /**
   * Create custom role (owner only)
   * @param {Object} roleData - Role data
   * @param {string} createdById - ID of user creating the role
   * @param {string} hostelId - Hostel ID for the role
   * @returns {Object} Created role
   */
  async createCustomRole(roleData, createdById, hostelId) {
    try {
      console.log(
        `🔍 RBAC: Creating custom role '${roleData.name}' for hostel: ${hostelId}`
      );

      const { name, displayName, description, permissionNames } = roleData;

      // Convert permission names to permission IDs
      let permissionIds = [];
      if (permissionNames && permissionNames.length > 0) {
        const permissions = await Permission.findAll({
          where: {
            name: permissionNames,
          },
          attributes: ["id", "name"],
        });

        permissionIds = permissions.map((p) => p.id);
        console.log(
          `🔍 RBAC: Converted ${permissionNames.length} permission names to ${permissionIds.length} IDs`
        );
      }

      // Validate role name uniqueness within hostel
      const existingRole = await Role.findOne({
        where: {
          name: `custom_${name.toLowerCase().replace(/\s+/g, "_")}`,
          hostelId: hostelId,
        },
      });

      if (existingRole) {
        throw new Error("Role name already exists in this hostel");
      }

      // Create role
      const newRole = await Role.create({
        id: uuidv4(),
        name: `custom_${name.toLowerCase().replace(/\s+/g, "_")}`,
        displayName: displayName,
        description,
        isSystemRole: false,
        hostelId: hostelId,
        createdBy: createdById,
      });

      // Initialize permission tracking variables
      let finalPermissionIds = [];
      const originalPermissionCount = permissionIds ? permissionIds.length : 0;

      // Assign permissions
      if (permissionIds && permissionIds.length > 0) {
        // 🎯 Enhanced Permission Dependencies System
        finalPermissionIds = await this.ensurePermissionDependencies(
          permissionIds
        );
        console.log(
          `🔧 RBAC: Expanded ${permissionIds.length} permissions to ${finalPermissionIds.length} with dependencies`
        );

        const rolePermissions = finalPermissionIds.map((permissionId) => ({
          id: uuidv4(),
          roleId: newRole.id,
          permissionId: permissionId,
        }));

        await RolePermission.bulkCreate(rolePermissions);
        console.log(
          `✅ RBAC: Assigned ${finalPermissionIds.length} permissions to role '${newRole.name}'`
        );
      }

      console.log(
        `✅ RBAC: Created custom role '${newRole.name}' with ID: ${newRole.id}`
      );

      // Return the expected format for the controller
      return {
        success: true,
        role: newRole,
        permissions: {
          originalCount: originalPermissionCount,
          resolvedCount: finalPermissionIds.length,
          dependencies:
            originalPermissionCount > 0
              ? finalPermissionIds.filter((id) => !permissionIds.includes(id))
              : [],
        },
      };
    } catch (error) {
      console.error("❌ RBAC: Error creating custom role:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 🎯 Ensure permission dependencies are met
   * @param {Array} permissionIds - Array of permission IDs
   * @returns {Array} Array of permission IDs with dependencies included
   */
  async ensurePermissionDependencies(permissionIds) {
    const expandedPermissions = new Set(permissionIds);

    console.log(
      `🧠 Using Intelligent Dependency Resolution for ${permissionIds.length} permissions`
    );

    // Process each permission with intelligent dependency detection
    for (const permissionId of permissionIds) {
      const permission = await Permission.findByPk(permissionId);
      if (!permission) {
        console.warn(`⚠️ Permission with ID ${permissionId} not found`);
        continue;
      }

      // Get intelligent dependencies for this permission
      const dependencies =
        await UnifiedDependencyResolver.getUnifiedDependencies(permission.name);

      // Add each dependency to the expanded set
      for (const depName of dependencies) {
        const depPermission = await Permission.findOne({
          where: { name: depName },
        });
        if (depPermission && !expandedPermissions.has(depPermission.id)) {
          expandedPermissions.add(depPermission.id);
          console.log(
            `🧠 Intelligent: Added dependency '${depName}' for permission '${permission.name}'`
          );
        }
      }
    }

    const finalPermissions = Array.from(expandedPermissions);
    console.log(
      `🧠 Intelligent Resolution: Expanded ${permissionIds.length} permissions to ${finalPermissions.length} with smart dependencies`
    );

    return finalPermissions;
  }

  /**
   * Get hostel's custom roles
   * @param {string} hostelId - Hostel ID
   * @returns {Array} Array of custom roles
   */
  async getHostelCustomRoles(hostelId) {
    try {
      console.log(`🔍 RBAC: Fetching custom roles for hostel: ${hostelId}`);

      const roles = await Role.findAll({
        where: {
          hostelId: hostelId,
          isSystemRole: false,
        },
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const formattedRoles = roles.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          category: p.category,
        })),
        createdAt: role.createdAt,
      }));

      console.log(
        `✅ RBAC: Found ${formattedRoles.length} custom roles for hostel ${hostelId}`
      );
      return formattedRoles;
    } catch (error) {
      console.error("❌ RBAC: Error fetching hostel custom roles:", error);
      throw error;
    }
  }

  /**
   * Get all system roles
   * @returns {Array} Array of system roles
   */
  async getSystemRoles() {
    try {
      console.log("🔍 RBAC: Fetching system roles");

      const roles = await Role.findAll({
        where: { isSystemRole: true },
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
          },
        ],
        order: [["name", "ASC"]],
      });

      const formattedRoles = roles.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          category: p.category,
        })),
      }));

      console.log(`✅ RBAC: Found ${formattedRoles.length} system roles`);
      return formattedRoles;
    } catch (error) {
      console.error("❌ RBAC: Error fetching system roles:", error);
      throw error;
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Object} Updated user
   */
  async assignRoleToUser(userId, roleId) {
    try {
      console.log(`🔍 RBAC: Assigning role ${roleId} to user ${userId}`);

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      // Update user's role_id
      await user.update({ roleId: roleId });

      console.log(`✅ RBAC: Assigned role '${role.name}' to user ${userId}`);
      return user;
    } catch (error) {
      console.error("❌ RBAC: Error assigning role to user:", error);
      throw error;
    }
  }

  /**
   * Update custom role
   * @param {string} roleId - Role ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated role
   */
  async updateCustomRole(roleId, updateData) {
    try {
      console.log(`🔍 RBAC: Updating custom role: ${roleId}`);

      const { displayName, description, permissionIds } = updateData;

      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.is_system_role) {
        throw new Error("Cannot update system roles");
      }

      // Update role data
      const updateFields = {};
      if (displayName) updateFields.display_name = displayName;
      if (description) updateFields.description = description;

      if (Object.keys(updateFields).length > 0) {
        await role.update(updateFields);
      }

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Remove existing permissions
        await RolePermission.destroy({
          where: { role_id: roleId },
        });

        // Add new permissions
        if (permissionIds.length > 0) {
          const rolePermissions = permissionIds.map((permissionId) => ({
            id: uuidv4(),
            role_id: roleId,
            permission_id: permissionId,
          }));

          await RolePermission.bulkCreate(rolePermissions);
        }
      }

      console.log(`✅ RBAC: Updated custom role '${role.name}'`);
      return role;
    } catch (error) {
      console.error("❌ RBAC: Error updating custom role:", error);
      throw error;
    }
  }

  /**
   * Delete custom role
   * @param {string} roleId - Role ID
   * @returns {boolean} Success status
   */
  async deleteCustomRole(roleId) {
    try {
      console.log(`🔍 RBAC: Deleting custom role: ${roleId}`);

      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.isSystemRole) {
        throw new Error("Cannot delete system roles");
      }

      // Check if role is assigned to any users
      const usersWithRole = await User.count({
        where: { roleId: roleId },
      });

      if (usersWithRole > 0) {
        throw new Error("Cannot delete role that is assigned to users");
      }

      // Delete role (permissions will be deleted by cascade)
      await role.destroy();

      console.log(`✅ RBAC: Deleted custom role '${role.name}'`);
      return true;
    } catch (error) {
      console.error("❌ RBAC: Error deleting custom role:", error);
      throw error;
    }
  }
}

module.exports = new RBACService();
