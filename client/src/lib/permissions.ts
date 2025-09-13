// Re-export from permissionUtils for new permission system
export { type Permission, checkPermission, checkAllPermissions, checkAnyPermission } from './permissionUtils';

export type Role = 'owner' | 'warden' | 'student' | 'superadmin';

// Legacy role-based permissions (deprecated - use direct permission checking instead)
const LEGACY_ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: [
    'view_dashboard',
    'hostel_create',
    'hostel_read',
    'hostel_update',
    'hostel_stats_read',
    'student_create',
    'student_read',
    'student_update',
    'student_delete',
    'room_create',
    'room_read',
    'room_update',
    'room_delete',
    'room_allocation_create',
    'room_allocation_delete',
    'room_allocation_read',
    'warden_create',
    'warden_read',
    'warden_update',
    'warden_delete',
    'complaint_create',
    'complaint_read',
    'complaint_update',
    'complaint_delete',
    'visitor_create',
    'visitor_read',
    'visitor_update',
    'visitor_delete',
    'visitor_update',
    'role_create',
    'role_read',
    'role_update',
    'role_delete',
    'role_assign',
    'view_reports',
    'analytics_read',
    'view_settings'
  ],
  warden: [
    'hostel_stats_read',
    'student_update',
    'room_update',
    'room_allocation_read',
    'view_reports',
    'manage_complaints',
    'visitor_update',
    'complaint_read',
    'complaint_delete',
    'complaint_handle',
    'complaint_update'
  ],
  student: [
    'view_reports',
    'student_room_read',
    'complaint_create', 
    'complaint_read',
    'view_dashboard'
  ],
  superadmin: [
    'super_admin'
  ]
};

// Legacy function - use checkPermission from permissionUtils instead
export const hasPermission = (role: Role | string, permission: string): boolean => {
  if (role === 'superadmin') return true;
  return LEGACY_ROLE_PERMISSIONS[role as Role]?.includes(permission) || false;
};

// Legacy function - use checkAnyPermission from permissionUtils instead
export const hasAnyPermission = (userPermissions: string[], permissions: string[]): boolean => {
  return permissions.some(permission => userPermissions.includes(permission));
};

// Legacy function - use checkAllPermissions from permissionUtils instead  
export const hasAllPermissions = (userPermissions: string[], permissions: string[]): boolean => {
  return permissions.every(permission => userPermissions.includes(permission));
};

// Legacy function
export const getRolePermissions = (role: Role): string[] => {
  return LEGACY_ROLE_PERMISSIONS[role] || [];
};
