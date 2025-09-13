/**
 * 🎯 PERMISSION DEFINITIONS AND DEPENDENCIES
 * Defines the permission hierarchy and dependencies for the system
 */

// Canonical permission definitions (aligned 2025-09-13)
const PERMISSION_DEFINITIONS = {
  // Hostel
  hostel_read: { displayName: 'Read Hostel', dependencies: [], category: 'hostel' },
  hostel_create: { displayName: 'Create Hostel', dependencies: [], category: 'hostel', isHighPrivilege: true },
  hostel_update: { displayName: 'Update Hostel', dependencies: ['hostel_read'], category: 'hostel' },
  hostel_delete: { displayName: 'Delete Hostel', dependencies: ['hostel_read'], category: 'hostel', isHighPrivilege: true },
  hostel_settings_update: { displayName: 'Update Hostel Settings', dependencies: ['hostel_read'], category: 'hostel', isHighPrivilege: true },
  view_hostel_stats: { displayName: 'View Hostel Stats', dependencies: ['hostel_read'], category: 'hostel' },

  // Rooms
  room_read: { displayName: 'View Rooms', dependencies: ['hostel_read'], category: 'rooms' },
  room_create: { displayName: 'Create Rooms', dependencies: ['room_read'], category: 'rooms' },
  room_update: { displayName: 'Update Rooms', dependencies: ['room_read'], category: 'rooms' },
  room_delete: { displayName: 'Delete Rooms', dependencies: ['room_read'], category: 'rooms', isHighPrivilege: true },
  room_allocation_read: { displayName: 'View Room Allocations', dependencies: ['room_read'], category: 'rooms' },
  room_allocation_create: { displayName: 'Allocate Rooms', dependencies: ['room_read','room_allocation_read'], category: 'rooms' },
  room_allocation_update: { displayName: 'Update Room Allocation', dependencies: ['room_allocation_read'], category: 'rooms' },
  room_allocation_delete: { displayName: 'Deallocate Rooms', dependencies: ['room_allocation_read'], category: 'rooms', isHighPrivilege: true },
  export_room_data: { displayName: 'Export Room Data', dependencies: ['room_read'], category: 'rooms', isHighPrivilege: true },

  // Students
  student_read: { displayName: 'View Students', dependencies: ['hostel_read'], category: 'students' },
  student_create: { displayName: 'Create Students', dependencies: ['student_read'], category: 'students' },
  student_update: { displayName: 'Update Students', dependencies: ['student_read'], category: 'students' },
  student_delete: { displayName: 'Delete Students', dependencies: ['student_read'], category: 'students', isHighPrivilege: true },
  manage_student_rooms: { displayName: 'Manage Student Rooms', dependencies: ['student_read','room_read'], category: 'students' },
  view_student_rooms: { displayName: 'View Student Rooms', dependencies: ['student_read'], category: 'students' },
  export_student_data: { displayName: 'Export Student Data', dependencies: ['student_read'], category: 'students', isHighPrivilege: true },

  // Staff
  staff_read: { displayName: 'View Staff', dependencies: ['hostel_read'], category: 'staff' },
  staff_create: { displayName: 'Create Staff', dependencies: ['staff_read'], category: 'staff' },
  staff_update: { displayName: 'Update Staff', dependencies: ['staff_read'], category: 'staff' },
  staff_delete: { displayName: 'Delete Staff', dependencies: ['staff_read'], category: 'staff', isHighPrivilege: true },
  role_assign: { displayName: 'Assign Roles', dependencies: ['staff_read'], category: 'staff' },
  export_staff_data: { displayName: 'Export Staff Data', dependencies: ['staff_read'], category: 'staff', isHighPrivilege: true },

  // Visitors
  visitor_read: { displayName: 'View Visitors', dependencies: ['hostel_read'], category: 'visitors' },
  visitor_create: { displayName: 'Create Visitor Logs', dependencies: ['visitor_read'], category: 'visitors' },
  visitor_update: { displayName: 'Update Visitor Logs', dependencies: ['visitor_read'], category: 'visitors' },
  visitor_delete: { displayName: 'Delete Visitor Logs', dependencies: ['visitor_read'], category: 'visitors', isHighPrivilege: true },
  export_visitor_data: { displayName: 'Export Visitor Logs', dependencies: ['visitor_read'], category: 'visitors', isHighPrivilege: true },

  // Complaints
  complaint_read: { displayName: 'View Complaints', dependencies: ['hostel_read'], category: 'complaints' },
  complaint_create: { displayName: 'Create Complaints', dependencies: ['complaint_read'], category: 'complaints' },
  complaint_update: { displayName: 'Update Complaints', dependencies: ['complaint_read'], category: 'complaints' },
  complaint_delete: { displayName: 'Delete Complaints', dependencies: ['complaint_read'], category: 'complaints', isHighPrivilege: true },
  view_complaint_stats: { displayName: 'View Complaint Stats', dependencies: ['complaint_read'], category: 'complaints' },
  export_complaint_data: { displayName: 'Export Complaint Data', dependencies: ['complaint_read'], category: 'complaints', isHighPrivilege: true },

  // Reporting / Analytics
  view_reports: { displayName: 'View Reports', dependencies: ['hostel_read'], category: 'reports' },
  view_analytics: { displayName: 'View Analytics', dependencies: ['view_reports'], category: 'reports' },
  view_billing: { displayName: 'View Billing', dependencies: ['view_reports'], category: 'reports' },

  // Profile / Self-service
  manage_profile: { displayName: 'Manage Profile', dependencies: [], category: 'profile' },
  view_profile: { displayName: 'View Profile', dependencies: [], category: 'profile' },
  change_password: { displayName: 'Change Password', dependencies: [], category: 'profile' },
  view_own_data: { displayName: 'View Own Data', dependencies: [], category: 'profile' },

  // System (Superadmin only)
  manage_system: { displayName: 'Manage System', dependencies: [], category: 'system', isHighPrivilege: true },
  manage_all_hostels: { displayName: 'Manage All Hostels', dependencies: ['manage_system'], category: 'system', isHighPrivilege: true },
  view_system_stats: { displayName: 'View System Stats', dependencies: ['manage_system'], category: 'system' },
  manage_billing: { displayName: 'Manage Billing', dependencies: ['manage_system'], category: 'system', isHighPrivilege: true },
  manage_owners: { displayName: 'Manage Owners', dependencies: ['manage_system'], category: 'system', isHighPrivilege: true },
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
