'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get the permission ID (permission already exists)
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'room_allocation_read'`,
        { transaction }
      );
      
      if (permissionResult.length === 0) {
        throw new Error('room_allocation_read permission not found');
      }
      
      const permissionId = permissionResult[0].id;

      // Get the warden role ID
      const [wardenRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'warden' AND is_system_role = true`,
        { transaction }
      );

      if (wardenRoleResult.length === 0) {
        throw new Error('warden role not found');
      }

      const wardenRoleId = wardenRoleResult[0].id;

      // Check if warden already has this permission
      const [existingPermission] = await queryInterface.sequelize.query(
        `SELECT id FROM RolePermissions WHERE role_id = ? AND permission_id = ?`,
        { replacements: [wardenRoleId, permissionId], transaction }
      );

      // Only assign permission to warden if it doesn't already exist
      if (existingPermission.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO RolePermissions (id, role_id, permission_id, created_at) 
           VALUES (UUID(), ?, ?, NOW())`,
          { replacements: [wardenRoleId, permissionId], transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get the permission ID
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'room_allocation_read'`,
        { transaction }
      );
      
      if (permissionResult.length > 0) {
        const permissionId = permissionResult[0].id;

        // Get the warden role ID
        const [wardenRoleResult] = await queryInterface.sequelize.query(
          `SELECT id FROM Roles WHERE name = 'warden' AND is_system_role = true`,
          { transaction }
        );

        if (wardenRoleResult.length > 0) {
          const wardenRoleId = wardenRoleResult[0].id;

          // Remove only the warden role permission
          await queryInterface.sequelize.query(
            `DELETE FROM RolePermissions WHERE role_id = ? AND permission_id = ?`,
            { replacements: [wardenRoleId, permissionId], transaction }
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
