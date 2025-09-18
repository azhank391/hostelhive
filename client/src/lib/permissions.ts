// Re-export from permissionUtils for new permission system
export { type Permission, checkPermission, checkAllPermissions, checkAnyPermission } from './permissionUtils';

export type Role = 'owner' | 'warden' | 'student' | 'superadmin';

// Legacy role-based permissions (deprecated - use direct permission checking instead)
const LEGACY_ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: [
    'hostel_create',
    'hostel_read',
    'hostel_update',
    'view_hostel_stats',
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
    'staff_create',
    'staff_read',
    'staff_update',
    'staff_delete',
    'role_assign',
    'view_billing'
  ],
  warden: [
    'view_hostel_stats',
    'student_update',
    'student_read',
    'student_delete',
    'student_create',
    'room_create',
    'room_read',
    'room_delete',
    'room_update',
    'room_allocation_read',
    'room_allocation_create',
    'room_allocation_delete',
    'visitor_update',
    'visitor_create',
    'visitor_read',
    'visitor_delete',

    'complaint_read',
    'complaint_delete',
    'complaint_update',

  ],
  student: [
    'complaint_delete',
    'complaint_update',
    'complaint_read',
    'complaint_create',
    'view_own_data',
    'visitor_create',
    'visitor_read',
    'visitor_update',
    'visitor_delete'
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
