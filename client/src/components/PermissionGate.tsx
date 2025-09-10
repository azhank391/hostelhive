"use strict";

import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, AVAILABLE_PERMISSIONS } from '@/lib/permissionUtils';

/**
 * 🔐 Permission Gate Component
 * 
 * A reusable component for conditionally rendering content based on user permissions.
 * This component uses JWT permissions directly from the AuthContext for better performance
 * and real-time permission checking.
 * 
 * @author HostelHive RBAC System
 * @version 2.0.0
 */

// ========================================
// INTERFACES
// ========================================

interface PermissionGateProps {
  /** Single permission to check */
  permission?: Permission;
  /** Multiple permissions to check */
  permissions?: Permission[];
  /** If true, user must have ALL permissions. If false, user needs ANY permission */
  requireAll?: boolean;
  /** Content to show when user doesn't have permission */
  fallback?: ReactNode;
  /** Content to show when user has permission */
  children: ReactNode;
  /** Show loading state while auth is being checked */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
}

// ========================================
// PERMISSION GATE COMPONENT
// ========================================

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
  showLoading = true,
  loadingComponent = <div className="text-gray-500">Loading permissions...</div>,
}) => {
  const { user, isLoading } = useAuth();

  // Show loading state while auth is being verified
  if (showLoading && isLoading) {
    return <>{loadingComponent}</>;
  }

  // If no user, deny access
  if (!user) {
    return <>{fallback}</>;
  }

  // Use the permissions hook for consistent permission checking
  const { hasPermission: checkPermission, hasAnyPermission: checkAnyPermission, hasAllPermissions: checkAllPermissions } = usePermissions();

  // Permission checking helper functions (for backward compatibility)
  const hasPermission = (permissionName: Permission): boolean => {
    return checkPermission(permissionName);
  };

  const hasAnyPermission = (permissionNames: Permission[]): boolean => {
    return checkAnyPermission(permissionNames);
  };

  const hasAllPermissions = (permissionNames: Permission[]): boolean => {
    return checkAllPermissions(permissionNames);
  };

  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Check multiple permissions
  else if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }
  // No permission specified, allow access
  else {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// ========================================
// SPECIALIZED PERMISSION GATES
// ========================================

/**
 * Gate for hostel management permissions
 */
export const HostelManagementGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['hostel_update', 'hostel_read', 'hostel_settings_update', 'hostel_stats_read']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for student management permissions
 */
export const StudentManagementGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['student_update', 'student_read', 'student_room_assign', 'room_read']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for room management permissions
 */
export const RoomManagementGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['room_update', 'room_read', 'room_allocate', 'room_deallocate']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for complaint management permissions
 */
export const ComplaintManagementGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['complaint_create', 'complaint_read', 'complaint_update', 'complaint_delete']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for visitor management permissions
 */
export const VisitorManagementGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['visitor_create', 'visitor_read', 'visitor_update', 'visitor_checkout']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for warden management permissions
 */
export const WardenManagementGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['warden_update', 'warden_read', 'warden_role_assign']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for role management permissions
 */
export const RoleManagementGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['role_update', 'role_read', 'role_assign']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for system administration permissions
 */
export const SystemAdminGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permission="super_admin"
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for owner permissions
 */
export const OwnerGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permission="hostel_update"
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate for basic user permissions (students, etc.)
 */
export const BasicUserGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGate
    permissions={['profile_read', 'view_dashboard', 'complaint_create', 'complaint_read', 'visitor_create', 'visitor_read']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

// ========================================
// ROLE-BASED GATES
// ========================================

/**
 * Gate for specific user roles
 */
interface RoleGateProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ roles, children, fallback = null }) => {
  const { user } = useAuth();
  
  const hasRole = user?.role && roles.includes(user.role);
  
  return hasRole ? <>{children}</> : <>{fallback}</>;
};

/**
 * Gate for owner role
 */
export const OwnerRoleGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGate roles={['owner']} fallback={fallback}>
    {children}
  </RoleGate>
);

/**
 * Gate for warden role
 */
export const WardenRoleGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGate roles={['warden']} fallback={fallback}>
    {children}
  </RoleGate>
);

/**
 * Gate for student role
 */
export const StudentRoleGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGate roles={['student']} fallback={fallback}>
    {children}
  </RoleGate>
);

/**
 * Gate for superadmin role
 */
export const SuperadminRoleGate: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGate roles={['superadmin']} fallback={fallback}>
    {children}
  </RoleGate>
);

// ========================================
// EXPORTS
// ========================================

export default PermissionGate;
export type { PermissionGateProps, RoleGateProps };







