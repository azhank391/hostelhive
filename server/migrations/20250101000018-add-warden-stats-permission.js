"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("🔧 Adding hostel_stats_read permission to wardens...");

      // 1. Get the hostel_stats_read permission ID
      const hostelStatsPermissions = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'hostel_stats_read'`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!hostelStatsPermissions || hostelStatsPermissions.length === 0) {
        console.log("⚠️ hostel_stats_read permission not found");
        await transaction.rollback();
        return;
      }

      const hostelStatsPermission = hostelStatsPermissions[0];

      // 2. Get all warden role IDs
      const wardenRoles = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'warden'`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`📊 Found ${wardenRoles.length} warden roles`);

      // 3. Add the permission to all warden roles
      for (const role of wardenRoles) {
        // Check if permission already exists
        const existingPermissions = await queryInterface.sequelize.query(
          `SELECT id FROM RolePermissions 
           WHERE role_id = ? AND permission_id = ?`,
          {
            transaction,
            type: Sequelize.QueryTypes.SELECT,
            replacements: [role.id, hostelStatsPermission.id],
          }
        );

        if (!existingPermissions || existingPermissions.length === 0) {
          await queryInterface.bulkInsert(
            "RolePermissions",
            [
              {
                id: require("uuid").v4(),
                role_id: role.id,
                permission_id: hostelStatsPermission.id,
                created_at: new Date(),
              },
            ],
            { transaction }
          );

          console.log(
            `✅ Added hostel_stats_read permission to warden role ${role.id}`
          );
        } else {
          console.log(
            `ℹ️ Permission already exists for warden role ${role.id}`
          );
        }
      }

      await transaction.commit();
      console.log("🎉 Successfully updated warden permissions");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error updating warden permissions:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("🔄 Removing hostel_stats_read permission from wardens...");

      // Get the hostel_stats_read permission ID
      const hostelStatsPermissions = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'hostel_stats_read'`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (hostelStatsPermissions && hostelStatsPermissions.length > 0) {
        const hostelStatsPermission = hostelStatsPermissions[0];

        // Get warden role IDs
        const wardenRoles = await queryInterface.sequelize.query(
          `SELECT id FROM Roles WHERE name = 'warden'`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        // Remove from all warden roles
        for (const role of wardenRoles) {
          await queryInterface.bulkDelete(
            "RolePermissions",
            {
              role_id: role.id,
              permission_id: hostelStatsPermission.id,
            },
            { transaction }
          );
        }

        console.log("✅ Removed hostel_stats_read permission from wardens");
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error removing permissions:", error);
      throw error;
    }
  },
};
