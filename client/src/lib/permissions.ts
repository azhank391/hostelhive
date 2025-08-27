export type Permission = 
  | 'manage_hostel'
  | 'manage_students'
  | 'manage_rooms'
  | 'manage_wardens'
  | 'view_reports'
  | 'manage_complaints'
  | 'manage_visitors'
  | 'manage_billing'
  | 'super_admin';

export type Role = 'owner' | 'warden' | 'student' | 'superadmin';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'manage_hostel',
    'manage_students',
    'manage_rooms',
    'manage_wardens',
    'view_reports',
    'manage_complaints',
    'manage_visitors',
    'manage_billing'
  ],
  warden: [
    'manage_students',
    'manage_rooms',
    'view_reports',
    'manage_complaints',
    'manage_visitors'
  ],
  student: [
    'view_reports'
  ],
  superadmin: [
    'super_admin'
  ]
};

// Check if user has specific permission
export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// Check if user has any of the required permissions
export const hasAnyPermission = (userRole: Role, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Check if user has all required permissions
export const hasAllPermissions = (userRole: Role, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Get all permissions for a role
export const getRolePermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};
