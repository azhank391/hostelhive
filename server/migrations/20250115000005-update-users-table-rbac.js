"use strict";

/**
 * 🎯 RBAC USERS TABLE UPDATE MIGRATION
 * 
 * Updates the Users table to support the new RBAC system.
 * 
 * Features:
 * - Adds role_id column for new RBAC system
 * - Keeps existing 'role' column for backward compatibility
 * - Proper foreign key constraints
 * - Performance optimized with indexes
 * - No breaking changes to existing code
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🎯 Updating Users table for RBAC system...');

    // Add role_id column to Users table
    await queryInterface.addColumn('Users', 'role_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'Reference to the new RBAC role system',
      references: {
        model: 'Roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add indexes for performance
    console.log('📊 Adding indexes to Users table for RBAC...');
    
    // Index for role_id lookups
    await queryInterface.addIndex('Users', ['role_id'], {
      name: 'idx_users_role_id',
      comment: 'Fast lookup of users by RBAC role'
    });

    // Composite index for role and hostel lookups
    await queryInterface.addIndex('Users', ['role_id', 'hostelId'], {
      name: 'idx_users_role_hostel',
      comment: 'Fast lookup of users by role and hostel'
    });

    // Composite index for legacy role and new role system
    await queryInterface.addIndex('Users', ['role', 'role_id'], {
      name: 'idx_users_legacy_new_role',
      comment: 'Fast lookup combining legacy and new role systems'
    });

    console.log('✅ Users table updated successfully for RBAC system!');
    console.log('📝 Note: Existing "role" column is preserved for backward compatibility');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back Users table RBAC updates...');
    
    // Remove indexes first
    await queryInterface.removeIndex('Users', 'idx_users_legacy_new_role');
    await queryInterface.removeIndex('Users', 'idx_users_role_hostel');
    await queryInterface.removeIndex('Users', 'idx_users_role_id');
    
    // Remove the role_id column
    await queryInterface.removeColumn('Users', 'role_id');
    
    console.log('✅ Users table RBAC updates rolled back successfully!');
  }
};



