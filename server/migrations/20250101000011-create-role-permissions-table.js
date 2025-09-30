"use strict";

/**
 * 🎯 RBAC ROLE PERMISSIONS TABLE MIGRATION
 * 
 * Creates the role_permissions table for mapping roles to permissions.
 * 
 * Features:
 * - Many-to-many relationship between roles and permissions
 * - Prevents duplicate permission assignments
 * - Cascade deletion for data integrity
 * - Performance optimized with indexes
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🎯 Creating Role Permissions table for RBAC system...');

    await queryInterface.createTable('RolePermissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the role',
        references: {
          model: 'Roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the permission',
        references: {
          model: 'Permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    console.log('📊 Adding indexes to Role Permissions table...');
    
    // Unique constraint to prevent duplicate permission assignments
    await queryInterface.addIndex('RolePermissions', ['role_id', 'permission_id'], {
      name: 'unique_role_permission',
      unique: true,
      comment: 'Prevent duplicate permission assignments to roles'
    });

    // Index for role-based lookups
    await queryInterface.addIndex('RolePermissions', ['role_id'], {
      name: 'idx_role_permissions_role_id',
      comment: 'Fast lookup of permissions by role'
    });

    // Index for permission-based lookups
    await queryInterface.addIndex('RolePermissions', ['permission_id'], {
      name: 'idx_role_permissions_permission_id',
      comment: 'Fast lookup of roles by permission'
    });

    console.log('✅ Role Permissions table created successfully with indexes!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Dropping Role Permissions table...');
    
    // Remove indexes first
    await queryInterface.removeIndex('RolePermissions', 'idx_role_permissions_permission_id');
    await queryInterface.removeIndex('RolePermissions', 'idx_role_permissions_role_id');
    await queryInterface.removeIndex('RolePermissions', 'unique_role_permission');
    
    // Drop the table
    await queryInterface.dropTable('RolePermissions');
    
    console.log('✅ Role Permissions table dropped successfully!');
  }
};

