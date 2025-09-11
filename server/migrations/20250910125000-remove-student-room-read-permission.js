"use strict";

// This migration will revert the addition of student_room_read permission

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get the student_room_read permission ID
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'student_room_read'`,
        { transaction }
      );

      if (permissionResult.length > 0) {
        const permissionId = permissionResult[0].id;

        // Remove all role assignments for this permission
        await queryInterface.sequelize.query(
          `DELETE FROM RolePermissions WHERE permission_id = ?`,
          { replacements: [permissionId], transaction }
        );

        // Delete the permission
        await queryInterface.sequelize.query(
          `DELETE FROM Permissions WHERE id = ?`,
          { replacements: [permissionId], transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This would recreate the permission if needed
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create the student_room_read permission
      await queryInterface.sequelize.query(
        `INSERT INTO Permissions (id, name, display_name, description, category, operation, is_system_permission, created_at, updated_at) 
         VALUES (UUID(), 'student_room_read', 'Student Room Read', 'Permission for students to view room information', 'rooms', 'read', true, NOW(), NOW())`,
        { transaction }
      );

      // Get the permission ID
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'student_room_read'`,
        { transaction }
      );

      if (permissionResult.length === 0) {
        throw new Error(
          "student_room_read permission not found after creation"
        );
      }

      const permissionId = permissionResult[0].id;

      // Get the student role ID
      const [studentRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'student' AND is_system_role = true`,
        { transaction }
      );

      if (studentRoleResult.length > 0) {
        const studentRoleId = studentRoleResult[0].id;

        // Assign permission to student role
        await queryInterface.sequelize.query(
          `INSERT INTO RolePermissions (id, role_id, permission_id, created_at) 
           VALUES (UUID(), ?, ?, NOW())`,
          { replacements: [studentRoleId, permissionId], transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
