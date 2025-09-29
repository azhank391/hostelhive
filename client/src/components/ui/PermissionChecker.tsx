import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../lib/permissionUtils';

interface PermissionCheckerProps {
  requiredPermission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionChecker = ({
  requiredPermission,
  children,
  fallback
}: PermissionCheckerProps) => {
  const { hasPermission } = usePermissions();
  const hasRequiredPermission = hasPermission(requiredPermission);
  
  if (hasRequiredPermission) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <div className="p-4">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>You don&apos;t have the required permission: <strong>{requiredPermission}</strong></p>
              <p className="mt-1">Please contact your administrator if you believe this is an error.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionChecker;
