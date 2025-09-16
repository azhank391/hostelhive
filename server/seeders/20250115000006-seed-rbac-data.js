"use strict";

const { v4: uuidv4 } = require("uuid");

function generateUUID() {
  return uuidv4();
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🌱 Starting RBAC data seeding with permission updates...");

    // ==========================================
    // 0. CLEAN UP EXISTING RBAC DATA
    // ==========================================
    console.log("🧹 Cleaning up existing RBAC data...");

    // Delete existing role permissions (foreign key constraint)
    await queryInterface.bulkDelete("RolePermissions", {});
    console.log("   - Deleted existing role permissions");

    // Delete existing system roles
    await queryInterface.bulkDelete("Roles", { is_system_role: true });
    console.log("   - Deleted existing system roles");

    // Delete existing system permissions
    await queryInterface.bulkDelete("Permissions", {
      is_system_permission: true,
    });
    console.log("   - Deleted existing system permissions");

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
    // 2. INSERT NEW PERMISSIONS WITH IMPROVED NAMING
    // ==========================================
    console.log("🔐 Creating system permissions with improved naming...");

    const permissions = [
      // 1. for students
      {
        name: "view_own_data",
        display_name: "View Own Data",
        description: "View own data (room, complaints, visitors)",
        category: "profile",
      },
      // for dashboard access of owners/wardens/custom roles
      {
        name: "view_hostel_stats",
        display_name: "View Dashboard for Wardens",
        description: "Access dashboard and analytics",
        category: "dashboard",
      },

      // 2. Hostel Management
      {
        name: "hostel_create",
        display_name: "Create Hostel",
        description: "Create new hostel",
        category: "hostel",
      },
      {
        name: "hostel_read",
        display_name: "View Hostel Page",
        description: "View hostel information and settings",
        category: "hostel",
      },
      {
        name: "hostel_update",
        display_name: "Update Hostel Information",
        description: "Create, update, and delete hostel information",
        category: "hostel",
      },
      {
        name: "hostel_settings_update",
        display_name: "Change Hostel Settings",
        description: "Update hostel settings, subdomain, etc.",
        category: "hostel",
      },
      {
        name: "hostel_delete",
        display_name: "Delete Hostel",
        description: "Delete existing hostel",
        category: "hostel",
      },
      // 3. Room Management
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
        display_name: "Manage Rooms",
        description: "Create, update, and delete rooms",
        category: "rooms",
      },
      {
        name: "room_delete",
        display_name: "Delete Rooms",
        description: "Delete existing rooms",
        category: "rooms",
      },
      {
        name: "room_allocation_create",
        display_name: "Allocate Rooms",
        description: "Assign rooms to students",
        category: "rooms",
      },
      {
        name: "room_allocation_read",
        display_name: "View Room Allocations",
        description: "View room allocation details",
        category: "rooms",
      },
      {
        name: "room_allocation_delete",
        display_name: "Deallocate Rooms",
        description: "Remove room assignments",
        category: "rooms",
      },
      {
        name: "export_room_data",
        display_name: "Export Room Data",
        description: "Export room information",
        category: "rooms",
      },

      // 4. Student Management
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
        display_name: "Manage Students",
        description: "Create, update, and delete student records",
        category: "students",
      },
      {
        name: "student_delete",
        display_name: "Delete Students",
        description: "Delete student records",
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
        name: "role_assign",
        display_name: "Assign Roles",
        description: "Assign roles to staff members",
        category: "staff",
      },
      {
        name: "export_staff_data",
        display_name: "Export Staff Data",
        description: "Export staff information",
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
        display_name: "View Complaint Analytics",
        description: "View complaint analytics",
        category: "complaints",
      },
      {
        name: "export_complaint_data",
        display_name: "Export Complaint Data",
        description: "Export complaint data",
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
        name: "visitor_delete",
        display_name: "Delete Visitors",
        description: "Delete visitor logs",
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
        name: "view_billing",
        display_name: "View Billing",
        description: "View billing information",
        category: "reports",
      },

      // 9. System Administration (Superadmin only)
      {
        name: "system_stats_read",
        display_name: "View System Stats",
        description: "View system-wide statistics",
        category: "system",
      },
      {
        name: "hostel_global_manage",
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
        name: "owner_manage",
        display_name: "Create Owners",
        description: "Create and manage owners",
        category: "system",
      },
      {
        name: "billing_manage",
        display_name: "Manage Billing",
        description: "Manage billing and payments",
        category: "system",
      },
      {
        name: "billing_read",
        display_name: "View Billing",
        description: "View billing information",
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
          operation: permission.operation || null,
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

    // Owner permissions - Full hostel management
    const ownerPermissions = [
      // Profile management (Dashboard access)
      // Hostel management
      "hostel_create",
      "hostel_read",
      "hostel_update",
      "hostel_delete",
      "hostel_settings_update",
      "view_hostel_stats",

      // Room management
      "room_create",
      "room_read",
      "room_update",
      "room_delete",
      "room_allocation_create",
      "room_allocation_delete",
      "room_allocation_read",

      // Student management
      "student_create",
      "student_read",
      "student_update",
      "student_delete",
      "export_student_data",

      // Staff management
      "staff_create",
      "staff_read",
      "staff_update",
      "staff_delete",
      "role_assign",

      // Complaint management
      "complaint_create",
      "complaint_read",
      "complaint_update",
      "complaint_delete",
      "view_complaint_stats",
      "export_complaint_data",

      // Visitor management
      "visitor_create",
      "visitor_read",
      "visitor_update",
      "visitor_delete",
      "export_visitor_data",

      // Reports & Analytics the section will be implemted later
      "view_billing",
    ];

    // Student permissions - Basic access only
    const studentPermissions = [
      // For their dashboard
      "view_own_data",

      // Complaints - students can create and view their own
      "complaint_create",
      "complaint_read",
      "complaint_update", // to update their own complaints
      "complaint_delete", // to delete their own complaints

      // Visitors - students can manage their visitors
      "visitor_create",
      "visitor_read",
      "visitor_update",
      "visitor_delete",
    ];

    // Warden permissions - Day-to-day hostel management
    const wardenPermissions = [
      // Hostel information (read-only)
      "view_hostel_stats",
      "hostel_read", // used for the warden dashbaord page

      // Room management
      "room_create",
      "room_read",
      "room_update",
      "room_delete",
      "room_allocation_create",
      "room_allocation_delete",
      "room_allocation_read",
      "export_room_data",

      // Student management
      "student_create",
      "student_read",
      "student_update",
      "student_delete",
      "export_student_data",

      // Complaint management
      "complaint_read",
      "complaint_update", // Can resolve complaints
      "view_complaint_stats",
      "export_complaint_data",
      "complaint_delete",

      // Visitor management
      "visitor_create",
      "visitor_read",
      "visitor_update",
      "visitor_delete",
      "export_visitor_data",
    ];

    // Superadmin gets ALL permissions
    const superadminPermissions = Object.keys(permissionIds);

    // Function to assign permissions to a role
    async function assignPermissionsToRole(roleId, permissions, roleName) {
      let assignedCount = 0;

      for (const permissionName of permissions) {
        if (permissionIds[permissionName]) {
          await queryInterface.bulkInsert("RolePermissions", [
            {
              id: generateUUID(),
              role_id: roleId,
              permission_id: permissionIds[permissionName],
              created_at: new Date(),
            },
          ]);
          assignedCount++;
        }
      }

      console.log(`✅ ${roleName}: ${assignedCount} permissions assigned`);
      return assignedCount;
    }

    // Assign permissions to each role
    const ownerCount = await assignPermissionsToRole(
      ownerRoleId,
      ownerPermissions,
      "Owner"
    );
    const studentCount = await assignPermissionsToRole(
      studentRoleId,
      studentPermissions,
      "Student"
    );
    const wardenCount = await assignPermissionsToRole(
      wardenRoleId,
      wardenPermissions,
      "Warden"
    );
    const superadminCount = await assignPermissionsToRole(
      superadminRoleId,
      superadminPermissions,
      "Superadmin"
    );

    console.log("✅ RBAC data seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(
      "   - 4 system roles created (owner, student, warden, superadmin)"
    );
    console.log(
      `   - ${permissions.length} permissions created with improved naming`
    );
    console.log(`   - Owner: ${ownerCount} permissions assigned`);
    console.log(`   - Student: ${studentCount} permissions assigned`);
    console.log(`   - Warden: ${wardenCount} permissions assigned`);
    console.log(`   - Superadmin: ${superadminCount} permissions assigned`);
  },

  async down(queryInterface, Sequelize) {
    console.log("🗑️ Removing RBAC data...");

    // Delete in reverse order due to foreign key constraints
    await queryInterface.bulkDelete("RolePermissions", {});
    await queryInterface.bulkDelete("Permissions", {
      is_system_permission: true,
    });
    await queryInterface.bulkDelete("Roles", { is_system_role: true });

    console.log("✅ RBAC data removed successfully!");
  },
};
