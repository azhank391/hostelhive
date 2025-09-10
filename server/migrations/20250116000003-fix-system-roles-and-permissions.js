'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Fixing system roles and assigning granular permissions');
    
    // 1. Fix system roles to have is_system_role = true
    await queryInterface.bulkUpdate('Roles', 
      { is_system_role: true },
      { 
        name: ['owner', 'student', 'warden', 'superadmin'],
        is_system_role: false 
      }
    );
    
    console.log('✅ System roles marked as system roles');
    
    // 2. Get permission IDs for granular permissions
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM Permissions WHERE operation IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const permissionMap = {};
    permissions.forEach(p => {
      permissionMap[p.name] = p.id;
    });
    
    // 3. Get role IDs
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM Roles WHERE name IN (?, ?, ?, ?)',
      { 
        replacements: ['owner', 'student', 'warden', 'superadmin'],
        type: queryInterface.sequelize.QueryTypes.SELECT 
      }
    );
    
    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.name] = r.id;
    });
    
    // 4. Clear existing role permissions for system roles
    await queryInterface.bulkDelete('RolePermissions', {
      role_id: roles.map(r => r.id)
    });
    
    console.log('✅ Cleared existing role permissions');
    
    // 5. Define system role permissions using granular permissions
    const systemRolePermissions = {
      owner: [
        // Profile Management
        'profile_read', 'profile_update',
        // Hostel Management  
        'hostel_read', 'hostel_update', 'hostel_settings_update', 'hostel_stats_read', 'view_hostel_details',
        // Room Management
        'room_create', 'room_read', 'room_update', 'room_delete', 'room_allocate', 'room_deallocate', 'room_allocation_read',
        // Student Management
        'student_create', 'student_read', 'student_update', 'student_delete', 'student_room_assign', 'student_room_read', 'student_export',
        // Warden Management
        'warden_create', 'warden_read', 'warden_update', 'warden_delete', 'warden_role_assign', 'warden_read',
        // Complaint Management
        'complaint_create', 'complaint_read', 'complaint_update', 'complaint_delete', 'complaint_update', 'complaint_stats_read',
        // Visitor Management
        'visitor_create', 'visitor_read', 'visitor_update', 'visitor_delete', 'visitor_checkout', 'visitor_stats_read', 'visitor_export',
        // Reports & Analytics
        'report_read', 'data_export', 'analytics_read', 'billing_read',
        // Role Management
        'role_create', 'role_read', 'role_update', 'role_delete', 'role_assign', 'permission_manage',
        // Dashboard & Settings
        'view_dashboard', 'view_settings', 'hostel_read',
        // User Management
        'user_create', 'user_read', 'user_update', 'user_delete'
      ],
      
      warden: [
        // Profile Management
        'profile_read', 'profile_update',
        // Hostel Management (read-only)
        'hostel_read', 'hostel_stats_read', 'view_hostel_details', // Add hostel_stats_read
        // Room Management
        'room_read', 'room_allocate', 'room_deallocate', 'room_allocation_read',
        // Student Management
        'student_read', 'student_room_assign', 'student_room_read',
        // Complaint Management
        'complaint_read', 'complaint_update',
        // Visitor Management
        'visitor_read', 'visitor_checkout',
        // Dashboard
        'view_dashboard'
      ],
      
      student: [
        // Profile Management
        'profile_read', 'profile_update',
        // Own data only
        'student_room_read', 'complaint_read', 'visitor_read',
        // Dashboard
        'view_dashboard'
      ],
      
      superadmin: [
        // Everything (all permissions)
        ...Object.keys(permissionMap)
      ]
    };
    
    // 6. Insert role permissions
    const rolePermissions = [];
    
    for (const [roleName, permissionNames] of Object.entries(systemRolePermissions)) {
      const roleId = roleMap[roleName];
      if (!roleId) continue;
      
      for (const permissionName of permissionNames) {
        const permissionId = permissionMap[permissionName];
        if (permissionId) {
          rolePermissions.push({
            id: require('uuid').v4(),
            role_id: roleId,
            permission_id: permissionId,
            created_at: new Date()
          });
        }
      }
    }
    
    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('RolePermissions', rolePermissions);
      console.log(`✅ Assigned ${rolePermissions.length} granular permissions to system roles`);
    }
    
    console.log('🎉 System roles updated with granular permissions!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Reverting system roles...');
    
    // Revert system roles back to is_system_role = false
    await queryInterface.bulkUpdate('Roles', 
      { is_system_role: false },
      { 
        name: ['owner', 'student', 'warden', 'superadmin'],
        is_system_role: true 
      }
    );
    
    console.log('✅ System roles reverted');
  }
};
