"use strict";

const { v4: uuidv4 } = require("uuid");

function generateUUID() {
  return uuidv4();
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🌱 Starting RBAC data seeding...");

    // Generate UUIDs for system roles
    const ownerRoleId = generateUUID();
    const studentRoleId = generateUUID();
    const wardenRoleId = generateUUID();
    const superadminRoleId = generateUUID();

    // ==========================================
    // 1. INSERT SYSTEM ROLES
    // ==========================================
    console.log("👥 Creating system roles...");

    await queryInterface.bulkInsert("Roles", [
      {
        id: ownerRoleId,
        name: "owner",
        display_name: "Owner",
        description:
          "Full hostel management access with financial and administrative control",
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
        description:
          "Basic student access for viewing personal information and creating complaints",
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

      // 2. Hostel Management
      {
        name: "hostel_update",
        display_name: "Manage Hostel",
        description: "Create, update, and delete hostel information",
        category: "hostel",
      },
      {
        name: "hostel_read",
        display_name: "View Hostel",
        description: "View hostel information and settings",
        category: "hostel",
      },
      {
        name: "manage_hostel_settings",
        display_name: "Manage Hostel Settings",
        description: "Update hostel settings, subdomain, etc.",
        category: "hostel",
      },
      {
        name: "view_hostel_stats",
        display_name: "View Hostel Stats",
        description: "View hostel statistics and analytics",
        category: "hostel",
      },

      // 3. Room Management
      {
        name: "room_update",
        display_name: "Manage Rooms",
        description: "Create, update, and delete rooms",
        category: "rooms",
      },
      {
        name: "room_read",
        display_name: "View Rooms",
        description: "View room information and availability",
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

      // 4. Student Management
      {
        name: "student_update",
        display_name: "Manage Students",
        description: "Create, update, and delete student records",
        category: "students",
      },
      {
        name: "student_read",
        display_name: "View Students",
        description: "View student information and records",
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

      // 5. Staff Management
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
        description: "Update staff information",
        category: "staff",
      },
      {
        name: "staff_delete",
        display_name: "Delete Staff",
        description: "Delete staff members",
        category: "staff",
      },
      {
        name: "staff_status_toggle",
        display_name: "Toggle Staff Status",
        description: "Activate/deactivate staff members",
        category: "staff",
      },
      {
        name: "staff_assign",
        display_name: "Assign Staff",
        description: "Assign staff members to roles and hostels",
        category: "staff",
      },

      // 6. Complaint Management
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

      // 7. Visitor Management
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
        display_name: "Manage Visitors",
        description: "Update, delete visitor logs",
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

      // 8. Reports & Analytics
      {
        name: "view_reports",
        display_name: "View Reports",
        description: "View various reports",
        category: "reports",
      },
      {
        name: "export_data",
        display_name: "Export Data",
        description: "Export data in various formats",
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

      // Hostel management
      "hostel_update",
      "hostel_read",
      "manage_hostel_settings",
      "view_hostel_stats",

      // Room management
      "room_update",
      "room_read",
      "room_allocate",
      "room_deallocate",
      "room_allocation_read",

      // Student management
      "student_update",
      "student_read",
      "manage_student_rooms",
      "view_student_rooms",
      "export_student_data",

      // Staff management
      "staff_create",
      "staff_read",
      "staff_update",
      "staff_delete",
      "staff_status_toggle",
      "staff_assign",

      // Complaint management
      "complaint_create",
      "complaint_read",
      "complaint_update",
      "complaint_delete",
      "view_complaint_stats",

      // Visitor management
      "visitor_create",
      "visitor_read",
      "visitor_update",
      "visitor_checkout",
      "view_visitor_stats",
      "export_visitor_data",

      // Reports & Analytics (hostel-level only)
      "view_reports",
      "export_data",
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
      if (permissionIds[permissionName]) {
        await queryInterface.bulkInsert("RolePermissions", [
          {
            id: generateUUID(),
            role_id: studentRoleId,
            permission_id: permissionIds[permissionName],
            created_at: new Date(),
          },
        ]);
      }
    }

    // Warden gets hostel management permissions
    const wardenPermissions = [
      "manage_profile",
      "view_profile",
      "change_password",
      "view_own_data",
      "hostel_read",
      "view_hostel_stats",
      "room_update",
      "room_read",
      "room_allocate",
      "room_deallocate",
      "room_allocation_read",
      "student_update",
      "student_read",
      "manage_student_rooms",
      "view_student_rooms",
      "complaint_create",
      "complaint_read",
      "complaint_update",
      "visitor_create",
      "visitor_read",
      "visitor_update",
      "visitor_checkout",
      "view_visitor_stats",
      "view_reports",
    ];

    for (const permissionName of wardenPermissions) {
      if (permissionIds[permissionName]) {
        await queryInterface.bulkInsert("RolePermissions", [
          {
            id: generateUUID(),
            role_id: wardenRoleId,
            permission_id: permissionIds[permissionName],
            created_at: new Date(),
          },
        ]);
      }
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

    console.log("✅ RBAC data seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(
      "   - 4 system roles created (owner, student, warden, superadmin)"
    );
    console.log(`   - ${permissions.length} permissions created`);
    console.log(
      `   - Owner has ${ownerPermissions.length} permissions (hostel-level only)`
    );
    console.log(
      `   - Student has ${studentPermissions.length} permissions (basic access)`
    );
    console.log(
      `   - Warden has ${wardenPermissions.length} permissions (hostel management)`
    );
    console.log(
      `   - Superadmin has ${permissions.length} permissions (system-wide access)`
    );
  },

  async down(queryInterface, Sequelize) {
    console.log("🗑️ Removing RBAC data...");

    await queryInterface.bulkDelete("RolePermissions", {});
    await queryInterface.bulkDelete("Permissions", {
      is_system_permission: true,
    });
    await queryInterface.bulkDelete("Roles", { is_system_role: true });

    console.log("✅ RBAC data removed successfully!");
  },
};
