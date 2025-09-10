'use client'

import React from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { ShieldIcon, LoaderIcon } from 'lucide-react';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires ALL permissions (for multiple permission checks)
  permissions?: string[]; // Alternative to single permission for multiple checks
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  permission,
  children,
  fallback,
  loadingFallback,
  requireAll = false,
  permissions
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } = usePermissions();
  
  // Show loading state
  if (loading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoaderIcon className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-lg font-medium text-gray-900">Loading permissions...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }
  
  // Determine which permissions to check
  const permissionsToCheck = permissions || [permission];
  
  // Check permissions based on requirements
  let hasAccess = false;
  if (requireAll) {
    hasAccess = hasAllPermissions(permissionsToCheck);
  } else {
    hasAccess = hasAnyPermission(permissionsToCheck);
  }
  
  // Show fallback if no access
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <ShieldIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-4">
              Required permission{permissionsToCheck.length > 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {permissionsToCheck.map((perm, index) => (
                <div key={index} className="inline-block">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {perm}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render children if access is granted
  return <>{children}</>;
};

// Convenience components for common use cases
export const OwnerRoute: React.FC<Omit<PermissionRouteProps, 'permission'>> = (props) => (
  <PermissionRoute permission="hostel_update" {...props} />
);

export const WardenRoute: React.FC<Omit<PermissionRouteProps, 'permission'>> = (props) => (
  <PermissionRoute permission="complaint_update" {...props} />
);

export const StudentRoute: React.FC<Omit<PermissionRouteProps, 'permission'>> = (props) => (
  <PermissionRoute permission="view_own_profile" {...props} />
);

export const SuperadminRoute: React.FC<Omit<PermissionRouteProps, 'permission'>> = (props) => (
  <PermissionRoute permission="manage_system" {...props} />
);

// Multiple permission route component
export const MultiPermissionRoute: React.FC<Omit<PermissionRouteProps, 'permission'>> = ({
  permissions,
  requireAll = false,
  ...props
}) => {
  if (!permissions || permissions.length === 0) {
    throw new Error('MultiPermissionRoute requires at least one permission');
  }
  
  return (
    <PermissionRoute
      permission={permissions[0]} // Fallback for single permission
      permissions={permissions}
      requireAll={requireAll}
      {...props}
    />
  );
};

// Route protection hook for programmatic access
export const useRoutePermission = (permission: string) => {
  const { hasPermission, loading } = usePermissions();
  
  return {
    hasAccess: hasPermission(permission),
    loading,
    canAccess: !loading && hasPermission(permission)
  };
};

// Multiple permission hook
export const useMultiRoutePermission = (permissions: string[], requireAll = false) => {
  const { hasAllPermissions, hasAnyPermission, loading } = usePermissions();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);
  
  return {
    hasAccess,
    loading,
    canAccess: !loading && hasAccess
  };
};







