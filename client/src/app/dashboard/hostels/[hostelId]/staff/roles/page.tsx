'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useCurrentHostelId } from '@/lib/context-aware-api';
import { StaffManagement } from '@/components/StaffManagement/StaffManagement';

export default function CustomRolesPage() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || '';
  const { user, isLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { hasHostel } = useCurrentHostelId();

  // Permission checks for role management
  const canViewRoles = hasPermission('role_read');
  const canCreateRoles = hasPermission('role_create');
  const canUpdateRoles = hasPermission('role_update');
  const canDeleteRoles = hasPermission('role_delete');
  const canAssignRoles = hasPermission('role_assign');
  const canManagePermissions = hasPermission('permission_manage');
  
  // Can manage roles if they have the core role management permissions
  const canManageRoles = canCreateRoles && canUpdateRoles && canDeleteRoles;

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have manage permission, show access denied
  if (!canManageRoles) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-500">You don't have permission to manage custom roles.</p>
        </div>
      </div>
    );
  }

  // If no hostel is selected, show error
  if (!hasHostel || !hostelId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Hostel Selected</h3>
          <p className="text-sm text-gray-500">Please select a hostel to manage custom roles.</p>
        </div>
      </div>
    );
  }

  return <StaffManagement />;
}






