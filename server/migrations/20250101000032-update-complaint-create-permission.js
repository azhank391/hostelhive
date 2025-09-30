"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Get the complaint_create permission ID
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'complaint_create'`,
        { transaction }
      );

      if (permissionResult.length === 0) {
        throw new Error("complaint_create permission not found");
      }

      const complaintCreatePermissionId = permissionResult[0].id;

      // 2. Get the warden role ID
      const [wardenRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'warden' AND is_system_role = true`,
        { transaction }
      );

      if (wardenRoleResult.length === 0) {
        throw new Error("warden role not found");
      }

      const wardenRoleId = wardenRoleResult[0].id;

      // 3. Get the student role ID
      const [studentRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'student' AND is_system_role = true`,
        { transaction }
      );

      if (studentRoleResult.length === 0) {
        throw new Error("student role not found");
      }

      const studentRoleId = studentRoleResult[0].id;

      // 4. Remove the complaint_create permission from the warden role
      await queryInterface.sequelize.query(
        `DELETE FROM RolePermissions 
         WHERE role_id = ? AND permission_id = ?`,
        {
          replacements: [wardenRoleId, complaintCreatePermissionId],
          transaction,
        }
      );

      // 5. Add the complaint_create permission to the student role if not already exists
      // First check if permission already exists for student
      const [existingPermission] = await queryInterface.sequelize.query(
        `SELECT id FROM RolePermissions WHERE role_id = ? AND permission_id = ?`,
        {
          replacements: [studentRoleId, complaintCreatePermissionId],
          transaction,
        }
      );

      // Only add if it doesn't exist
      if (existingPermission.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO RolePermissions (id, role_id, permission_id, created_at) 
           VALUES (UUID(), ?, ?, NOW())`,
          {
            replacements: [studentRoleId, complaintCreatePermissionId],
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
      // 1. Get the complaint_create permission ID
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'complaint_create'`,
        { transaction }
      );

      if (permissionResult.length === 0) {
        throw new Error("complaint_create permission not found");
      }

      const complaintCreatePermissionId = permissionResult[0].id;

      // 2. Get the warden role ID
      const [wardenRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'warden' AND is_system_role = true`,
        { transaction }
      );

      if (wardenRoleResult.length === 0) {
        throw new Error("warden role not found");
      }

      const wardenRoleId = wardenRoleResult[0].id;

      // 3. Get the student role ID
      const [studentRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'student' AND is_system_role = true`,
        { transaction }
      );

      if (studentRoleResult.length === 0) {
        throw new Error("student role not found");
      }

      const studentRoleId = studentRoleResult[0].id;

      // 4. Remove the complaint_create permission from the student role
      await queryInterface.sequelize.query(
        `DELETE FROM RolePermissions 
         WHERE role_id = ? AND permission_id = ?`,
        {
          replacements: [studentRoleId, complaintCreatePermissionId],
          transaction,
        }
      );

      // 5. Add the complaint_create permission back to the warden role
      await queryInterface.sequelize.query(
        `INSERT INTO RolePermissions (id, role_id, permission_id, created_at) 
         VALUES (UUID(), ?, ?, NOW())`,
        {
          replacements: [wardenRoleId, complaintCreatePermissionId],
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
