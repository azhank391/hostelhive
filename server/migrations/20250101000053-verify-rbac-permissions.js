"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("🔍 Verifying RBAC permissions setup...");

      // Check if RolePermissions exist for owner role
      const [results] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count 
        FROM RolePermissions rp 
        JOIN Roles r ON rp.role_id = r.id 
        WHERE r.name = 'owner' AND r.is_system_role = true
      `);

      const ownerPermissionsCount = results[0].count;
      console.log(`ℹ️  Found ${ownerPermissionsCount} permissions for owner role`);

      if (ownerPermissionsCount === 0) {
        console.log("⚠️  No permissions found for owner role. Re-running seed...");
        
        // Re-run the seed logic from migration 20250101000012
        // This is safe because it will only insert missing permissions
        
        // Get owner role ID
        const [ownerRoles] = await queryInterface.sequelize.query(`
          SELECT id FROM Roles WHERE name = 'owner' AND is_system_role = true LIMIT 1
        `);
        
        if (ownerRoles.length === 0) {
          throw new Error("Owner role not found!");
        }
        
        const ownerRoleId = ownerRoles[0].id;
        
        // Get all permission IDs
        const [permissions] = await queryInterface.sequelize.query(`
          SELECT id, name FROM Permissions
        `);
        
        const permissionMap = {};
        permissions.forEach(p => {
          permissionMap[p.name] = p.id;
        });
        
        // Owner permissions list
        const ownerPermissions = [
          "manage_profile", "view_profile", "change_password", "view_own_data",
          "hostel_create", "hostel_read", "hostel_update", "hostel_delete",
          "hostel_settings_update", "view_hostel_stats",
          "room_create", "room_read", "room_update", "room_delete",
          "room_allocate", "room_deallocate", "room_allocation_read",
          "student_create", "student_read", "student_update", "student_delete",
          "manage_student_rooms", "view_student_rooms", "export_student_data",
          "staff_create", "staff_read", "staff_update", "staff_delete", "role_assign",
          "complaint_create", "complaint_read", "complaint_update", "complaint_delete",
          "view_complaint_stats",
          "visitor_create", "visitor_read", "visitor_update", "visitor_delete",
          "visitor_checkout", "view_visitor_stats", "export_visitor_data",
          "view_reports", "view_analytics", "view_billing"
        ];
        
        // Insert owner permissions
        const rolePermissions = [];
        for (const permName of ownerPermissions) {
          if (permissionMap[permName]) {
            rolePermissions.push({
              id: require('crypto').randomUUID(),
              role_id: ownerRoleId,
              permission_id: permissionMap[permName],
              created_at: new Date()
            });
          } else {
            console.warn(`⚠️  Permission not found: ${permName}`);
          }
        }
        
        if (rolePermissions.length > 0) {
          await queryInterface.bulkInsert('RolePermissions', rolePermissions);
          console.log(`✅ Inserted ${rolePermissions.length} permissions for owner role`);
        }
        
      } else {
        console.log("✅ Owner role already has permissions, skipping re-seed");
      }

      console.log("✅ RBAC permissions verification complete");
    } catch (error) {
      console.error("❌ Error verifying RBAC permissions:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a verification/fix migration, no rollback needed
    console.log("ℹ️  No rollback needed for permission verification");
  },
};
