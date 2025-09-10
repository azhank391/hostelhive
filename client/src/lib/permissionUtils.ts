// List of all available permissions as types
export type Permission = 
  | 'complaint_create'
  | 'complaint_delete'
  | 'complaint_handle'
  | 'complaint_read'
  | 'complaint_stats_read'
  | 'complaint_update'
  | 'view_dashboard'
  | 'hostel_create'
  | 'hostel_delete'
  | 'hostel_read'
  | 'hostel_settings_update'
  | 'hostel_stats_read'
  | 'hostel_update'
  | 'view_owner_hostels'
  | 'profile_create'
  | 'profile_delete'
  | 'profile_read'
  | 'profile_update'
  | 'analytics_read'
  | 'billing_read'
  | 'data_export'
  | 'report_read'
  | 'permission_manage'
  | 'role_assign'
  | 'role_create'
  | 'role_delete'
  | 'role_read'
  | 'role_update'
  | 'room_allocate'
  | 'room_create'
  | 'room_deallocate'
  | 'room_delete'
  | 'room_read'
  | 'room_update'
  | 'view_settings'
  | 'student_create'
  | 'student_delete'
  | 'student_export'
  | 'student_read'
  | 'student_room_assign'
  | 'student_update'
  | 'billing_manage'
  | 'hostel_global_manage'
  | 'owner_manage'
  | 'system_manage'
  | 'system_stats_read'
  | 'visitor_checkout'
  | 'visitor_create'
  | 'visitor_delete'
  | 'visitor_export'
  | 'visitor_read'
  | 'visitor_stats_read'
  | 'visitor_update'
  | 'warden_create'
  | 'warden_delete'
  | 'warden_read'
  | 'warden_role_assign'
  | 'warden_update'
  | 'super_admin'; // Added super_admin for the SystemAdminGate

export const AVAILABLE_PERMISSIONS: Permission[] = [
  'complaint_create',
  'complaint_delete',
  'complaint_handle',
  'complaint_read',
  'complaint_stats_read',
  'complaint_update',
  'view_dashboard',
  'hostel_create',
  'hostel_delete',
  'hostel_read',
  'hostel_settings_update',
  'hostel_stats_read',
  'hostel_update',
  'view_owner_hostels',
  'profile_create',
  'profile_delete',
  'profile_read',
  'profile_update',
  'analytics_read',
  'billing_read',
  'data_export',
  'report_read',
  'permission_manage',
  'role_assign',
  'role_create',
  'role_delete',
  'role_read',
  'role_update',
  'room_allocate',
  'room_create',
  'room_deallocate',
  'room_delete',
  'room_read',
  'room_update',
  'view_settings',
  'student_create',
  'student_delete',
  'student_export',
  'student_read',
  'student_room_assign',
  'student_update',
  'billing_manage',
  'hostel_global_manage',
  'owner_manage',
  'system_manage',
  'system_stats_read',
  'visitor_checkout',
  'visitor_create',
  'visitor_delete',
  'visitor_export',
  'visitor_read',
  'visitor_stats_read',
  'visitor_update',
  'warden_create',
  'warden_delete',
  'warden_read',
  'warden_role_assign',
  'warden_update',
  'super_admin'
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
