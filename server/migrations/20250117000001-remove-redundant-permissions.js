"use strict";

/**
 * 🗑️ REMOVE REDUNDANT USER PERMISSIONS
 *
 * This migration removes redundant user_* permissions that are not needed
 * since the system uses specific permissions (student_*, warden_*) instead.
 *
 * Permissions being removed:
 * - user_create, user_read, user_update, user_delete
 *
 * These are redundant because:
 * 1. Staff management uses role_* permissions
 * 2. Student management uses student_* permissions
 * 3. Warden management uses warden_* permissions
 * 4. Generic user_* permissions serve no purpose in the system
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🗑️ Removing redundant user_* permissions...");

    const redundantPermissions = [
      "user_create",
      "user_read",
      "user_update",
      "user_delete",
    ];

    try {
      // 1. Remove role-permission mappings for these permissions
      console.log("🔗 Removing role-permission mappings...");
      for (const permissionName of redundantPermissions) {
        // Get permission ID
        const permissions = await queryInterface.sequelize.query(
          "SELECT id FROM `Permissions` WHERE name = :permissionName",
          {
            replacements: { permissionName },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (permissions && permissions.length > 0) {
          const permissionId = permissions[0].id;

          // Remove from RolePermissions
          await queryInterface.sequelize.query(
            "DELETE FROM `RolePermissions` WHERE permission_id = :permissionId",
            {
              replacements: { permissionId },
            }
          );
          console.log(`  ✓ Removed role mappings for ${permissionName}`);
        }
      }

      // 2. Remove permission dependencies
      console.log("🔗 Removing permission dependencies...");
      for (const permissionName of redundantPermissions) {
        // Get permission ID first
        const permissions = await queryInterface.sequelize.query(
          "SELECT id FROM `Permissions` WHERE name = :permissionName",
          {
            replacements: { permissionName },
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (permissions && permissions.length > 0) {
          const permissionId = permissions[0].id;

          // Remove dependencies using permission IDs
          await queryInterface.sequelize.query(
            "DELETE FROM `PermissionDependencies` WHERE parent_permission_id = :permissionId OR required_permission_id = :permissionId",
            {
              replacements: { permissionId },
            }
          );
          console.log(`  ✓ Removed dependencies for ${permissionName}`);
        }
      }

      // 3. Remove the permissions themselves
      console.log("🗑️ Removing permissions...");
      for (const permissionName of redundantPermissions) {
        await queryInterface.sequelize.query(
          "DELETE FROM `Permissions` WHERE name = :permissionName",
          {
            replacements: { permissionName },
          }
        );
        console.log(`  ✓ Removed permission: ${permissionName}`);
      }

      console.log("✅ Successfully removed 4 redundant user_* permissions");
      console.log("📊 System now has 57 total permissions (down from 61)");
    } catch (error) {
      console.error("❌ Error removing redundant permissions:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Restoring redundant user_* permissions...");

    const crypto = require("crypto");
    const generateUUID = () => crypto.randomUUID();

    const permissionsToRestore = [
      {
        id: generateUUID(),
        name: "user_create",
        display_name: "Create User",
        description: "Create new users",
        category: "users",
        operation: "create",
      },
      {
        id: generateUUID(),
        name: "user_read",
        display_name: "View Users",
        description: "View user details and lists",
        category: "users",
        operation: "read",
      },
      {
        id: generateUUID(),
        name: "user_update",
        display_name: "Update User",
        description: "Update user information",
        category: "users",
        operation: "update",
      },
      {
        id: generateUUID(),
        name: "user_delete",
        display_name: "Delete User",
        description: "Delete users",
        category: "users",
        operation: "delete",
      },
    ];

    try {
      // Restore permissions
      for (const permission of permissionsToRestore) {
        await queryInterface.bulkInsert("Permissions", [
          {
            ...permission,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
        console.log(`  ✓ Restored permission: ${permission.name}`);
      }

      console.log("✅ Successfully restored 4 user_* permissions");
    } catch (error) {
      console.error("❌ Error restoring permissions:", error);
      throw error;
    }
  },
};
