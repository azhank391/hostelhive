"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../lib/api-client';
import { useAuth } from './AuthContext';

/**
 * 🔐 Permission Context
 * 
 * This context provides permission-based access control for the frontend,
 * integrating with the RBAC system to manage user roles and permissions.
 * 
 * @author HostelHive RBAC System
 * @version 1.0.0
 */

// ========================================
// INTERFACES
// ========================================

interface UserRole {
  id: string;
  name: string;
  displayName: string;
  isSystemRole: boolean;
}

interface Permission {
  id: string;
  name: string;
  displayName: string;
  category: string;
}

interface PermissionContextType {
  userRole: UserRole | null;
  permissions: Permission[];
  hasPermission: (permissionName: string) => boolean;
  hasAnyPermission: (permissionNames: string[]) => boolean;
  hasAllPermissions: (permissionNames: string[]) => boolean;
  loading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  checkPermission: (permissionName: string) => Promise<boolean>;
  checkAnyPermission: (permissionNames: string[]) => Promise<boolean>;
  checkAllPermissions: (permissionNames: string[]) => Promise<boolean>;
}

interface PermissionProviderProps {
  children: ReactNode;
}

// ========================================
// CONTEXT CREATION
// ========================================

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// ========================================
// PERMISSION PROVIDER
// ========================================

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user permissions from the backend
   */
  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/rbac/user-permissions?t=${Date.now()}`);
      
      // The apiClient.get returns the parsed JSON response directly
      const resp = response as any;
      
      if (!resp) {
        throw new Error('No response received from permissions API');
      }
      
      // Check for the expected response format: {success: true, data: {role, permissions}}
      if (resp.success && resp.data && resp.data.role && resp.data.permissions) {
        setUserRole(resp.data.role);
        setPermissions(resp.data.permissions);
      } else {
        console.error('❌ Invalid response format:', resp);
        throw new Error('Invalid response format from permissions API');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch user permissions:', error);
      
      // Set a clear error message
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Insufficient permissions.');
      } else {
        setError('Failed to load user permissions. Please try again.');
      }
      
      // Reset state on error
      setUserRole(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has a specific permission (local check)
   */
  const hasPermission = (permissionName: string): boolean => {
    return permissions.some(p => p.name === permissionName);
  };

  /**
   * Check if user has any of the specified permissions (local check)
   */
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => permissions.some(p => p.name === name));
  };

  /**
   * Check if user has all of the specified permissions (local check)
   */
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(name => permissions.some(p => p.name === name));
  };

  /**
   * Check permission on the backend (for real-time validation)
   */
  const checkPermission = async (permissionName: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/rbac/check-permission', {
        permissionName
      });
      
      if ((response as any)?.data?.success) {
        const hasPermission = (response as any).data.data.hasPermission;
        return hasPermission;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Failed to check permission:', error);
      return false;
    }
  };

  /**
   * Check any permission on the backend (for real-time validation)
   */
  const checkAnyPermission = async (permissionNames: string[]): Promise<boolean> => {
    try {
      const response = await apiClient.post('/rbac/check-any-permission', {
        permissionNames
      });
      
      if ((response as any)?.data?.success) {
        const hasAnyPermission = (response as any).data.data.hasAnyPermission;
        return hasAnyPermission;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Failed to check any permission:', error);
      return false;
    }
  };

  /**
   * Check all permissions on the backend (for real-time validation)
   */
  const checkAllPermissions = async (permissionNames: string[]): Promise<boolean> => {
    try {
      const response = await apiClient.post('/rbac/check-all-permissions', {
        permissionNames
      });
      
      if ((response as any)?.data?.success) {
        const hasAllPermissions = (response as any).data.data.hasAllPermissions;
        return hasAllPermissions;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Failed to check all permissions:', error);
      return false;
    }
  };

  /**
   * Refresh permissions (re-fetch from backend)
   */
  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  /**
   * Initialize permissions when user is authenticated
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPermissions();
    } else {
      // Clear permissions when user is not authenticated
      setUserRole(null);
      setPermissions([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated, user]);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const contextValue: PermissionContextType = {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    error,
    refreshPermissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// ========================================
// CUSTOM HOOKS
// ========================================

/**
 * Hook to use permission context
 */
export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

/**
 * Hook to check a specific permission
 */
export const usePermission = (permissionName: string): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(permissionName);
};

/**
 * Hook to check any of the specified permissions
 */
export const useAnyPermission = (permissionNames: string[]): boolean => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissionNames);
};

/**
 * Hook to check all of the specified permissions
 */
export const useAllPermissions = (permissionNames: string[]): boolean => {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissionNames);
};

/**
 * Hook to get user role information
 */
export const useUserRole = (): UserRole | null => {
  const { userRole } = usePermissions();
  return userRole;
};

/**
 * Hook to get all user permissions
 */
export const useUserPermissions = (): Permission[] => {
  const { permissions } = usePermissions();
  return permissions;
};

/**
 * Hook to check if permissions are loading
 */
export const usePermissionsLoading = (): boolean => {
  const { loading } = usePermissions();
  return loading;
};

/**
 * Hook to get permission error
 */
export const usePermissionsError = (): string | null => {
  const { error } = usePermissions();
  return error;
};

// ========================================
// PERMISSION GATE COMPONENT
// ========================================

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component to conditionally render content based on permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Show loading state
  if (loading) {
    return <div>Loading permissions...</div>;
  }

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
// PERMISSION UTILITIES
// ========================================

/**
 * Utility function to get permissions by category
 */
export const getPermissionsByCategory = (permissions: Permission[]): Record<string, Permission[]> => {
  return permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
};

/**
 * Utility function to check if user has role
 */
export const hasRole = (userRole: UserRole | null, roleName: string): boolean => {
  return userRole?.name === roleName;
};

/**
 * Utility function to check if user has system role
 */
export const hasSystemRole = (userRole: UserRole | null): boolean => {
  return userRole?.isSystemRole === true;
};

/**
 * Utility function to check if user has custom role
 */
export const hasCustomRole = (userRole: UserRole | null): boolean => {
  return userRole?.isSystemRole === false;
};

// ========================================
// EXPORTS
// ========================================

export default PermissionContext;
export type { UserRole, Permission, PermissionContextType, PermissionProviderProps, PermissionGateProps };
