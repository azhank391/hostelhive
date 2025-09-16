"use strict";

/**
 * 🎯 GRANULAR PERMISSIONS MIGRATION
 * 
 * Adds granular CRUD permissions for each category and implements
 * permission dependency system for automatic permission assignment.
 * 
 * This migration separates broad permissions into specific CRUD operations
 * and establishes dependencies between permissions.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Adding granular CRUD permissions...');

    // Generate UUIDs manually for migration
    const crypto = require('crypto');
    const generateUUID = () => crypto.randomUUID();

    // ==========================================
    // 1. ADD OPERATION COLUMN TO PERMISSIONS TABLE
    // ==========================================
    console.log('🔧 Checking and adding operation column to Permissions table...');
    
    // Check if operation column already exists
    const tableDescription = await queryInterface.describeTable('Permissions');
    if (!tableDescription.operation) {
      await queryInterface.addColumn('Permissions', 'operation', {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'CRUD operation type (create, read, update, delete)'
      });
      console.log('✅ Operation column added successfully');
    } else {
      console.log('✅ Operation column already exists');
    }

    // ==========================================
    // 2. ADD GRANULAR PERMISSIONS
    // ==========================================
    console.log('📋 Creating granular CRUD permissions...');
    
    const granularPermissions = [
      // 1. Profile Management - Granular CRUD
      { name: 'profile_create', display_name: 'Create Profile', description: 'Create new user profiles', category: 'profile', operation: 'create' },
      { name: 'profile_read', display_name: 'View Profile', description: 'View profile information', category: 'profile', operation: 'read' },
      { name: 'profile_update', display_name: 'Update Profile', description: 'Update profile information', category: 'profile', operation: 'update' },
      { name: 'profile_delete', display_name: 'Delete Profile', description: 'Delete profile information', category: 'profile', operation: 'delete' },
      
      // 2. Hostel Management - Granular CRUD
      { name: 'hostel_create', display_name: 'Create Hostel', description: 'Create new hostels', category: 'hostel', operation: 'create' },
      { name: 'hostel_read', display_name: 'View Hostel', description: 'View hostel information', category: 'hostel', operation: 'read' },
      { name: 'hostel_update', display_name: 'Update Hostel', description: 'Update hostel information', category: 'hostel', operation: 'update' },
      { name: 'hostel_delete', display_name: 'Delete Hostel', description: 'Delete hostels', category: 'hostel', operation: 'delete' },
      { name: 'hostel_settings_update', display_name: 'Update Hostel Settings', description: 'Update hostel settings and configuration', category: 'hostel', operation: 'update' },
      { name: 'hostel_stats_read', display_name: 'View Hostel Stats', description: 'View hostel statistics and analytics', category: 'hostel', operation: 'read' },
      
      // 3. Room Management - Granular CRUD
      { name: 'room_create', display_name: 'Create Room', description: 'Create new rooms', category: 'rooms', operation: 'create' },
      { name: 'room_read', display_name: 'View Room', description: 'View room information', category: 'rooms', operation: 'read' },
      { name: 'room_update', display_name: 'Update Room', description: 'Update room information', category: 'rooms', operation: 'update' },
      { name: 'room_delete', display_name: 'Delete Room', description: 'Delete rooms', category: 'rooms', operation: 'delete' },
      { name: 'room_allocate', display_name: 'Allocate Room', description: 'Assign rooms to students', category: 'rooms', operation: 'create' },
      { name: 'room_deallocate', display_name: 'Deallocate Room', description: 'Remove room assignments', category: 'rooms', operation: 'delete' },
      { name: 'room_allocation_read', display_name: 'View Room Allocations', description: 'View room allocation details', category: 'rooms', operation: 'read' },
      
      // 4. Student Management - Granular CRUD
      { name: 'student_create', display_name: 'Create Student', description: 'Create new student records', category: 'students', operation: 'create' },
      { name: 'student_read', display_name: 'View Student', description: 'View student information', category: 'students', operation: 'read' },
      { name: 'student_update', display_name: 'Update Student', description: 'Update student records', category: 'students', operation: 'update' },
      { name: 'student_delete', display_name: 'Delete Student', description: 'Delete student records', category: 'students', operation: 'delete' },
      { name: 'student_room_assign', display_name: 'Assign Student Room', description: 'Assign/change student rooms', category: 'students', operation: 'update' },
      { name: 'student_room_read', display_name: 'View Student Room', description: 'View student room assignments', category: 'students', operation: 'read' },
      { name: 'student_export', display_name: 'Export Student Data', description: 'Export student information', category: 'students', operation: 'read' },
      
      // 5. Warden Management - Granular CRUD
      { name: 'warden_create', display_name: 'Create Warden', description: 'Create new warden records', category: 'wardens', operation: 'create' },
      { name: 'warden_read', display_name: 'View Warden', description: 'View warden information', category: 'wardens', operation: 'read' },
      { name: 'warden_update', display_name: 'Update Warden', description: 'Update warden records', category: 'wardens', operation: 'update' },
      { name: 'warden_delete', display_name: 'Delete Warden', description: 'Delete warden records', category: 'wardens', operation: 'delete' },
      { name: 'warden_role_assign', display_name: 'Assign Warden Role', description: 'Assign roles to wardens', category: 'wardens', operation: 'update' },
      
      // 6. Complaint Management - Granular CRUD
      { name: 'complaint_create', display_name: 'Create Complaint', description: 'Create new complaints', category: 'complaints', operation: 'create' },
      { name: 'complaint_read', display_name: 'View Complaint', description: 'View complaint details', category: 'complaints', operation: 'read' },
      { name: 'complaint_update', display_name: 'Update Complaint', description: 'Update complaint status', category: 'complaints', operation: 'update' },
      { name: 'complaint_delete', display_name: 'Delete Complaint', description: 'Delete complaints', category: 'complaints', operation: 'delete' },
      { name: 'complaint_update', display_name: 'Handle Complaint', description: 'Resolve and manage complaints', category: 'complaints', operation: 'update' },
      { name: 'complaint_stats_read', display_name: 'View Complaint Stats', description: 'View complaint analytics', category: 'complaints', operation: 'read' },
      
      // 7. Visitor Management - Granular CRUD
      { name: 'visitor_create', display_name: 'Create Visitor', description: 'Create visitor logs', category: 'visitors', operation: 'create' },
      { name: 'visitor_read', display_name: 'View Visitor', description: 'View visitor details', category: 'visitors', operation: 'read' },
      { name: 'visitor_update', display_name: 'Update Visitor', description: 'Update visitor logs', category: 'visitors', operation: 'update' },
      { name: 'visitor_delete', display_name: 'Delete Visitor', description: 'Delete visitor logs', category: 'visitors', operation: 'delete' },
      { name: 'visitor_checkout', display_name: 'Checkout Visitor', description: 'Check out visitors', category: 'visitors', operation: 'update' },
      { name: 'visitor_stats_read', display_name: 'View Visitor Stats', description: 'View visitor analytics', category: 'visitors', operation: 'read' },
      { name: 'visitor_export', display_name: 'Export Visitor Data', description: 'Export visitor logs', category: 'visitors', operation: 'read' },
      
      // 8. Reports & Analytics - Granular CRUD
      { name: 'report_read', display_name: 'View Reports', description: 'View various reports', category: 'reports', operation: 'read' },
      { name: 'data_export', display_name: 'Export Data', description: 'Export data in various formats', category: 'reports', operation: 'read' },
      { name: 'analytics_read', display_name: 'View Analytics', description: 'View analytics dashboards', category: 'reports', operation: 'read' },
      { name: 'billing_read', display_name: 'View Billing', description: 'View billing information', category: 'reports', operation: 'read' },
      
      // 9. Role & Permission Management - Granular CRUD
      { name: 'role_create', display_name: 'Create Role', description: 'Create custom roles', category: 'roles', operation: 'create' },
      { name: 'role_read', display_name: 'View Role', description: 'View role details', category: 'roles', operation: 'read' },
      { name: 'role_update', display_name: 'Update Role', description: 'Update role information', category: 'roles', operation: 'update' },
      { name: 'role_delete', display_name: 'Delete Role', description: 'Delete custom roles', category: 'roles', operation: 'delete' },
      { name: 'role_assign', display_name: 'Assign Role', description: 'Assign roles to users', category: 'roles', operation: 'update' },
      { name: 'permission_manage', display_name: 'Manage Permissions', description: 'Manage permission assignments', category: 'roles', operation: 'update' },
      
      // 10. System Administration - Granular CRUD
      { name: 'system_manage', display_name: 'Manage System', description: 'System-wide management', category: 'system', operation: 'update' },
      { name: 'hostel_global_manage', display_name: 'Manage All Hostels', description: 'Manage all hostels in system', category: 'system', operation: 'update' },
      { name: 'system_stats_read', display_name: 'View System Stats', description: 'View system-wide statistics', category: 'system', operation: 'read' },
      { name: 'billing_manage', display_name: 'Manage Billing', description: 'Manage billing and payments', category: 'system', operation: 'update' },
      { name: 'owner_manage', display_name: 'Manage Owners', description: 'Create and manage owners', category: 'system', operation: 'update' },
      
      // 11. Hostel Management - Granular CRUD
      { name: 'hostel_create', display_name: 'Create Hostel', description: 'Create new hostels', category: 'hostel', operation: 'create' },
      { name: 'hostel_read', display_name: 'View Hostel', description: 'View hostel information', category: 'hostel', operation: 'read' },
      { name: 'hostel_update', display_name: 'Update Hostel', description: 'Update hostel details', category: 'hostel', operation: 'update' },
      { name: 'hostel_delete', display_name: 'Delete Hostel', description: 'Delete hostels', category: 'hostel', operation: 'delete' },
      
      // 12. User Management - Granular CRUD
      { name: 'user_create', display_name: 'Create User', description: 'Create new users', category: 'user', operation: 'create' },
      { name: 'user_read', display_name: 'View User', description: 'View user information', category: 'user', operation: 'read' },
      { name: 'user_update', display_name: 'Update User', description: 'Update user details', category: 'user', operation: 'update' },
      { name: 'user_delete', display_name: 'Delete User', description: 'Delete users', category: 'user', operation: 'delete' },
      
      // 13. Profile Management - Granular CRUD
      { name: 'profile_read', display_name: 'View Profile', description: 'View profile information', category: 'profile', operation: 'read' },
      { name: 'profile_update', display_name: 'Update Profile', description: 'Update profile details', category: 'profile', operation: 'update' },
      
      // 14. Dashboard Permissions
      { name: 'view_dashboard', display_name: 'View Dashboard', description: 'Access main dashboard', category: 'dashboard', operation: 'read' },
      { name: 'hostel_read', display_name: 'View Owner Hostels', description: 'View all owned hostels', category: 'owner', operation: 'read' },
      { name: 'view_hostel_details', display_name: 'View Hostel Details', description: 'View detailed hostel information', category: 'hostel', operation: 'read' },
      { name: 'view_settings', display_name: 'View Settings', description: 'Access settings page', category: 'settings', operation: 'read' },
      { name: 'warden_read', display_name: 'View Wardens', description: 'View warden information', category: 'warden', operation: 'read' }
    ];

    const permissionIds = {};
    
    // Check which permissions already exist
    const existingPermissions = await queryInterface.sequelize.query(
      'SELECT name FROM Permissions WHERE name IN (?)',
      {
        replacements: [granularPermissions.map(p => p.name)],
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );
    
    const existingpermissions = existingPermissions.map(p => p.name);
    console.log(`📊 Found ${existingpermissions.length} existing permissions out of ${granularPermissions.length} total`);
    
    // Only create permissions that don't exist
    const newPermissions = granularPermissions.filter(p => !existingpermissions.includes(p.name));
    console.log(`📝 Creating ${newPermissions.length} new permissions...`);
    
    for (const permission of newPermissions) {
      const permissionId = generateUUID();
      await queryInterface.bulkInsert('Permissions', [{
        id: permissionId,
        name: permission.name,
        display_name: permission.display_name,
        description: permission.description,
        category: permission.category,
        operation: permission.operation,
        is_system_permission: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);
      
      permissionIds[permission.name] = permissionId;
    }
    
    // Get IDs for existing permissions
    const allExistingPermissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM Permissions WHERE name IN (?)',
      {
        replacements: [granularPermissions.map(p => p.name)],
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );
    
    // Add existing permission IDs to our map
    allExistingPermissions.forEach(p => {
      permissionIds[p.name] = p.id;
    });

    console.log('✅ Granular permissions created successfully');

    // ==========================================
    // 3. CREATE PERMISSION DEPENDENCIES TABLE
    // ==========================================
    console.log('🔗 Creating permission dependencies table...');
    
    await queryInterface.createTable('PermissionDependencies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      parent_permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'The permission that requires other permissions'
      },
      required_permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'The permission that is required by the parent'
      },
      is_automatic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this dependency is automatically assigned'
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

    // Add foreign key constraints
    await queryInterface.addConstraint('PermissionDependencies', {
      fields: ['parent_permission_id'],
      type: 'foreign key',
      name: 'fk_permission_dependencies_parent',
      references: {
        table: 'Permissions',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('PermissionDependencies', {
      fields: ['required_permission_id'],
      type: 'foreign key',
      name: 'fk_permission_dependencies_required',
      references: {
        table: 'Permissions',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });

    // Add unique constraint
    await queryInterface.addConstraint('PermissionDependencies', {
      fields: ['parent_permission_id', 'required_permission_id'],
      type: 'unique',
      name: 'unique_permission_dependency'
    });

    console.log('✅ Permission dependencies table created successfully');

    // ==========================================
    // 4. DEFINE PERMISSION DEPENDENCIES
    // ==========================================
    console.log('🔗 Defining permission dependencies...');
    
    const dependencies = [
      // ==========================================
      // CORE FUNCTIONALITY DEPENDENCIES
      // ==========================================
      
      // Room allocation requires viewing students and rooms
      { parent: 'room_allocate', required: 'student_read' },
      { parent: 'room_allocate', required: 'room_read' },
      { parent: 'room_allocate', required: 'room_allocation_read' },
      
      // Room deallocation requires viewing allocations
      { parent: 'room_deallocate', required: 'room_allocation_read' },
      
      // Student room assignment requires viewing students and rooms
      { parent: 'student_room_assign', required: 'student_read' },
      { parent: 'student_room_assign', required: 'room_read' },
      
      // Complaint handling requires viewing complaints
      { parent: 'complaint_update', required: 'complaint_read' },
      
      // Visitor checkout requires viewing visitors
      { parent: 'visitor_checkout', required: 'visitor_read' },
      
      // Warden role assignment requires viewing wardens and roles
      { parent: 'warden_role_assign', required: 'warden_read' },
      { parent: 'warden_role_assign', required: 'role_read' },
      
      // Role assignment requires viewing roles and users
      { parent: 'role_assign', required: 'role_read' },
      { parent: 'role_assign', required: 'student_read' },
      
      // Permission management requires viewing roles
      { parent: 'permission_manage', required: 'role_read' },
      
      // Hostel settings update requires viewing hostel
      { parent: 'hostel_settings_update', required: 'hostel_read' },
      
      // System management requires viewing system stats
      { parent: 'system_manage', required: 'system_stats_read' },
      
      // Global hostel management requires viewing hostels
      { parent: 'hostel_global_manage', required: 'hostel_read' },
      
      // Billing management requires viewing billing
      { parent: 'billing_manage', required: 'billing_read' },
      
      // Owner management requires viewing system stats
      { parent: 'owner_manage', required: 'system_stats_read' },
      
      // ==========================================
      // FRONTEND-IDENTIFIED DEPENDENCIES
      // ==========================================
      
      // Dashboard dependencies
      { parent: 'view_dashboard', required: 'student_read' },
      { parent: 'view_dashboard', required: 'room_read' },
      { parent: 'view_dashboard', required: 'complaint_read' },
      { parent: 'view_dashboard', required: 'hostel_read' },
      { parent: 'view_dashboard', required: 'profile_read' },
      
      // Room management dependencies
      { parent: 'room_read', required: 'student_read' },
      { parent: 'room_read', required: 'room_allocation_read' },
      { parent: 'room_read', required: 'student_room_read' },
      { parent: 'room_read', required: 'hostel_read' },
      
      // Student management dependencies
      { parent: 'student_read', required: 'room_read' },
      { parent: 'student_read', required: 'room_allocation_read' },
      { parent: 'student_read', required: 'student_room_read' },
      { parent: 'student_read', required: 'hostel_read' },
      
      // Visitor management dependencies
      { parent: 'visitor_read', required: 'student_read' },
      { parent: 'visitor_read', required: 'room_read' },
      { parent: 'visitor_read', required: 'room_allocation_read' },
      { parent: 'visitor_read', required: 'hostel_read' },
      
      // Complaint management dependencies
      { parent: 'complaint_read', required: 'student_read' },
      { parent: 'complaint_read', required: 'profile_read' },
      { parent: 'complaint_read', required: 'hostel_read' },
      
      // Staff management dependencies
      { parent: 'role_read', required: 'user_read' },
      { parent: 'role_read', required: 'permission_read' },
      { parent: 'role_read', required: 'hostel_read' },
      
      // Warden management dependencies
      { parent: 'warden_read', required: 'user_read' },
      { parent: 'warden_read', required: 'profile_read' },
      { parent: 'warden_read', required: 'hostel_read' },
      
      // Settings dependencies
      { parent: 'view_settings', required: 'hostel_read' },
      { parent: 'view_settings', required: 'hostel_update' },
      { parent: 'view_settings', required: 'profile_read' },
      { parent: 'view_settings', required: 'profile_update' },
      
      // Hostel detail dependencies
      { parent: 'view_hostel_details', required: 'hostel_read' },
      { parent: 'view_hostel_details', required: 'hostel_update' },
      { parent: 'view_hostel_details', required: 'hostel_delete' },
      { parent: 'view_hostel_details', required: 'student_read' },
      { parent: 'view_hostel_details', required: 'room_read' },
      { parent: 'view_hostel_details', required: 'complaint_read' },
      
      // Owner hostels dependencies
      { parent: 'hostel_read', required: 'hostel_read' },
      { parent: 'hostel_read', required: 'hostel_create' },
      { parent: 'hostel_read', required: 'hostel_update' },
      { parent: 'hostel_read', required: 'hostel_delete' },
      { parent: 'hostel_read', required: 'student_read' },
      { parent: 'hostel_read', required: 'room_read' },
      { parent: 'hostel_read', required: 'complaint_read' },
      
      // ==========================================
      // CROSS-FUNCTIONAL DEPENDENCIES
      // ==========================================
      
      // All major operations require hostel context
      { parent: 'student_create', required: 'hostel_read' },
      { parent: 'student_update', required: 'hostel_read' },
      { parent: 'student_delete', required: 'hostel_read' },
      { parent: 'room_create', required: 'hostel_read' },
      { parent: 'room_update', required: 'hostel_read' },
      { parent: 'room_delete', required: 'hostel_read' },
      { parent: 'complaint_create', required: 'hostel_read' },
      { parent: 'complaint_update', required: 'hostel_read' },
      { parent: 'complaint_delete', required: 'hostel_read' },
      { parent: 'visitor_create', required: 'hostel_read' },
      { parent: 'visitor_update', required: 'hostel_read' },
      { parent: 'visitor_delete', required: 'hostel_read' },
      
      // User management requires profile access
      { parent: 'user_create', required: 'profile_read' },
      { parent: 'user_update', required: 'profile_read' },
      { parent: 'user_delete', required: 'profile_read' },
      
      // Warden management requires user access
      { parent: 'warden_create', required: 'user_read' },
      { parent: 'warden_update', required: 'user_read' },
      { parent: 'warden_delete', required: 'user_read' },
      
      // Role management requires user access
      { parent: 'role_create', required: 'user_read' },
      { parent: 'role_update', required: 'user_read' },
      { parent: 'role_delete', required: 'user_read' }
    ];

    // Check which dependencies already exist
    const existingDependencies = await queryInterface.sequelize.query(
      'SELECT parent_permission_id, required_permission_id FROM PermissionDependencies',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const existingDepKeys = existingDependencies.map(dep => 
      `${dep.parent_permission_id}-${dep.required_permission_id}`
    );
    
    let newDependenciesCount = 0;
    for (const dep of dependencies) {
      if (permissionIds[dep.parent] && permissionIds[dep.required]) {
        const depKey = `${permissionIds[dep.parent]}-${permissionIds[dep.required]}`;
        
        if (!existingDepKeys.includes(depKey)) {
          await queryInterface.bulkInsert('PermissionDependencies', [{
            id: generateUUID(),
            parent_permission_id: permissionIds[dep.parent],
            required_permission_id: permissionIds[dep.required],
            is_automatic: true,
            created_at: new Date(),
            updated_at: new Date()
          }]);
          newDependenciesCount++;
        }
      }
    }
    
    console.log(`✅ Created ${newDependenciesCount} new permission dependencies`);

    console.log('✅ Permission dependencies defined successfully');
    console.log('🎉 Granular permissions migration completed!');
    console.log('📊 Summary:');
    console.log('   - 60+ granular CRUD permissions created');
    console.log('   - Permission dependencies table created');
    console.log('   - Automatic dependency resolution configured');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back granular permissions migration...');
    
    // Remove permission dependencies
    await queryInterface.dropTable('PermissionDependencies');
    
    // Remove granular permissions (keep original permissions)
    const granularpermissions = [
      'profile_create', 'profile_read', 'profile_update', 'profile_delete',
      'hostel_create', 'hostel_read', 'hostel_update', 'hostel_delete', 'hostel_settings_update', 'hostel_stats_read',
      'room_create', 'room_read', 'room_update', 'room_delete', 'room_allocate', 'room_deallocate', 'room_allocation_read',
      'student_create', 'student_read', 'student_update', 'student_delete', 'student_room_assign', 'student_room_read', 'student_export',
      'warden_create', 'warden_read', 'warden_update', 'warden_delete', 'warden_role_assign',
      'complaint_create', 'complaint_read', 'complaint_update', 'complaint_delete', 'complaint_update', 'complaint_stats_read',
      'visitor_create', 'visitor_read', 'visitor_update', 'visitor_delete', 'visitor_checkout', 'visitor_stats_read', 'visitor_export',
      'report_read', 'data_export', 'analytics_read', 'billing_read',
      'role_create', 'role_read', 'role_update', 'role_delete', 'role_assign', 'permission_manage',
      'system_manage', 'hostel_global_manage', 'system_stats_read', 'billing_manage', 'owner_manage'
    ];
    
    await queryInterface.bulkDelete('Permissions', {
      name: {
        [Sequelize.Op.in]: granularpermissions
      }
    });
    
    console.log('✅ Granular permissions migration rolled back successfully!');
  }
};

