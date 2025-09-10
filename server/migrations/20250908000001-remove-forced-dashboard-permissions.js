"use strict";

/**
 * 🎯 MIGRATION: Remove Forced Dashboard Permissions
 *
 * This migration removes unnecessary dashboard and hostel_read permissions
 * from custom roles that were auto-added by the dependency resolver.
 *
 * The goal is to allow roles to have specific section access without
 * being forced into the main dashboard view.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("🎯 Starting migration: Remove forced dashboard permissions");

      // 1. Find all custom roles (non-system roles)
      const customRoles = await queryInterface.sequelize.query(
        `
        SELECT id, name, display_name, hostel_id 
        FROM Roles 
        WHERE is_system_role = 0
      `,
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      console.log(`📋 Found ${customRoles.length} custom roles to analyze`);

      // 2. Get permission IDs for dashboard and hostel_read
      const dashboardPermissions = await queryInterface.sequelize.query(
        `
        SELECT id, name 
        FROM Permissions 
        WHERE name IN ('view_dashboard', 'hostel_read')
      `,
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      const permissionMap = {};
      dashboardPermissions.forEach((perm) => {
        permissionMap[perm.name] = perm.id;
      });

      console.log("🔍 Permission mapping:", permissionMap);

      let removedCount = 0;

      // 3. For each custom role, check if it has meaningful permissions beyond dashboard access
      for (const role of customRoles) {
        // Get all permissions for this role
        const rolePermissions = await queryInterface.sequelize.query(
          `
          SELECT p.name, p.category, rp.id as role_permission_id
          FROM RolePermissions rp
          JOIN Permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = ?
        `,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: [role.id],
            transaction,
          }
        );

        console.log(
          `\n👤 Analyzing role: ${role.display_name} (${rolePermissions.length} permissions)`
        );

        // Check if role has specific operational permissions
        const hasOperationalPermissions = rolePermissions.some(
          (perm) =>
            !["view_dashboard", "hostel_read", "profile_read"].includes(
              perm.name
            )
        );

        // Check if role has only basic permissions (dashboard, hostel_read, profile_read)
        const hasOnlyBasicPermissions = rolePermissions.every((perm) =>
          ["view_dashboard", "hostel_read", "profile_read"].includes(perm.name)
        );

        console.log(
          `   📊 Has operational permissions: ${hasOperationalPermissions}`
        );
        console.log(
          `   📊 Has only basic permissions: ${hasOnlyBasicPermissions}`
        );

        // If role has operational permissions, remove forced dashboard access
        if (hasOperationalPermissions) {
          const toRemove = rolePermissions.filter((perm) =>
            ["view_dashboard", "hostel_read"].includes(perm.name)
          );

          for (const perm of toRemove) {
            await queryInterface.sequelize.query(
              `
              DELETE FROM RolePermissions 
              WHERE id = ?
            `,
              {
                replacements: [perm.role_permission_id],
                transaction,
              }
            );

            console.log(`   ❌ Removed: ${perm.name}`);
            removedCount++;
          }
        }

        // If role has only basic permissions, it's likely a test role - leave it or flag it
        if (hasOnlyBasicPermissions) {
          console.log(
            `   ⚠️  Role has only basic permissions - may need manual review`
          );
        }
      }

      console.log(`\n✅ Migration completed successfully`);
      console.log(`📊 Total permissions removed: ${removedCount}`);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Migration failed:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration cannot be easily reversed as we don't know which
    // permissions were originally intended vs auto-added
    console.log("⚠️  This migration cannot be automatically reversed");
    console.log("   Manual review of role permissions may be required");
  },
};
