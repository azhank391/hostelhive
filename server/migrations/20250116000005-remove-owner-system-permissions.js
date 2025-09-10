const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove system permissions from owner role
    // These should only be available to superadmin, not to regular hostel owners
    
    try {
      // Remove billing_manage and system_stats_read permissions from owner role
      await queryInterface.sequelize.query(`
        DELETE rp FROM rolepermissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.name = 'owner' 
        AND p.name IN ('billing_manage', 'system_stats_read');
      `);
      
      console.log('✅ Removed system permissions (billing_manage, system_stats_read) from owner role');
      
    } catch (error) {
      console.error('❌ Error removing system permissions:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Restore system permissions to owner role if needed
    try {
      // Get owner role ID
      const [ownerRoles] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE name = 'owner' LIMIT 1;`
      );
      
      if (ownerRoles.length === 0) {
        throw new Error('Owner role not found');
      }
      
      const ownerRoleId = ownerRoles[0].id;
      
      // Get system permission IDs
      const [systemPermissions] = await queryInterface.sequelize.query(`
        SELECT id, name FROM permissions 
        WHERE name IN ('billing_manage', 'system_stats_read');
      `);
      
      if (systemPermissions.length > 0) {
        const rolePermissions = systemPermissions.map(permission => ({
          id: uuidv4(),
          role_id: ownerRoleId,
          permission_id: permission.id,
          created_at: new Date()
        }));
        
        await queryInterface.bulkInsert('rolepermissions', rolePermissions);
        console.log('✅ Restored system permissions to owner role');
      }
      
    } catch (error) {
      console.error('❌ Error restoring system permissions:', error.message);
      throw error;
    }
  }
};
