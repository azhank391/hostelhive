// List of all available permissions as types
export type Permission =
  | 'hostel_create' | 'hostel_read' | 'hostel_update' | 'hostel_delete' | 'hostel_settings_update' | 'view_hostel_stats'
  | 'room_read' | 'room_create' | 'room_update' | 'room_delete'
  | 'room_allocation_read' | 'room_allocation_create' | 'room_allocation_update' | 'room_allocation_delete'
  | 'export_room_data'
  | 'student_read' | 'student_create' | 'student_update' | 'student_delete' | 'manage_student_rooms' | 'view_student_rooms' | 'export_student_data'
  | 'staff_read' | 'staff_create' | 'staff_update' | 'staff_delete' | 'role_assign' | 'export_staff_data'
  | 'visitor_read' | 'visitor_create' | 'visitor_update' | 'visitor_delete' | 'export_visitor_data'
  | 'complaint_read' | 'complaint_create' | 'complaint_update' | 'complaint_delete' | 'view_complaint_stats' | 'export_complaint_data'
  | 'view_reports' | 'view_analytics' | 'view_billing'
  | 'manage_profile' | 'view_profile' | 'change_password' | 'view_own_data'
  | 'manage_system' | 'manage_all_hostels' | 'view_system_stats' | 'manage_billing' | 'manage_owners';

export const AVAILABLE_PERMISSIONS: Permission[] = [
  'hostel_create','hostel_read','hostel_update','hostel_delete','hostel_settings_update','view_hostel_stats',
  'room_read','room_create','room_update','room_delete','room_allocation_read','room_allocation_create','room_allocation_update','room_allocation_delete','export_room_data',
  'student_read','student_create','student_update','student_delete','manage_student_rooms','view_student_rooms','export_student_data',
  'staff_read','staff_create','staff_update','staff_delete','role_assign','export_staff_data',
  'visitor_read','visitor_create','visitor_update','visitor_delete','export_visitor_data',
  'complaint_read','complaint_create','complaint_update','complaint_delete','view_complaint_stats','export_complaint_data',
  'view_reports','view_analytics','view_billing',
  'manage_profile','view_profile','change_password','view_own_data',
  'manage_system','manage_all_hostels','view_system_stats','manage_billing','manage_owners'
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
