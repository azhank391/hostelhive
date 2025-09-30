"use strict";

/**
 * 🎯 RBAC SEED DATA MIGRATION
 *
 * Seeds the RBAC system with initial data:
 * - System roles (owner, student)
 * - Predefined permissions
 * - Role-permission mappings
 *
 * This provides the foundation for the RBAC system.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🌱 Seeding RBAC system with initial data...");

    // ==========================================
    // 1. INSERT SYSTEM ROLES
    // ==========================================
    console.log("👥 Creating system roles...");

    // Generate UUIDs manually for migration
    const crypto = require("crypto");
    const generateUUID = () => crypto.randomUUID();

    const ownerRoleId = generateUUID();
    const studentRoleId = generateUUID();
    const wardenRoleId = generateUUID();
    const superadminRoleId = generateUUID();

    await queryInterface.bulkInsert("Roles", [
      {
        id: ownerRoleId,
        name: "owner",
        display_name: "Hostel Owner",
        description:
          "Full access to hostel management and ability to create custom roles",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("Roles", [
      {
        id: studentRoleId,
        name: "student",
        display_name: "Student",
        description: "Basic permissions for students (complaints, visitors)",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("Roles", [
      {
        id: wardenRoleId,
        name: "warden",
        display_name: "Warden",
        description:
          "Hostel management permissions for wardens (rooms, students, complaints)",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("Roles", [
      {
        id: superadminRoleId,
        name: "superadmin",
        display_name: "Super Admin",
        description: "System-wide administrative access across all hostels",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log("✅ System roles created successfully");

    // ==========================================
    // 2. INSERT PERMISSIONS
    // ==========================================
    console.log("🔐 Creating system permissions...");

    const permissions = [
      // 1. Authentication & Profile Management
      {
        name: "manage_profile",
        display_name: "Manage Profile",
        description: "Update own profile information",
        category: "profile",
      },
      {
        name: "view_profile",
        display_name: "View Profile",
        description: "View own profile information",
        category: "profile",
      },
      {
        name: "change_password",
        display_name: "Change Password",
        description: "Change own password",
        category: "profile",
      },
      {
        name: "view_own_data",
        display_name: "View Own Data",
        description: "View own data (room, complaints, visitors)",
        category: "profile",
      },

      // 2. Hostel Management (Split into proper CRUD)
      {
        name: "hostel_create",
        display_name: "Create Hostel",
        description: "Create new hostel",
        category: "hostel",
      },
      {
        name: "hostel_read",
        display_name: "View Hostel",
        description: "View hostel information and settings",
        category: "hostel",
      },
      {
        name: "hostel_update",
        display_name: "Update Hostel",
        description: "Update hostel information",
        category: "hostel",
      },
      {
        name: "hostel_delete",
        display_name: "Delete Hostel",
        description: "Delete hostel",
        category: "hostel",
      },
      {
        name: "hostel_settings_update",
        display_name: "Update Hostel Settings",
        description: "Update hostel settings, subdomain, etc.",
        category: "hostel",
      },
      {
        name: "view_hostel_stats",
        display_name: "View Hostel Stats",
        description: "View hostel statistics and analytics",
        category: "hostel",
      },

      // 3. Room Management (Split into proper CRUD)
      {
        name: "room_create",
        display_name: "Create Rooms",
        description: "Create new rooms",
        category: "rooms",
      },
      {
        name: "room_read",
        display_name: "View Rooms",
        description: "View room information and availability",
        category: "rooms",
      },
      {
        name: "room_update",
        display_name: "Update Rooms",
        description: "Update room information",
        category: "rooms",
      },
      {
        name: "room_delete",
        display_name: "Delete Rooms",
        description: "Delete rooms",
        category: "rooms",
      },
      {
        name: "room_allocate",
        display_name: "Allocate Rooms",
        description: "Assign rooms to students",
        category: "rooms",
      },
      {
        name: "room_deallocate",
        display_name: "Deallocate Rooms",
        description: "Remove room assignments",
        category: "rooms",
      },
      {
        name: "room_allocation_read",
        display_name: "View Room Allocations",
        description: "View room allocation details",
        category: "rooms",
      },

      // 4. Student Management (Split into proper CRUD)
      {
        name: "student_create",
        display_name: "Create Students",
        description: "Create new student records",
        category: "students",
      },
      {
        name: "student_read",
        display_name: "View Students",
        description: "View student information and records",
        category: "students",
      },
      {
        name: "student_update",
        display_name: "Update Students",
        description: "Update student information",
        category: "students",
      },
      {
        name: "student_delete",
        display_name: "Delete Students",
        description: "Delete student records",
        category: "students",
      },
      {
        name: "manage_student_rooms",
        display_name: "Manage Student Rooms",
        description: "Assign/change student rooms",
        category: "students",
      },
      {
        name: "view_student_rooms",
        display_name: "View Student Rooms",
        description: "View student room assignments",
        category: "students",
      },
      {
        name: "export_student_data",
        display_name: "Export Student Data",
        description: "Export student information",
        category: "students",
      },

      // 5. Staff Management (Cleaned up)
      {
        name: "staff_create",
        display_name: "Create Staff",
        description: "Create new staff members",
        category: "staff",
      },
      {
        name: "staff_read",
        display_name: "View Staff",
        description: "View staff details and lists",
        category: "staff",
      },
      {
        name: "staff_update",
        display_name: "Update Staff",
        description: "Update staff information and status",
        category: "staff",
      },
      {
        name: "staff_delete",
        display_name: "Delete Staff",
        description: "Delete staff members",
        category: "staff",
      },
      {
        name: "role_assign",
        display_name: "Assign Roles",
        description: "Assign roles to staff and users",
        category: "staff",
      },

      // 6. Complaint Management (Already clean)
      {
        name: "complaint_create",
        display_name: "Create Complaints",
        description: "Create new complaints",
        category: "complaints",
      },
      {
        name: "complaint_read",
        display_name: "View Complaints",
        description: "View complaint details",
        category: "complaints",
      },
      {
        name: "complaint_update",
        display_name: "Handle Complaints",
        description: "Resolve, update complaint status",
        category: "complaints",
      },
      {
        name: "complaint_delete",
        display_name: "Delete Complaints",
        description: "Delete complaints",
        category: "complaints",
      },
      {
        name: "view_complaint_stats",
        display_name: "View Complaint Stats",
        description: "View complaint analytics",
        category: "complaints",
      },

      // 7. Visitor Management (Split update/delete)
      {
        name: "visitor_create",
        display_name: "Create Visitors",
        description: "Create visitor logs",
        category: "visitors",
      },
      {
        name: "visitor_read",
        display_name: "View Visitors",
        description: "View visitor details",
        category: "visitors",
      },
      {
        name: "visitor_update",
        display_name: "Update Visitors",
        description: "Update visitor logs",
        category: "visitors",
      },
      {
        name: "visitor_delete",
        display_name: "Delete Visitors",
        description: "Delete visitor logs",
        category: "visitors",
      },
      {
        name: "visitor_checkout",
        display_name: "Checkout Visitors",
        description: "Check out visitors",
        category: "visitors",
      },
      {
        name: "view_visitor_stats",
        display_name: "View Visitor Stats",
        description: "View visitor analytics",
        category: "visitors",
      },
      {
        name: "export_visitor_data",
        display_name: "Export Visitor Data",
        description: "Export visitor logs",
        category: "visitors",
      },

      // 8. Reports & Analytics (Cleaned up)
      {
        name: "view_reports",
        display_name: "View Reports",
        description: "View various reports",
        category: "reports",
      },
      {
        name: "view_analytics",
        display_name: "View Analytics",
        description: "View analytics dashboards",
        category: "reports",
      },
      {
        name: "view_billing",
        display_name: "View Billing",
        description: "View billing information",
        category: "reports",
      },

      // 9. System Administration (Superadmin only)
      {
        name: "manage_system",
        display_name: "Manage System",
        description: "System-wide management",
        category: "system",
      },
      {
        name: "manage_all_hostels",
        display_name: "Manage All Hostels",
        description: "Manage all hostels in system",
        category: "system",
      },
      {
        name: "view_system_stats",
        display_name: "View System Stats",
        description: "View system-wide statistics",
        category: "system",
      },
      {
        name: "manage_billing",
        display_name: "Manage Billing",
        description: "Manage billing and payments",
        category: "system",
      },
      {
        name: "manage_owners",
        display_name: "Manage Owners",
        description: "Create and manage owners",
        category: "system",
      },
    ];

    const permissionIds = {};
    for (const permission of permissions) {
      const permissionId = generateUUID();
      await queryInterface.bulkInsert("Permissions", [
        {
          id: permissionId,
          name: permission.name,
          display_name: permission.display_name,
          description: permission.description,
          category: permission.category,
          is_system_permission: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      permissionIds[permission.name] = permissionId;
    }

    console.log("✅ System permissions created successfully");

    // ==========================================
    // 3. MAP ROLES TO PERMISSIONS
    // ==========================================
    console.log("🔗 Mapping roles to permissions...");

    // Owner gets hostel-level permissions (NOT system-level)
    const ownerPermissions = [
      // Profile management
      "manage_profile",
      "view_profile",
      "change_password",
      "view_own_data",

      // Hostel management (full CRUD)
      "hostel_create",
      "hostel_read",
      "hostel_update",
      "hostel_delete",
      "hostel_settings_update",
      "view_hostel_stats",

      // Room management (full CRUD + allocations)
      "room_create",
      "room_read",
      "room_update",
      "room_delete",
      "room_allocate",
      "room_deallocate",
      "room_allocation_read",

      // Student management (full CRUD + rooms)
      "student_create",
      "student_read",
      "student_update",
      "student_delete",
      "manage_student_rooms",
      "view_student_rooms",
      "export_student_data",

      // Staff management (full CRUD + role assignment)
      "staff_create",
      "staff_read",
      "staff_update",
      "staff_delete",
      "role_assign",

      // Complaint management (full CRUD + stats)
      "complaint_create",
      "complaint_read",
      "complaint_update",
      "complaint_delete",
      "view_complaint_stats",

      // Visitor management (full CRUD + checkout + stats + export)
      "visitor_create",
      "visitor_read",
      "visitor_update",
      "visitor_delete",
      "visitor_checkout",
      "view_visitor_stats",
      "export_visitor_data",

      // Reports & Analytics (hostel-level only)
      "view_reports",
      "view_analytics",
      "view_billing",
    ];

    for (const permissionName of ownerPermissions) {
      if (permissionIds[permissionName]) {
        await queryInterface.bulkInsert("RolePermissions", [
          {
            id: generateUUID(),
            role_id: ownerRoleId,
            permission_id: permissionIds[permissionName],
            created_at: new Date(),
          },
        ]);
      }
    }

    // Student gets basic permissions
    const studentPermissions = [
      "manage_profile",
      "view_profile",
      "change_password",
      "view_own_data",
      "complaint_create",
      "complaint_read",
      "visitor_create",
      "visitor_read",
    ];

    for (const permissionName of studentPermissions) {
      await queryInterface.bulkInsert("RolePermissions", [
        {
          id: generateUUID(),
          role_id: studentRoleId,
          permission_id: permissionIds[permissionName],
          created_at: new Date(),
        },
      ]);
    }

    // Warden gets limited hostel management permissions (no create/delete)
    const wardenPermissions = [
      "manage_profile",
      "view_profile",
      "change_password",
      "view_own_data",
      "hostel_read",
      "view_hostel_stats",
      "room_read",
      "room_update",
      "room_allocate",
      "room_deallocate",
      "room_allocation_read",
      "student_read",
      "student_update",
      "manage_student_rooms",
      "view_student_rooms",
      "complaint_read",
      "complaint_update",
      "visitor_read",
      "visitor_update",
      "visitor_checkout",
      "view_reports",
      "view_analytics",
    ];

    for (const permissionName of wardenPermissions) {
      await queryInterface.bulkInsert("RolePermissions", [
        {
          id: generateUUID(),
          role_id: wardenRoleId,
          permission_id: permissionIds[permissionName],
          created_at: new Date(),
        },
      ]);
    }

    // Superadmin gets all permissions (system-wide access)
    const superadminPermissions = Object.values(permissionIds);
    for (const permissionId of superadminPermissions) {
      await queryInterface.bulkInsert("RolePermissions", [
        {
          id: generateUUID(),
          role_id: superadminRoleId,
          permission_id: permissionId,
          created_at: new Date(),
        },
      ]);
    }

    console.log("✅ Role-permission mappings created successfully");
    console.log("🎉 RBAC system seeded successfully!");
    console.log("📊 Summary:");
    console.log(
      "   - 4 system roles created (owner, student, warden, superadmin)"
    );
    console.log(
      "   - 45 permissions created across 9 categories (CRUD normalized)"
    );
    console.log(
      "   - Owner has 43 hostel-level permissions (NO system access)"
    );
    console.log(
      "   - Student has 8 basic permissions (profile, complaints, visitors)"
    );
    console.log("   - Warden has 22 limited management permissions");
    console.log("   - Superadmin has ALL 45 permissions (system-wide access)");
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Rolling back RBAC seed data...");

    // Remove role-permission mappings
    await queryInterface.bulkDelete("RolePermissions", {});

    // Remove permissions
    await queryInterface.bulkDelete("Permissions", {});

    // Remove roles
    await queryInterface.bulkDelete("Roles", {});

    console.log("✅ RBAC seed data rolled back successfully!");
  },
};
