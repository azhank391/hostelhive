"use strict";

/**
 * 🧹 CLEANUP DUPLICATE ROLES MIGRATION
 * 
 * This migration cleans up duplicate roles that might have been created
 * during the RBAC seeding process. It keeps the first occurrence of each
 * role and removes duplicates.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🧹 Cleaning up duplicate roles...');

    // Find duplicate roles
    const duplicates = await queryInterface.sequelize.query(
      `SELECT name, COUNT(*) as count 
       FROM Roles 
       WHERE is_system_role = true 
       GROUP BY name 
       HAVING COUNT(*) > 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (duplicates.length === 0) {
      console.log('✅ No duplicate roles found');
      return;
    }

    console.log('🔍 Found duplicate roles:', duplicates);

    // For each duplicate role, keep the first one and remove the rest
    for (const duplicate of duplicates) {
      const roles = await queryInterface.sequelize.query(
        `SELECT id, name, created_at 
         FROM Roles 
         WHERE name = :roleName AND is_system_role = true 
         ORDER BY created_at ASC`,
        {
          replacements: { roleName: duplicate.name },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      console.log(`🔄 Processing duplicate role: ${duplicate.name}`);
      console.log(`   Found ${roles.length} instances`);

      // Keep the first role, remove the rest
      const [roleToKeep, ...rolesToRemove] = roles;
      
      console.log(`   Keeping role: ${roleToKeep.id}`);
      
      for (const roleToRemove of rolesToRemove) {
        console.log(`   Removing duplicate role: ${roleToRemove.id}`);
        
        // First, remove any role-permission mappings for this duplicate role
        await queryInterface.sequelize.query(
          'DELETE FROM RolePermissions WHERE role_id = :roleId',
          {
            replacements: { roleId: roleToRemove.id },
            type: Sequelize.QueryTypes.DELETE
          }
        );
        
        // Then remove the duplicate role
        await queryInterface.sequelize.query(
          'DELETE FROM Roles WHERE id = :roleId',
          {
            replacements: { roleId: roleToRemove.id },
            type: Sequelize.QueryTypes.DELETE
          }
        );
      }
    }

    console.log('✅ Duplicate roles cleanup completed!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Cannot rollback duplicate roles cleanup - data has been permanently removed');
    console.log('   If you need to restore, you would need to re-run the RBAC seed migration');
  }
};
