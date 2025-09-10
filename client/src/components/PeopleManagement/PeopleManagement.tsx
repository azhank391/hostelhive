'use client'

import React, { useState } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { StaffManagement } from '../StaffManagement';
import { 
  UsersIcon, 
  GraduationCapIcon, 
  ShieldIcon,
  EyeIcon
} from 'lucide-react';

export const PeopleManagement: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');

  const canViewStudents = hasPermission('student_read');
  const canViewStaff = hasPermission('role_read');

  if (!canViewStudents && !canViewStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to view people management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">People Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage students and staff for your hostel
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {canViewStudents && (
                <button
                  onClick={() => setActiveTab('students')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'students'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <GraduationCapIcon className="h-5 w-5 mr-2" />
                    Students
                  </div>
                </button>
              )}
              {canViewStaff && (
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'staff'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <ShieldIcon className="h-5 w-5 mr-2" />
                    Staff
                  </div>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'students' && canViewStudents && (
            <div className="p-6">
              <div className="text-center py-12">
                <GraduationCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Student Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Student management functionality will be implemented here.
                </p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Students
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && canViewStaff && (
            <div className="p-6">
              <StaffManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};






