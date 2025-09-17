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
  // ...existing methods...

  /**
   * Update a custom role's displayName, description, and permissions
   * @param {string} roleId
   * @param {object} payload { displayName, description, permissionIds }
   * @returns {object} updated role and permissions
   */
  async updateCustomRole(roleId, payload) {
    try {
      if (!roleId) throw new Error("roleId is required");

      // Find the role
      const role = await Role.findByPk(roleId, {
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
            attributes: ["id", "name", "display_name", "category", "operation"],
          },
        ],
      });
      if (!role) throw new Error("Role not found");
      if (role.is_system_role) throw new Error("Cannot update system roles");

      // Update displayName and description if provided
      if (payload.displayName) role.display_name = payload.displayName;
      if (payload.description !== undefined)
        role.description = payload.description;
      role.updated_at = new Date();
      await role.save();

      // Update permissions if provided
      if (payload.permissionIds && Array.isArray(payload.permissionIds)) {
        // Remove all current permissions
        
        await RolePermission.destroy({ where: { roleId: role.id } });

        // Fetch new permissions (by id or name)
        const permIds = payload.permissionIds.filter(
          (p) => typeof p === "string" && /^[0-9a-fA-F-]{36}$/.test(p)
        );
        const permNames = payload.permissionIds.filter(
          (p) => typeof p === "string" && !/^[0-9a-fA-F-]{36}$/.test(p)
        );
        const matchedPerms = await Permission.findAll({
          where: {
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
            roleId: role.id,
            permissionId: p.id,
            createdAt: new Date(),
          }));
          await RolePermission.bulkCreate(rpInserts, {
            fields: ["id", "roleId", "permissionId", "createdAt"],
          });
        }
      }

      // Reload role with permissions
      const updated = await Role.findByPk(role.id, {
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
        typeof updated.get === "function"
          ? updated.get({ plain: true })
          : updated;
      return {
        id: plain.id,
        name: plain.name,
        displayName: plain.display_name,
        description: plain.description,
        permissions: (plain.permissions || []).map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.display_name,
          category: p.category,
          operation: p.operation,
        })),
      };
    } catch (error) {
      console.error("❌ RBAC: Error updating custom role:", error);
      throw error;
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
  async createCustomRole(hostelId, payload, createdBy) {
    try {
      console.log(
        `🔍 RBAC: Creating custom role '${
          payload.name || payload.displayName
        }' for hostel: ${hostelId} by user: ${createdBy}`
      );

      if (!hostelId) {
        throw new Error("hostelId is required");
      }

      const roleName = (
        payload.name ||
        payload.displayName ||
        payload.display_name ||
        ""
      )
        .toString()
        .trim();
      if (!roleName) {
        throw new Error("role name/displayName is required");
      }

      const displayName =
        payload.displayName || payload.display_name || roleName;
      const description = payload.description || null;

      // create role
      const role = await Role.create({
        id: uuidv4(),
        name: roleName,
        displayName, // model property, mapped to display_name
        description,
        isSystemRole: false, // model property, mapped to is_system_role
        hostelId, // model property, mapped to hostel_id
        createdBy, // model property, mapped to created_by
        createdAt: new Date(),
        updatedAt: new Date(),
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
            roleId: role.id, // use model property name
            permissionId: p.id, // use model property name
            createdAt: new Date(),
          }));
          // bulk create role-permissions with model property names
          await RolePermission.bulkCreate(rpInserts, {
            fields: ["id", "roleId", "permissionId", "createdAt"],
          });
        }

        // reload role with permissions
        const created = await Role.findByPk(role.id, {
          include: [
            {
              model: Permission,
              as: "permissions",
              through: { attributes: [] },
              attributes: [
                "id",
                "name",
                "display_name",
                "category",
                "operation",
              ],
            },
          ],
        });

        const plain =
          typeof created.get === "function"
            ? created.get({ plain: true })
            : created;

        return {
          success: true,
          role: {
            id: plain.id,
            name: plain.name,
            displayName: plain.display_name,
            description: plain.description,
            isSystemRole: Boolean(plain.is_system_role),
          },
          permissions: {
            list: (plain.permissions || []).map((p) => ({
              id: p.id,
              name: p.name,
              displayName: p.display_name,
              category: p.category,
              operation: p.operation,
            })),
            resolvedCount: (plain.permissions || []).length,
            originalCount: (plain.permissions || []).length, // Adjust if you have original/dependency split
            dependencies: [], // Adjust if you track dependencies
          },
        };
      }
    } catch (error) {
      console.error("❌ RBAC: Error creating custom role:", error);
      throw error;
    }
  }
}

module.exports = new RBACService();
