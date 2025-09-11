"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Check if the student_room_read permission exists
      const [existingPermission] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'student_room_read'`,
        { transaction }
      );

      let studentRoomReadPermissionId;

      // Create the permission if it doesn't exist
      if (existingPermission.length === 0) {
        const uuid = require("uuid").v4();
        await queryInterface.sequelize.query(
          `INSERT INTO Permissions (id, name, display_name, description, created_at, updated_at) 
           VALUES (?, 'student_room_read', 'Student Room Read', 'Permission to read room information for students', NOW(), NOW())`,
          {
            replacements: [uuid],
            transaction,
          }
        );

        studentRoomReadPermissionId = uuid;
      } else {
        studentRoomReadPermissionId = existingPermission[0].id;
      }

      // 2. Get the student role ID
      const [studentRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'student' AND is_system_role = true`,
        { transaction }
      );

      if (studentRoleResult.length === 0) {
        throw new Error("student role not found");
      }

      const studentRoleId = studentRoleResult[0].id;

      // 3. Check if the permission is already assigned to the student role
      const [existingRolePermission] = await queryInterface.sequelize.query(
        `SELECT id FROM RolePermissions WHERE role_id = ? AND permission_id = ?`,
        {
          replacements: [studentRoleId, studentRoomReadPermissionId],
          transaction,
        }
      );

      // 4. Add the permission to the student role if not already exists
      if (existingRolePermission.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO RolePermissions (id, role_id, permission_id, created_at) 
           VALUES (UUID(), ?, ?, NOW())`,
          {
            replacements: [studentRoleId, studentRoomReadPermissionId],
            transaction,
          }
        );
      }

      await transaction.commit();
      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Get the student_room_read permission ID
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'student_room_read'`,
        { transaction }
      );

      if (permissionResult.length === 0) {
        // Permission doesn't exist, nothing to do
        await transaction.commit();
        return Promise.resolve();
      }

      const studentRoomReadPermissionId = permissionResult[0].id;

      // 2. Get the student role ID
      const [studentRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'student' AND is_system_role = true`,
        { transaction }
      );

      if (studentRoleResult.length === 0) {
        throw new Error("student role not found");
      }

      const studentRoleId = studentRoleResult[0].id;

      // 3. Remove the permission from the student role
      await queryInterface.sequelize.query(
        `DELETE FROM RolePermissions 
         WHERE role_id = ? AND permission_id = ?`,
        {
          replacements: [studentRoleId, studentRoomReadPermissionId],
          transaction,
        }
      );

      await transaction.commit();
      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      return Promise.reject(error);
    }
  },
};
