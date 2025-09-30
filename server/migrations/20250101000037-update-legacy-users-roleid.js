"use strict";

/**
 * 🔄 UPDATE LEGACY USERS ROLEID MIGRATION
 * 
 * This migration updates existing users to have the correct roleId
 * based on their legacy role field. This ensures that the RBAC system
 * can properly identify and assign permissions to legacy users.
 * 
 * This migration should be run after the RBAC seed data migration.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Updating legacy users with roleId...');

    // Get all system roles
    const systemRoles = await queryInterface.sequelize.query(
      'SELECT id, name FROM Roles WHERE is_system_role = true',
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('📋 Found system roles:', systemRoles);

    // Create a mapping of role names to role IDs
    const roleMapping = {};
    systemRoles.forEach(role => {
      roleMapping[role.name] = role.id;
    });

    console.log('🗺️ Role mapping:', roleMapping);

    // Update users based on their legacy role
    for (const [roleName, roleId] of Object.entries(roleMapping)) {
      if (roleId) {
        const [results] = await queryInterface.sequelize.query(
          `UPDATE Users SET role_id = :roleId WHERE role = :roleName AND role_id IS NULL`,
          {
            replacements: { roleId, roleName },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
        
        console.log(`✅ Updated ${results} users with role '${roleName}' to have roleId '${roleId}'`);
      }
    }

    // Check for any users that still don't have a role_id
    const [usersWithoutRoleId] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM Users WHERE role_id IS NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (usersWithoutRoleId.count > 0) {
      console.log(`⚠️ Warning: ${usersWithoutRoleId.count} users still don't have a role_id`);
      
      // Show which users don't have role_id
      const [usersWithoutRole] = await queryInterface.sequelize.query(
        'SELECT id, name, email, role FROM Users WHERE role_id IS NULL LIMIT 10',
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      console.log('👥 Users without role_id:', usersWithoutRole);
    } else {
      console.log('✅ All users now have a role_id assigned');
    }

    console.log('🎉 Legacy users roleId update completed!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back legacy users roleId update...');
    
    // Remove role_id from all users (set to NULL)
    await queryInterface.sequelize.query(
      'UPDATE Users SET role_id = NULL',
      { type: Sequelize.QueryTypes.UPDATE }
    );
    
    console.log('✅ Legacy users roleId rollback completed!');
  }
};
