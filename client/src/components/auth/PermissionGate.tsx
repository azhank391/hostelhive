'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissionUtils'

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  children, 
  permission,
  permissions = [],
  requireAll = false,
  fallback = null 
}: PermissionGateProps) {
  const { user } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  if (!user) {
    return fallback
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    hasAccess = true
  }  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
}

// Convenience components for common permission checks
export function ManageHostelGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate permission="hostel_update" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function ManageStudentsGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate permission="student_update" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}


export function ManageRoomsGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate permission="room_update" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function ViewReportsGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate permission="view_reports" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}
