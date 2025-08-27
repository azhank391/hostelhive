'use client'

import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from '@/lib/permissions'

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

  if (!user) {
    return fallback
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(user.role, permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(user.role, permissions)
      : hasAnyPermission(user.role, permissions)
  } else {
    hasAccess = true
  }

  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
}

// Convenience components for common permission checks
export function ManageHostelGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate permission="manage_hostel" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function ManageStudentsGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate permission="manage_students" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function ManageRoomsGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate permission="manage_rooms" fallback={fallback}>
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
