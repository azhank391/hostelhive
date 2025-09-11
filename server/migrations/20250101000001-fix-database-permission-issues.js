"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🔧 Fixing database permission issues...");

    try {
      // 1. Fix superadmin role - assign ALL permissions
      console.log("📋 Step 1: Assigning all permissions to superadmin role...");

      // Get superadmin role ID
      const [superadminRole] = await queryInterface.sequelize.query(
        "SELECT id FROM Roles WHERE name = ?",
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

      // Create role permissions for superadmin (all permissions)
      const rolePermissions = permissions.map((p) => ({
        id: require("crypto").randomUUID(),
        role_id: superadminRole.id,
        permission_id: p.id,
        created_at: new Date(),
      }));

      await queryInterface.bulkInsert("RolePermissions", rolePermissions);
      console.log(
        `✅ Assigned ${rolePermissions.length} permissions to superadmin`
      );

      // 2. Replace legacy 'view_wardens' with 'warden_read' for owner role
      console.log("📋 Step 2: Replacing legacy view_wardens permission...");

      // Get owner role ID
      const [ownerRole] = await queryInterface.sequelize.query(
        "SELECT id FROM Roles WHERE name = ?",
        {
          replacements: ["owner"],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      // Get permission IDs
      const [viewWardensPermission] = await queryInterface.sequelize.query(
        "SELECT id FROM Permissions WHERE name = ?",
        {
          replacements: ["view_wardens"],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      const [wardenReadPermission] = await queryInterface.sequelize.query(
        "SELECT id FROM Permissions WHERE name = ?",
        {
          replacements: ["warden_read"],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (ownerRole && viewWardensPermission && wardenReadPermission) {
        // Remove old permission assignment
        await queryInterface.bulkDelete("RolePermissions", {
          role_id: ownerRole.id,
          permission_id: viewWardensPermission.id,
        });

        // Check if warden_read is already assigned to owner
        const [existingAssignment] = await queryInterface.sequelize.query(
          "SELECT id FROM RolePermissions WHERE role_id = ? AND permission_id = ?",
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
      }

      // 3. Remove the legacy permission from database
      console.log("📋 Step 3: Removing legacy view_wardens permission...");

      // First remove all role assignments for this permission
      await queryInterface.bulkDelete("RolePermissions", {
        permission_id: viewWardensPermission.id,
      });

      // Then remove the permission itself
      await queryInterface.bulkDelete("Permissions", {
        name: "view_wardens",
      });

      console.log("✅ Removed legacy view_wardens permission");

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
      "SELECT id FROM Roles WHERE name = ?",
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
