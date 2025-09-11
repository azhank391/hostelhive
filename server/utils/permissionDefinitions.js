/**
 * 🎯 PERMISSION DEFINITIONS AND DEPENDENCIES
 * Defines the permission hierarchy and dependencies for the system
 */

const PERMISSION_DEFINITIONS = {
  // Basic Access - Required for all roles
  hostel_read: {
    displayName: "Basic Hostel Access",
    dependencies: [],
    category: "basic",
  },

  // Student Management
  student_read: {
    displayName: "View Students",
    dependencies: ["hostel_read"],
    category: "student",
  },
  student_create: {
    displayName: "Create Students",
    dependencies: ["student_read"],
    category: "student",
  },
  student_update: {
    displayName: "Update Students",
    dependencies: ["student_read"],
    category: "student",
  },
  student_delete: {
    displayName: "Delete Students",
    dependencies: ["student_read"],
    category: "student",
    isHighPrivilege: true,
    warning: "Allows permanent removal of student records. Use with caution.",
  },

  // Room Management
  room_read: {
    displayName: "View Rooms",
    dependencies: ["hostel_read"],
    category: "room",
  },
  room_allocate: {
    displayName: "Allocate Rooms",
    dependencies: ["room_read", "student_read"],
    category: "room",
  },
  room_deallocate: {
    displayName: "Deallocate Rooms",
    dependencies: ["room_read", "student_read"],
    category: "room",
  },
  room_update: {
    displayName: "Update Rooms",
    dependencies: ["room_read"],
    category: "room",
  },
  room_delete: {
    displayName: "Delete Rooms",
    dependencies: ["room_read"],
    category: "room",
    isHighPrivilege: true,
    warning: "Allows permanent deletion of room records. Cannot be undone.",
  },

  // Visitor Management
  visitor_read: {
    displayName: "View Visitors",
    dependencies: ["hostel_read"],
    category: "visitor",
  },
  visitor_create: {
    displayName: "Create Visitor Entries",
    dependencies: ["visitor_read"],
    category: "visitor",
  },
  visitor_checkout: {
    displayName: "Checkout Visitors",
    dependencies: ["visitor_read"],
    category: "visitor",
  },
  visitor_delete: {
    displayName: "Delete Visitor Records",
    dependencies: ["visitor_read"],
    category: "visitor",
    isHighPrivilege: true,
    warning: "Allows deletion of visitor records from the system.",
  },

  // Complaint Management
  complaint_read: {
    displayName: "View Complaints",
    dependencies: ["hostel_read"],
    category: "complaint",
  },
  complaint_update: {
    displayName: "Update Complaints",
    dependencies: ["complaint_read"],
    category: "complaint",
  },
  complaint_resolve: {
    displayName: "Resolve Complaints",
    dependencies: ["complaint_read"],
    category: "complaint",
  },
  complaint_delete: {
    displayName: "Delete Complaints",
    dependencies: ["complaint_read"],
    category: "complaint",
    isHighPrivilege: true,
    warning: "Allows permanent removal of complaint records.",
  },

  // Staff/Role Management
  role_read: {
    displayName: "View Staff & Roles",
    dependencies: ["hostel_read"],
    category: "staff",
  },
  role_assign: {
    displayName: "Assign Roles",
    dependencies: ["role_read"],
    category: "staff",
  },
  role_update: {
    displayName: "Update Roles",
    dependencies: ["role_read"],
    category: "staff",
  },
  role_delete: {
    displayName: "Delete Roles",
    dependencies: ["role_read"],
    category: "staff",
    isHighPrivilege: true,
    warning:
      "Allows deletion of custom roles. Affects all staff with this role.",
  },

  // Reports & Analytics
  report_read: {
    displayName: "View Basic Reports",
    dependencies: ["hostel_read"],
    category: "reports",
  },
  hostel_stats_read: {
    displayName: "View Hostel Statistics",
    dependencies: ["report_read"],
    category: "reports",
  },
  data_export: {
    displayName: "Export Data",
    dependencies: ["report_read"],
    category: "reports",
    isHighPrivilege: true,
    warning: "Allows bulk export of hostel data.",
  },
};

module.exports = {
  PERMISSION_DEFINITIONS,
  getPermissionDefinition: (permissionName) =>
    PERMISSION_DEFINITIONS[permissionName] || null,
  getPermissionsByCategory: (category) =>
    Object.entries(PERMISSION_DEFINITIONS)
      .filter(([_, def]) => def.category === category)
      .map(([name]) => name),
  getHighPrivilegePermissions: () =>
    Object.entries(PERMISSION_DEFINITIONS)
      .filter(([_, def]) => def.isHighPrivilege)
      .map(([name]) => name),
};
