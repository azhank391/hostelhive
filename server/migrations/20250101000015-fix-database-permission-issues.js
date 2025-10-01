"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🔧 Fixing database permission issues...");

    try {
      // 1. Fix superadmin role - assign ALL permissions (idempotent)
      console.log("📋 Step 1: Assigning all permissions to superadmin role...");

      // Get superadmin role ID
      const [superadminRole] = await queryInterface.sequelize.query(
        "SELECT id FROM Roles WHERE name = ? LIMIT 1",
        {
          replacements: ["superadmin"],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (!superadminRole) {
        throw new Error("Superadmin role not found");
      }

      // Get all permission IDs
      const permissions = await queryInterface.sequelize.query(
        "SELECT id FROM Permissions",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      // Get already assigned permissions for superadmin
      const existing = await queryInterface.sequelize.query(
        "SELECT permission_id FROM RolePermissions WHERE role_id = ?",
        {
          replacements: [superadminRole.id],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );
      const existingSet = new Set(existing.map((r) => r.permission_id));

      // Create role permissions for superadmin (missing only)
      const now = new Date();
      const rolePermissions = permissions
        .filter((p) => !existingSet.has(p.id))
        .map((p) => ({
          id: require("crypto").randomUUID(),
          role_id: superadminRole.id,
          permission_id: p.id,
          created_at: now,
        }));

      if (rolePermissions.length) {
        // For MySQL, ignoreDuplicates prevents unique constraint errors if any race
        await queryInterface.bulkInsert("RolePermissions", rolePermissions, {
          ignoreDuplicates: true,
        });
      }

      console.log(
        `✅ Ensured superadmin has ALL permissions (added ${rolePermissions.length})`
      );

      // 2. Replace legacy 'view_wardens' with 'warden_read' for owner role (idempotent)
      console.log("📋 Step 2: Replacing legacy view_wardens permission...");

      // Get owner role ID
      const [ownerRole] = await queryInterface.sequelize.query(
        "SELECT id FROM Roles WHERE name = ? LIMIT 1",
        {
          replacements: ["owner"],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      // Get permission IDs
      const [viewWardensPermission] = await queryInterface.sequelize.query(
        "SELECT id FROM Permissions WHERE name = ? LIMIT 1",
        {
          replacements: ["view_wardens"],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      const [wardenReadPermission] = await queryInterface.sequelize.query(
        "SELECT id FROM Permissions WHERE name = ? LIMIT 1",
        {
          replacements: ["warden_read"],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (ownerRole && viewWardensPermission && wardenReadPermission) {
        // Remove old permission assignment (safe)
        await queryInterface.bulkDelete("RolePermissions", {
          role_id: ownerRole.id,
          permission_id: viewWardensPermission.id,
        });

        // Check if warden_read is already assigned to owner
        const [existingAssignment] = await queryInterface.sequelize.query(
          "SELECT id FROM RolePermissions WHERE role_id = ? AND permission_id = ? LIMIT 1",
          {
            replacements: [ownerRole.id, wardenReadPermission.id],
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );

        // Add new permission assignment if it doesn't exist
        if (!existingAssignment) {
          await queryInterface.bulkInsert("RolePermissions", [
            {
              id: require("crypto").randomUUID(),
              role_id: ownerRole.id,
              permission_id: wardenReadPermission.id,
              created_at: new Date(),
            },
          ]);
        }

        console.log("✅ Replaced view_wardens with warden_read for owner role");
      } else {
        console.log(
          "ℹ️ Skipping replace step (owner/view_wardens/warden_read not all present)"
        );
      }

      // 3. Remove the legacy permission from database (guarded)
      console.log("📋 Step 3: Removing legacy view_wardens permission...");

      if (viewWardensPermission) {
        // First remove all role assignments for this permission
        await queryInterface.bulkDelete("RolePermissions", {
          permission_id: viewWardensPermission.id,
        });

        // Then remove the permission itself
        await queryInterface.bulkDelete("Permissions", {
          id: viewWardensPermission.id,
        });

        console.log("✅ Removed legacy view_wardens permission");
      } else {
        console.log("ℹ️ view_wardens not found — nothing to remove");
      }

      console.log("🎉 Database permission issues fixed successfully!");
    } catch (error) {
      console.error("❌ Error fixing permissions:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Reverting permission fixes...");

    // Remove all permissions from superadmin
    const [superadminRole] = await queryInterface.sequelize.query(
      "SELECT id FROM Roles WHERE name = ? LIMIT 1",
      {
        replacements: ["superadmin"],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (superadminRole) {
      await queryInterface.bulkDelete("RolePermissions", {
        role_id: superadminRole.id,
      });
    }

    console.log("✅ Reverted superadmin permissions");
  },
};
