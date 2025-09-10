"use strict";

/**
 * 🎯 RBAC ROLES TABLE MIGRATION
 * 
 * Creates the roles table for the RBAC system.
 * 
 * Features:
 * - Stores both system roles (owner, student) and custom roles
 * - Hostel-specific custom roles
 * - Proper foreign key constraints
 * - Unique constraints for custom roles per hostel
 * - Comprehensive indexing for performance
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🎯 Creating Roles table for RBAC system...');

    await queryInterface.createTable('Roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Role name: owner, student, custom_warden, etc.'
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Human-readable role name: Hostel Owner, Student, Warden'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Role description and purpose'
      },
      is_system_role: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'TRUE for system roles (owner/student), FALSE for custom roles'
      },
      hostel_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'NULL for system roles, hostel_id for custom roles',
        references: {
          model: 'Hostels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User who created this role (only for custom roles)',
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    console.log('📊 Adding indexes to Roles table...');
    
    // Unique constraint for custom role names per hostel
    await queryInterface.addIndex('Roles', ['name', 'hostel_id'], {
      name: 'unique_custom_role',
      unique: true,
      comment: 'Ensure custom role names are unique per hostel'
    });

    // Index for system vs custom roles
    await queryInterface.addIndex('Roles', ['is_system_role'], {
      name: 'idx_roles_is_system_role',
      comment: 'Fast filtering by system vs custom roles'
    });

    // Index for hostel-specific roles
    await queryInterface.addIndex('Roles', ['hostel_id'], {
      name: 'idx_roles_hostel_id',
      comment: 'Fast lookup of roles by hostel'
    });

    // Index for role creator
    await queryInterface.addIndex('Roles', ['created_by'], {
      name: 'idx_roles_created_by',
      comment: 'Fast lookup of roles by creator'
    });

    // Composite index for common queries
    await queryInterface.addIndex('Roles', ['is_system_role', 'hostel_id'], {
      name: 'idx_roles_system_hostel',
      comment: 'Fast lookup of system/custom roles by hostel'
    });

    console.log('✅ Roles table created successfully with indexes!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Dropping Roles table...');
    
    // Remove indexes first
    await queryInterface.removeIndex('Roles', 'idx_roles_system_hostel');
    await queryInterface.removeIndex('Roles', 'idx_roles_created_by');
    await queryInterface.removeIndex('Roles', 'idx_roles_hostel_id');
    await queryInterface.removeIndex('Roles', 'idx_roles_is_system_role');
    await queryInterface.removeIndex('Roles', 'unique_custom_role');
    
    // Drop the table
    await queryInterface.dropTable('Roles');
    
    console.log('✅ Roles table dropped successfully!');
  }
};

