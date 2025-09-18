/**
 * Permission-based routing utility
 * Determines the appropriate landing page based on user permissions
 */

import { AuthUser } from '@/lib/types';
import { Permission } from '@/lib/permissionUtils';

interface RouteMap {
  permission: Permission;
  path: string;
  priority: number; // Higher number = higher priority
}

// Define route mapping based on permissions (in priority order)
const PERMISSION_ROUTE_MAP: RouteMap[] = [
  // High priority routes (management roles)
  { permission: 'staff_read', path: '/staff', priority: 100 },
  { permission: 'hostel_create', path: '', priority: 90 }, // Hostel management (stays on main)
  
  // Mid priority routes (operational)
  { permission: 'student_read', path: '/students', priority: 80 },
  { permission: 'room_read', path: '/rooms', priority: 70 },
  { permission: 'complaint_read', path: '/complaints', priority: 60 },
  { permission: 'visitor_read', path: '/visitors', priority: 50 },
  { permission: 'staff_read', path: '/staff', priority: 40 },
  { permission: 'view_billing', path: '/billing', priority: 30 },
  
  // Dashboard access (lowest priority - only if explicitly granted)
  { permission: 'hostel_read', path: '', priority: 10 },
  
  // Basic access (fallback)
  { permission: 'hostel_read', path: '', priority: 1 }
];

/**
 * Determines the appropriate landing route based on user permissions
 */
export function getPermissionBasedRoute(user: AuthUser): string {
  if (!user) {
    return '/auth/login?error=no_user';
  }

  // Handle system roles first
  switch (user.role) {
    case 'superadmin':
      return '/dashboard/superadmin';
    case 'student':
      return '/dashboard/student';
    case 'warden':
      return '/dashboard/warden';
    case 'owner':
      return '/dashboard/owner/hostels';
  }

  // For custom roles, determine route based on permissions
  if (!user.permissions || user.permissions.length === 0) {
    console.warn('User has no permissions assigned:', user.email);
    return '/auth/login?error=no_permissions';
  }

  // Get user's permission names
  const userPermissions = user.permissions;

  // Find the highest priority route the user has access to
  let bestRoute: RouteMap | null = null;
  
  for (const route of PERMISSION_ROUTE_MAP) {
    if (userPermissions.includes(route.permission)) {
      if (!bestRoute || route.priority > bestRoute.priority) {
        bestRoute = route;
      }
    }
  }

  if (!bestRoute) {
    console.warn('No matching route found for user permissions:', userPermissions);
    return '/auth/login?error=insufficient_permissions';
  }

  // Build the full path
  const hostelId = user.hostelId;
  if (!hostelId) {
    console.warn('Custom role user has no hostelId assigned:', user.email);
    return '/auth/login?error=no_hostel_assigned';
  }

  const basePath = `/dashboard/hostels/${hostelId}`;
  return `${basePath}${bestRoute.path}`;
}

/**
 * Checks if user has permission to access a specific route
 */
export function canAccessRoute(user: AuthUser, requiredPermission: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  // System roles have different access patterns
  if (['superadmin', 'owner', 'warden', 'student'].includes(user.role)) {
    return true; // System roles handled separately
  }

  // Check if user has the required permission
  return user.permissions?.includes(requiredPermission) || false;
}

/**
 * Gets all accessible sidebar sections for a user
 */
export function getAccessibleSidebarSections(user: AuthUser): string[] {
  if (!user) return [];

  // System roles get predefined access
  switch (user.role) {
    case 'superadmin':
      return ['dashboard', 'hostels', 'billing', 'analytics', 'settings'];
    case 'owner':
      // Include billing explicitly so owners always see Billing section
      return ['dashboard', 'students', 'rooms', 'staff', 'complaints', 'visitors', 'billing', 'reports', 'settings'];
    case 'warden':
      return ['dashboard', 'students', 'rooms', 'complaints', 'visitors', 'settings'];
    case 'student':
      return ['dashboard', 'my-room', 'my-complaints', 'my-visitors'];
  }

  // For custom roles, determine access based on permissions
  if (!user.permissions || user.permissions.length === 0) {
    return [];
  }

  const userPermissions = user.permissions;
  const accessibleSections: string[] = [];

  // Map permissions to sidebar sections
  const permissionSectionMap: Record<string, string> = {
    'student_read': 'students',
    'room_read': 'rooms',
    'staff_read': 'staff',
    'complaint_read': 'complaints',
    'visitor_read': 'visitors',
    'view_billing': 'billing'
  };

  // Add sections based on permissions
  userPermissions.forEach((permission: string) => {
    const section = permissionSectionMap[permission];
    if (section && !accessibleSections.includes(section)) {
      accessibleSections.push(section);
    }
  });

  // Always add settings if user has any permissions
  if (accessibleSections.length > 0 && !accessibleSections.includes('settings')) {
    accessibleSections.push('settings');
  }

  return accessibleSections;
}
