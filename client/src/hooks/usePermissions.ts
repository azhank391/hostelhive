import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkPermission, checkAllPermissions, checkAnyPermission, Permission } from '@/lib/permissionUtils';

export const usePermissions = () => {
  const { user } = useAuth();
  const userPermissions = user?.permissions || [];

  const hasPermission = useCallback(
    (permission: Permission) => {
      return checkPermission(userPermissions, permission);
    },
    [userPermissions]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]) => {
      return checkAllPermissions(userPermissions, permissions);
    },
    [userPermissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]) => {
      return checkAnyPermission(userPermissions, permissions);
    },
    [userPermissions]
  );

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    // Expose the raw permissions for debugging
    permissions: userPermissions
  };
};

