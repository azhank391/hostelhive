"use strict";

const { v4: uuidv4 } = require("uuid");
const { User, Role, Permission, RolePermission } = require("../models");
const UnifiedDependencyResolver = require("../utils/unifiedDependencyResolver");

class RBACService {
  /**
   * Get user's role and permissions
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
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }

      // If user has no RBAC role → simply return empty permissions
      if (!user.rbacRole) {
        console.log(
          `⚠️ RBAC: User ${userId} has no RBAC role. Returning empty permissions.`
        );

        return {
          role: {
            id: `legacy-none`,
            name: user.role || "none",
            displayName: user.role || "No Role",
            isSystemRole: false,
          },
          permissions: [],
          isLegacyRole: false,
        };
      }

      console.log(
        `✅ RBAC: Found role ${user.rbacRole.name} with ${user.rbacRole.permissions.length} permissions`
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

      // fallback: return empty
      return {
        role: {
          id: `legacy-error`,
          name: "none",
          displayName: "No Role",
          isSystemRole: false,
        },
        permissions: [],
        isLegacyRole: false,
      };
    }
  }

  /**
   * 🚫 Removed: getLegacyRolePermissions and getLegacyRoleDisplayName
   * Users without RBAC role now simply get empty permissions.
   */
}

module.exports = new RBACService();
