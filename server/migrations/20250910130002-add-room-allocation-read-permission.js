'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Check if the room_allocation_read permission exists
      const [existingPermission] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'room_allocation_read'`,
        { transaction }
      );
      
      let roomAllocationReadPermissionId;
      
      // Create the permission if it doesn't exist
      if (existingPermission.length === 0) {
        const uuid = require('uuid').v4();
        await queryInterface.sequelize.query(
          `INSERT INTO Permissions (id, name, display_name, description, created_at, updated_at) 
           VALUES (?, 'room_allocation_read', 'Room Allocation Read', 'Permission to read room allocation information', NOW(), NOW())`,
          { 
            replacements: [uuid],
            transaction 
          }
        );
        
        roomAllocationReadPermissionId = uuid;
      } else {
        roomAllocationReadPermissionId = existingPermission[0].id;
      }
      
      // 2. Get the owner role ID
      const [ownerRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'owner' AND is_system_role = true`,
        { transaction }
      );
      
      if (ownerRoleResult.length === 0) {
        throw new Error('owner role not found');
      }
      
      const ownerRoleId = ownerRoleResult[0].id;
      
      // 3. Get the warden role ID
      const [wardenRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'warden' AND is_system_role = true`,
        { transaction }
      );
      
      if (wardenRoleResult.length === 0) {
        throw new Error('warden role not found');
      }
      
      const wardenRoleId = wardenRoleResult[0].id;
      
      // 4. Check if the permission is already assigned to the owner role
      const [existingOwnerRolePermission] = await queryInterface.sequelize.query(
        `SELECT id FROM RolePermissions WHERE role_id = ? AND permission_id = ?`,
        { 
          replacements: [ownerRoleId, roomAllocationReadPermissionId],
          transaction 
        }
      );
      
      // 5. Add the permission to the owner role if not already exists
      if (existingOwnerRolePermission.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO RolePermissions (id, role_id, permission_id, created_at) 
           VALUES (UUID(), ?, ?, NOW())`,
          { 
            replacements: [ownerRoleId, roomAllocationReadPermissionId],
            transaction 
          }
        );
      }
      
      // 6. Check if the permission is already assigned to the warden role
      const [existingWardenRolePermission] = await queryInterface.sequelize.query(
        `SELECT id FROM RolePermissions WHERE role_id = ? AND permission_id = ?`,
        { 
          replacements: [wardenRoleId, roomAllocationReadPermissionId],
          transaction 
        }
      );
      
      // 7. Add the permission to the warden role if not already exists
      if (existingWardenRolePermission.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO RolePermissions (id, role_id, permission_id, created_at) 
           VALUES (UUID(), ?, ?, NOW())`,
          { 
            replacements: [wardenRoleId, roomAllocationReadPermissionId],
            transaction 
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
      // 1. Get the room_allocation_read permission ID
      const [permissionResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Permissions WHERE name = 'room_allocation_read'`,
        { transaction }
      );
      
      if (permissionResult.length === 0) {
        // Permission doesn't exist, nothing to do
        await transaction.commit();
        return Promise.resolve();
      }
      
      const roomAllocationReadPermissionId = permissionResult[0].id;
      
      // 2. Get the owner role ID
      const [ownerRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'owner' AND is_system_role = true`,
        { transaction }
      );
      
      if (ownerRoleResult.length === 0) {
        throw new Error('owner role not found');
      }
      
      const ownerRoleId = ownerRoleResult[0].id;
      
      // 3. Get the warden role ID
      const [wardenRoleResult] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = 'warden' AND is_system_role = true`,
        { transaction }
      );
      
      if (wardenRoleResult.length === 0) {
        throw new Error('warden role not found');
      }
      
      const wardenRoleId = wardenRoleResult[0].id;
      
      // 4. Remove the permission from the owner role
      await queryInterface.sequelize.query(
        `DELETE FROM RolePermissions 
         WHERE role_id = ? AND permission_id = ?`,
        { 
          replacements: [ownerRoleId, roomAllocationReadPermissionId],
          transaction 
        }
      );
      
      // 5. Remove the permission from the warden role
      await queryInterface.sequelize.query(
        `DELETE FROM RolePermissions 
         WHERE role_id = ? AND permission_id = ?`,
        { 
          replacements: [wardenRoleId, roomAllocationReadPermissionId],
          transaction 
        }
      );
      
      await transaction.commit();
      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      return Promise.reject(error);
    }
  }
};
