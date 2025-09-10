"use strict";

/**
 * 🎯 RBAC PERMISSIONS TABLE MIGRATION
 * 
 * Creates the permissions table for the RBAC system.
 * 
 * Features:
 * - Predefined system permissions
 * - Categorized permissions (rooms, students, complaints, etc.)
 * - Comprehensive permission coverage
 * - Performance optimized with indexes
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🎯 Creating Permissions table for RBAC system...');

    await queryInterface.createTable('Permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Permission name: manage_rooms, view_students, handle_complaints'
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Human-readable permission name: Manage Rooms, View Students'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Permission description and scope'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Permission category: rooms, students, complaints, visitors, reports, roles'
      },
      is_system_permission: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'All permissions are predefined system permissions'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    console.log('📊 Adding indexes to Permissions table...');
    
    // Index for permission categories
    await queryInterface.addIndex('Permissions', ['category'], {
      name: 'idx_permissions_category',
      comment: 'Fast filtering by permission category'
    });

    // Index for system permissions
    await queryInterface.addIndex('Permissions', ['is_system_permission'], {
      name: 'idx_permissions_is_system',
      comment: 'Fast filtering by system permissions'
    });

    // Composite index for category and system status
    await queryInterface.addIndex('Permissions', ['category', 'is_system_permission'], {
      name: 'idx_permissions_category_system',
      comment: 'Fast filtering by category and system status'
    });

    console.log('✅ Permissions table created successfully with indexes!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Dropping Permissions table...');
    
    // Remove indexes first
    await queryInterface.removeIndex('Permissions', 'idx_permissions_category_system');
    await queryInterface.removeIndex('Permissions', 'idx_permissions_is_system');
    await queryInterface.removeIndex('Permissions', 'idx_permissions_category');
    
    // Drop the table
    await queryInterface.dropTable('Permissions');
    
    console.log('✅ Permissions table dropped successfully!');
  }
};

