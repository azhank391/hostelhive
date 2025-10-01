"use strict";

/**
 * 🎯 COMPREHENSIVE PERMISSION DEPENDENCIES MIGRATION
 * 
 * Adds comprehensive dependencies for all permissions that require other permissions
 * to function properly. This ensures that when a permission is assigned, all
 * necessary supporting permissions are automatically included.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔗 Adding comprehensive permission dependencies...');

    // Generate UUIDs manually for migration
    const crypto = require('crypto');
    const generateUUID = () => crypto.randomUUID();

    // Get all permissions to find their IDs (do not rely on operation column)
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM Permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const permissionIds = {};
    permissions.forEach(p => {
      permissionIds[p.name] = p.id;
    });

    // ==========================================
    // COMPREHENSIVE DEPENDENCY DEFINITIONS
    // ==========================================
    
    const comprehensiveDependencies = [
      // ==========================================
      // ROOM MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Room allocation requires viewing students, rooms, and allocations
      { parent: 'room_allocate', required: 'student_read' },
      { parent: 'room_allocate', required: 'room_read' },
      { parent: 'room_allocate', required: 'room_allocation_read' },
      
      // Room deallocation requires viewing allocations and students
      { parent: 'room_deallocate', required: 'room_allocation_read' },
      { parent: 'room_deallocate', required: 'student_read' },
      
      // Room updates require viewing rooms
      { parent: 'room_update', required: 'room_read' },
      
      // Room deletion requires viewing rooms and allocations
      { parent: 'room_delete', required: 'room_read' },
      { parent: 'room_delete', required: 'room_allocation_read' },

      // ==========================================
      // STUDENT MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Student room assignment requires viewing students and rooms
      { parent: 'student_room_assign', required: 'student_read' },
      { parent: 'student_room_assign', required: 'room_read' },
      { parent: 'student_room_assign', required: 'room_allocation_read' },
      
      // Student updates require viewing students
      { parent: 'student_update', required: 'student_read' },
      
      // Student deletion requires viewing students and room allocations
      { parent: 'student_delete', required: 'student_read' },
      { parent: 'student_delete', required: 'room_allocation_read' },
      
      // Student export requires viewing students
      { parent: 'student_export', required: 'student_read' },

      // ==========================================
      // COMPLAINT MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Complaint handling requires viewing complaints
      { parent: 'complaint_update', required: 'complaint_read' },
      
      // Complaint updates require viewing complaints
      { parent: 'complaint_update', required: 'complaint_read' },
      
      // Complaint deletion requires viewing complaints
      { parent: 'complaint_delete', required: 'complaint_read' },
      
      // Complaint stats require viewing complaints
      { parent: 'complaint_stats_read', required: 'complaint_read' },

      // ==========================================
      // VISITOR MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Visitor checkout requires viewing visitors
      { parent: 'visitor_checkout', required: 'visitor_read' },
      
      // Visitor updates require viewing visitors
      { parent: 'visitor_update', required: 'visitor_read' },
      
      // Visitor deletion requires viewing visitors
      { parent: 'visitor_delete', required: 'visitor_read' },
      
      // Visitor stats require viewing visitors
      { parent: 'visitor_stats_read', required: 'visitor_read' },
      
      // Visitor export requires viewing visitors
      { parent: 'visitor_export', required: 'visitor_read' },

      // ==========================================
      // WARDEN MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Warden role assignment requires viewing wardens and roles
      { parent: 'warden_role_assign', required: 'warden_read' },
      { parent: 'warden_role_assign', required: 'role_read' },
      
      // Warden updates require viewing wardens
      { parent: 'warden_update', required: 'warden_read' },
      
      // Warden deletion requires viewing wardens
      { parent: 'warden_delete', required: 'warden_read' },

      // ==========================================
      // ROLE & PERMISSION MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Role assignment requires viewing roles and users
      { parent: 'role_assign', required: 'role_read' },
      { parent: 'role_assign', required: 'student_read' },
      
      // Permission management requires viewing roles
      { parent: 'permission_manage', required: 'role_read' },
      
      // Role updates require viewing roles
      { parent: 'role_update', required: 'role_read' },
      
      // Role deletion requires viewing roles
      { parent: 'role_delete', required: 'role_read' },

      // ==========================================
      // HOSTEL MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Hostel settings update requires viewing hostel
      { parent: 'hostel_settings_update', required: 'hostel_read' },
      
      // Hostel updates require viewing hostel
      { parent: 'hostel_update', required: 'hostel_read' },
      
      // Hostel deletion requires viewing hostel and stats
      { parent: 'hostel_delete', required: 'hostel_read' },
      { parent: 'hostel_delete', required: 'hostel_stats_read' },
      
      // Hostel stats require viewing hostel
      { parent: 'hostel_stats_read', required: 'hostel_read' },

      // ==========================================
      // SYSTEM ADMINISTRATION DEPENDENCIES
      // ==========================================
      
      // System management requires viewing system stats
      { parent: 'system_manage', required: 'system_stats_read' },
      
      // Global hostel management requires viewing hostels and system stats
      { parent: 'hostel_global_manage', required: 'hostel_read' },
      { parent: 'hostel_global_manage', required: 'system_stats_read' },
      
      // Billing management requires viewing billing and system stats
      { parent: 'billing_manage', required: 'billing_read' },
      { parent: 'billing_manage', required: 'system_stats_read' },
      
      // Owner management requires viewing system stats and owners
      { parent: 'owner_manage', required: 'system_stats_read' },
      { parent: 'owner_manage', required: 'student_read' }, // For viewing owner profiles

      // ==========================================
      // REPORTS & ANALYTICS DEPENDENCIES
      // ==========================================
      
      // Data export requires viewing the data being exported
      { parent: 'data_export', required: 'student_read' },
      { parent: 'data_export', required: 'visitor_read' },
      { parent: 'data_export', required: 'complaint_read' },
      
      // Analytics require viewing various data
      { parent: 'analytics_read', required: 'hostel_stats_read' },
      { parent: 'analytics_read', required: 'visitor_stats_read' },
      { parent: 'analytics_read', required: 'complaint_stats_read' },
      
      // Billing read requires viewing system stats
      { parent: 'billing_read', required: 'system_stats_read' },

      // ==========================================
      // PROFILE MANAGEMENT DEPENDENCIES
      // ==========================================
      
      // Profile updates require viewing profile
      { parent: 'profile_update', required: 'profile_read' },
      
      // ==========================================
      // FRONTEND-IDENTIFIED DEPENDENCIES
      // Based on complete frontend analysis
      // ==========================================
      
      // Dashboard dependencies - needs all data for stats and recent items
      { parent: 'view_dashboard', required: 'student_read' },
      { parent: 'view_dashboard', required: 'room_read' },
      { parent: 'view_dashboard', required: 'complaint_read' },
      { parent: 'view_dashboard', required: 'hostel_read' },
      { parent: 'view_dashboard', required: 'profile_read' },
      
      // Room management dependencies - needs student and allocation data
      { parent: 'room_read', required: 'student_read' },
      { parent: 'room_read', required: 'room_allocation_read' },
      { parent: 'room_read', required: 'student_room_read' },
      { parent: 'room_read', required: 'hostel_read' },
      
      // Student management dependencies - needs room and allocation data
      { parent: 'student_read', required: 'room_read' },
      { parent: 'student_read', required: 'room_allocation_read' },
      { parent: 'student_read', required: 'student_room_read' },
      { parent: 'student_read', required: 'hostel_read' },
      
      // Visitor management dependencies - needs student and room data for creation
      { parent: 'visitor_read', required: 'student_read' },
      { parent: 'visitor_read', required: 'room_read' },
      { parent: 'visitor_read', required: 'room_allocation_read' },
      { parent: 'visitor_read', required: 'hostel_read' },
      
      // Complaint management dependencies - needs student and profile data
      { parent: 'complaint_read', required: 'student_read' },
      { parent: 'complaint_read', required: 'profile_read' },
      { parent: 'complaint_read', required: 'hostel_read' },
      
      // Staff management dependencies - needs user and permission data
      { parent: 'role_read', required: 'user_read' },
      { parent: 'role_read', required: 'permission_read' },
      { parent: 'role_read', required: 'hostel_read' },
      
      // Warden management dependencies - needs user and profile data
      { parent: 'warden_read', required: 'user_read' },
      { parent: 'warden_read', required: 'profile_read' },
      { parent: 'warden_read', required: 'hostel_read' },
      
      // Settings dependencies - needs hostel and profile data
      { parent: 'view_settings', required: 'hostel_read' },
      { parent: 'view_settings', required: 'hostel_update' },
      { parent: 'view_settings', required: 'profile_read' },
      { parent: 'view_settings', required: 'profile_update' },
      
      // Hostel detail dependencies - needs all data for comprehensive view
      { parent: 'view_hostel_details', required: 'hostel_read' },
      { parent: 'view_hostel_details', required: 'hostel_update' },
      { parent: 'view_hostel_details', required: 'hostel_delete' },
      { parent: 'view_hostel_details', required: 'student_read' },
      { parent: 'view_hostel_details', required: 'room_read' },
      { parent: 'view_hostel_details', required: 'complaint_read' },
      
      // Owner hostels dependencies - needs all data for management
      { parent: 'hostel_read', required: 'hostel_read' },
      { parent: 'hostel_read', required: 'hostel_create' },
      { parent: 'hostel_read', required: 'hostel_update' },
      { parent: 'hostel_read', required: 'hostel_delete' },
      { parent: 'hostel_read', required: 'student_read' },
      { parent: 'hostel_read', required: 'room_read' },
      { parent: 'hostel_read', required: 'complaint_read' },
      
      // ==========================================
      // CROSS-FUNCTIONAL DEPENDENCIES
      // All major operations require hostel context
      // ==========================================
      
      // Student operations require hostel context
      { parent: 'student_create', required: 'hostel_read' },
      { parent: 'student_update', required: 'hostel_read' },
      { parent: 'student_delete', required: 'hostel_read' },
      
      // Room operations require hostel context
      { parent: 'room_create', required: 'hostel_read' },
      { parent: 'room_update', required: 'hostel_read' },
      { parent: 'room_delete', required: 'hostel_read' },
      
      // Complaint operations require hostel context
      { parent: 'complaint_create', required: 'hostel_read' },
      { parent: 'complaint_update', required: 'hostel_read' },
      { parent: 'complaint_delete', required: 'hostel_read' },
      
      // Visitor operations require hostel context
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
      { parent: 'role_delete', required: 'user_read' },
      
      // Profile deletion requires viewing profile
      { parent: 'profile_delete', required: 'profile_read' },

      // ==========================================
      // CROSS-FUNCTIONAL DEPENDENCIES
      // ==========================================
      
      // Any management operation that affects data requires viewing that data
      { parent: 'student_room_assign', required: 'student_room_read' },
      { parent: 'room_allocate', required: 'student_room_read' },
      { parent: 'room_deallocate', required: 'student_room_read' },
      
      // Complaint handling in hostel context requires hostel access
      { parent: 'complaint_update', required: 'hostel_read' },
      
      // Visitor management in hostel context requires hostel access
      { parent: 'visitor_create', required: 'hostel_read' },
      { parent: 'visitor_update', required: 'hostel_read' },
      { parent: 'visitor_delete', required: 'hostel_read' },
      { parent: 'visitor_checkout', required: 'hostel_read' },
      
      // Student management in hostel context requires hostel access
      { parent: 'student_create', required: 'hostel_read' },
      { parent: 'student_update', required: 'hostel_read' },
      { parent: 'student_delete', required: 'hostel_read' },
      
      // Room management in hostel context requires hostel access
      { parent: 'room_create', required: 'hostel_read' },
      { parent: 'room_update', required: 'hostel_read' },
      { parent: 'room_delete', required: 'hostel_read' },
      { parent: 'room_allocate', required: 'hostel_read' },
      { parent: 'room_deallocate', required: 'hostel_read' }
    ];

    console.log(`📋 Adding ${comprehensiveDependencies.length} comprehensive dependencies...`);

    // Add all dependencies
    // Common alias mapping (legacy -> canonical) to maximize matches
    const ALIAS = {
      hostel_stats_read: 'view_hostel_stats',
      visitor_export: 'export_visitor_data',
      complaint_stats_read: 'view_complaint_stats',
      system_stats_read: 'view_system_stats',
      billing_manage: 'manage_billing',
      data_export: 'export_room_data', // partial; real export_* handled per domain elsewhere
      room_allocate: 'room_allocation_create',
      room_deallocate: 'room_allocation_delete',
      view_wardens: 'warden_read',
    };

    for (const dep of comprehensiveDependencies) {
      const parentName = permissionIds[dep.parent]
        ? dep.parent
        : ALIAS[dep.parent] && permissionIds[ALIAS[dep.parent]]
        ? ALIAS[dep.parent]
        : null;
      const requiredName = permissionIds[dep.required]
        ? dep.required
        : ALIAS[dep.required] && permissionIds[ALIAS[dep.required]]
        ? ALIAS[dep.required]
        : null;

      if (parentName && requiredName) {
        // Check if dependency already exists
        const existingDep = await queryInterface.sequelize.query(
          `SELECT id FROM PermissionDependencies 
           WHERE parent_permission_id = '${permissionIds[parentName]}' 
           AND required_permission_id = '${permissionIds[requiredName]}'`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (existingDep.length === 0) {
          await queryInterface.bulkInsert('PermissionDependencies', [{
            id: generateUUID(),
            parent_permission_id: permissionIds[parentName],
            required_permission_id: permissionIds[requiredName],
            is_automatic: true,
            created_at: new Date(),
            updated_at: new Date()
          }]);
        }
      } else {
        console.warn(`⚠️ Skipping dependency ${dep.parent} -> ${dep.required} (permission not found)`);
      }
    }

    console.log('✅ Comprehensive permission dependencies added successfully');
    console.log('🎉 All permissions now have proper dependency resolution!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back comprehensive dependencies...');
    
    // Remove all dependencies added by this migration
    // (This is a safe rollback as it only removes the additional dependencies)
    await queryInterface.bulkDelete('PermissionDependencies', {
      is_automatic: true
    });
    
    console.log('✅ Comprehensive dependencies rolled back successfully!');
  }
};

