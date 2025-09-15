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
   * Return all permissions grouped by category (for role creation UI)
   * Shape: { [category]: [ { id, name, displayName, description, operation } ] }
   */
  async getAllPermissions() {
    try {
      const perms = await Permission.findAll({
        attributes: [
          "id",
          "name",
          "display_name",
          "description",
          "category",
          "operation",
        ],
        order: [
          ["category", "ASC"],
          ["operation", "ASC"],
          ["name", "ASC"],
        ],
      });

      const grouped = perms.reduce((acc, p) => {
        const cat = p.category || "general";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          id: p.id,
          name: p.name,
          displayName: p.display_name,
          description: p.description,
          operation: p.operation,
        });
        return acc;
      }, {});

      return grouped;
    } catch (error) {
      console.error("❌ RBAC: Error in getAllPermissions:", error);
      throw error;
    }
  }

  /**
   * Return granular permissions as a flat array (used by controller to group)
   */
  async getGranularPermissions() {
    try {
      const perms = await Permission.findAll({
        attributes: [
          "id",
          "name",
          "display_name",
          "description",
          "category",
          "operation",
        ],
        order: [
          ["category", "ASC"],
          ["operation", "ASC"],
          ["name", "ASC"],
        ],
      });

      return perms.map((p) => ({
        id: p.id,
        name: p.name,
        displayName: p.display_name,
        description: p.description,
        category: p.category,
        operation: p.operation,
      }));
    } catch (error) {
      console.error("❌ RBAC: Error in getGranularPermissions:", error);
      throw error;
    }
  }

  /**
   * Return custom roles for a hostel (non system roles)
   */
  async getHostelCustomRoles(hostelId) {
    try {
      if (!hostelId) return [];

      const roles = await Role.findAll({
        where: { hostel_id: hostelId },
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
            attributes: ["id", "name", "display_name", "category", "operation"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return roles.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.display_name,
        description: r.description,
        permissions: (r.permissions || []).map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.display_name,
          category: p.category,
          operation: p.operation,
        })),
      }));
    } catch (error) {
      console.error("❌ RBAC: Error in getHostelCustomRoles:", error);
      throw error;
    }
  }

  // convenience alias used by controllers
  async getCustomRoles(hostelId) {
    return this.getHostelCustomRoles(hostelId);
  }

  /**
   * Return system roles (is_system_role = true)
   */
  async getSystemRoles() {
    try {
      const roles = await Role.findAll({
        where: { is_system_role: true },
        attributes: [
          "id",
          "name",
          "display_name",
          "description",
          "is_system_role",
        ],
        order: [["name", "ASC"]],
      });

      return roles.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.display_name,
        description: r.description,
        isSystemRole: r.is_system_role,
      }));
    } catch (error) {
      console.error("❌ RBAC: Error in getSystemRoles:", error);
      throw error;
    }
  }

  /**
   * Create a custom role for a hostel and attach permissions
   * payload: { name, displayName|display_name, description, permissions: [<permName|permId>] }
   */
  async createCustomRole(hostelId, payload = {}, createdBy = null) {
    try {
      console.log(
        `🔍 RBAC: Creating custom role '${
          payload.name || payload.displayName
        }' for hostel: ${hostelId} by user: ${createdBy}`
      );

      if (!hostelId) {
        throw new Error("hostelId is required");
      }

      const roleName = (payload.name || payload.displayName || payload.display_name || "")
        .toString()
        .trim();
      if (!roleName) {
        throw new Error("role name/displayName is required");
      }

      const display_name =
        payload.displayName || payload.display_name || roleName;
      const description = payload.description || null;

      // create role
      const role = await Role.create({
        id: uuidv4(),
        name: roleName,
        display_name,
        description,
        is_system_role: false,
        hostel_id: hostelId,
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // attach permissions if provided
      const permsInput = Array.isArray(payload.permissions)
        ? payload.permissions
        : [];
      if (permsInput.length > 0) {
        // allow permission identifiers to be either name or id
        const permNames = permsInput.filter((p) => typeof p === "string");
        const permIds = permsInput.filter(
          (p) => typeof p === "string" && /^[0-9a-fA-F-]{36}$/.test(p)
        );

        const whereClause = permNames.length
          ? { name: permNames }
          : { id: permIds };

        // fetch matching permissions (try both name and id)
        const matchedPerms = await Permission.findAll({
          where: {
            // Sequelize OR: match by name OR by id if both provided
            ...(permNames.length && permIds.length
              ? {
                  [require("sequelize").Op.or]: [
                    { name: permNames },
                    { id: permIds },
                  ],
                }
              : permNames.length
              ? { name: permNames }
              : { id: permIds }),
          },
          attributes: ["id", "name", "display_name", "category", "operation"],
        });

        if (matchedPerms.length > 0) {
          const rpInserts = matchedPerms.map((p) => ({
            id: uuidv4(),
            role_id: role.id,
            permission_id: p.id,
            created_at: new Date(),
            updated_at: new Date(),
          }));
          // bulk create role-permissions
          await RolePermission.bulkCreate(rpInserts);
        }
      }

      // reload role with permissions
      const created = await Role.findByPk(role.id, {
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
            attributes: ["id", "name", "display_name", "category", "operation"],
          },
        ],
      });

      const plain =
        typeof created.get === "function"
          ? created.get({ plain: true })
          : created;

      return {
        id: plain.id,
        name: plain.name,
        displayName: plain.display_name,
        description: plain.description,
        isSystemRole: Boolean(plain.is_system_role),
        permissions: (plain.permissions || []).map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.display_name,
          category: p.category,
          operation: p.operation,
        })),
      };
    } catch (error) {
      console.error("❌ RBAC: Error creating custom role:", error);
      throw error;
    }
  }
}

module.exports = new RBACService();
