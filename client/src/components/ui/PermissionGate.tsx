'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkPermission, checkAllPermissions, checkAnyPermission, Permission } from '@/lib/permissionUtils';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
}) => {
  const { user } = useAuth();
  const userPermissions = user?.permissions;

  if (permission && !checkPermission(userPermissions, permission)) {
    return <>{fallback}</>;
  }

  if (permissions.length) {
    if (requireAll && !checkAllPermissions(userPermissions, permissions)) {
      return <>{fallback}</>;
    }
    if (!requireAll && !checkAnyPermission(userPermissions, permissions)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
