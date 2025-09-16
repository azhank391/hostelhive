// List of all available permissions as types
export type Permission =
  // 🏠 Hostel
  | 'hostel_create' | 'hostel_read' | 'hostel_update' | 'hostel_delete'
  | 'hostel_settings_update' | 'view_hostel_stats'

  // 🛏️ Room
  | 'room_read' | 'room_create' | 'room_update' | 'room_delete'
  | 'room_allocation_read' | 'room_allocation_create' | 'room_allocation_delete'
  | 'export_room_data'

  // 🎓 Student
  | 'student_read' | 'student_create' | 'student_update' | 'student_delete'
  | 'export_student_data'

  // 👨‍💼 Staff/Warden
  | 'staff_read' | 'staff_create' | 'staff_update' | 'staff_delete'
  | 'warden_read' | 'warden_create' | 'warden_update' | 'warden_delete'
  | 'role_assign' | 'export_staff_data'

  // 👥 Visitor
  | 'visitor_read' | 'visitor_create' | 'visitor_update' | 'visitor_delete'
  | 'export_visitor_data'

  // 📢 Complaint
  | 'complaint_read' | 'complaint_create' | 'complaint_update'
  |  'complaint_delete'
  | 'export_complaint_data' | 'view_complaint_stats'

  // 📊 Reports & Analytics
  | 'view_reports' | 'view_analytics'

  // 💳 Billing (superadmin)
  | 'view_billing' | 'billing_read' | 'billing_manage'

  // 👤 User self-management
  | 'manage_profile' | 'view_profile' | 'change_password' | 'view_own_data'

  // ⚙️ System / Superadmin
  | 'manage_system' | 'manage_all_hostels'
  | 'view_system_stats' | 'system_stats_read'
  | 'manage_owners' | 'owner_manage'
  | 'hostel_global_manage' | 'view_dashboard_owner';

export const AVAILABLE_PERMISSIONS: Permission[] = [
  // 🏠 Hostel
  'hostel_create','hostel_read','hostel_update','hostel_delete',
  'hostel_settings_update','view_hostel_stats',

  // 🛏️ Room
  'room_read','room_create','room_update','room_delete',
  'room_allocation_read','room_allocation_create','room_allocation_delete',
  'export_room_data',

  // 🎓 Student
  'student_read','student_create','student_update','student_delete',
  'export_student_data',

  // 👨‍💼 Staff/Warden
  'staff_read','staff_create','staff_update','staff_delete',
  'warden_read','warden_create','warden_update','warden_delete',
  'role_assign','export_staff_data',

  // 👥 Visitor
  'visitor_read','visitor_create','visitor_update','visitor_delete',
  'export_visitor_data',

  // 📢 Complaint
  'complaint_read','complaint_create','complaint_update',
  'complaint_delete',
  'export_complaint_data'

  // // 📊 Reports & Analytics
  // 'view_reports','view_analytics',

  // 💳 Billing
  ,'view_billing','billing_read','billing_manage',

  // 👤 User (student dashboard permissions)
  'view_own_data',

  // ⚙️ System
  'manage_system','manage_all_hostels',
  'view_system_stats','system_stats_read',
  'manage_owners','owner_manage',
  'hostel_global_manage','view_dashboard_owner'
];

export interface UserPermissions {
  permissions: Permission[];
}

export const checkPermission = (userPermissions: string[] | undefined, permission: Permission): boolean => {
  if (!userPermissions) return false;
  return userPermissions.includes(permission); 
};

export const checkAnyPermission = (userPermissions: string[] | undefined, permissions: Permission[]): boolean => {
  if (!userPermissions) return false;
  return permissions.some(p => userPermissions.includes(p));
};

export const checkAllPermissions = (userPermissions: string[] | undefined, permissions: Permission[]): boolean => {
  if (!userPermissions) return false;
  return permissions.every(p => userPermissions.includes(p));
};
