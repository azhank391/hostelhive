'use client'

import React from 'react';
import { PermissionRoute, OwnerRoute, WardenRoute, StudentRoute, SuperadminRoute, MultiPermissionRoute } from './PermissionRoute';

// Example components (these would be your actual page components)
const Dashboard = () => <div>Dashboard Content</div>;
const RoomManagement = () => <div>Room Management Content</div>;
const StudentManagement = () => <div>Student Management Content</div>;
const ComplaintManagement = () => <div>Complaint Management Content</div>;
const RoleManagement = () => <div>Role Management Content</div>;
const BillingManagement = () => <div>Billing Management Content</div>;
const ReportsPage = () => <div>Reports Content</div>;
const VisitorManagement = () => <div>Visitor Management Content</div>;
const SettingsPage = () => <div>Settings Content</div>;
const SuperadminDashboard = () => <div>Superadmin Dashboard Content</div>;

// Example usage with Next.js App Router
export const AppRoutes = () => {
  return (
    <div className="space-y-8">
      {/* Basic permission route */}
      <PermissionRoute permission="room_read">
        <RoomManagement />
      </PermissionRoute>

      {/* Permission route with custom fallback */}
      <PermissionRoute 
        permission="student_read"
        fallback={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Access Required</h2>
            <p className="text-gray-600">Contact your administrator to get access to student management.</p>
          </div>
        }
      >
        <StudentManagement />
      </PermissionRoute>

      {/* Permission route with custom loading fallback */}
      <PermissionRoute 
        permission="complaint_update"
        loadingFallback={
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Checking complaint access...</p>
          </div>
        }
      >
        <ComplaintManagement />
      </PermissionRoute>

      {/* Multiple permissions (any one required) */}
      <MultiPermissionRoute 
        permissions={["role_update", "role_read"]}
        requireAll={false}
      >
        <RoleManagement />
      </MultiPermissionRoute>

      {/* Multiple permissions (all required) */}
      <MultiPermissionRoute 
        permissions={["view_billing", "manage_billing"]}
        requireAll={true}
        fallback={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Full Billing Access Required</h2>
            <p className="text-gray-600">You need both view and manage permissions for billing.</p>
          </div>
        }
      >
        <BillingManagement />
      </MultiPermissionRoute>

      {/* Convenience components */}
      <OwnerRoute>
        <div>
          <h2 className="text-xl font-semibold mb-4">Owner Only Content</h2>
          <p>This content is only visible to hostel owners.</p>
        </div>
      </OwnerRoute>

      <WardenRoute>
        <div>
          <h2 className="text-xl font-semibold mb-4">Warden Content</h2>
          <p>This content is visible to wardens and above.</p>
        </div>
      </WardenRoute>

      <StudentRoute>
        <div>
          <h2 className="text-xl font-semibold mb-4">Student Content</h2>
          <p>This content is visible to all students.</p>
        </div>
      </StudentRoute>

      <SuperadminRoute>
        <SuperadminDashboard />
      </SuperadminRoute>
    </div>
  );
};

// Example usage in page components
export const ExamplePage = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Example Page</h1>
      
      {/* Dashboard - accessible to all authenticated users */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dashboard</h2>
        <Dashboard />
      </section>

      {/* Room Management - requires view_rooms permission */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Room Management</h2>
        <PermissionRoute permission="room_read">
          <RoomManagement />
        </PermissionRoute>
      </section>

      {/* Student Management - requires view_students permission */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Student Management</h2>
        <PermissionRoute permission="student_read">
          <StudentManagement />
        </PermissionRoute>
      </section>

      {/* Complaint Management - requires handle_complaints permission */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Complaint Management</h2>
        <PermissionRoute permission="complaint_update">
          <ComplaintManagement />
        </PermissionRoute>
      </section>

      {/* Role Management - requires manage_roles permission */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Role Management</h2>
        <PermissionRoute permission="role_update">
          <RoleManagement />
        </PermissionRoute>
      </section>

      {/* Reports - requires view_reports permission */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Reports</h2>
        <PermissionRoute permission="view_reports">
          <ReportsPage />
        </PermissionRoute>
      </section>

      {/* Visitor Management - requires manage_visitors permission */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visitor Management</h2>
        <PermissionRoute permission="visitor_update">
          <VisitorManagement />
        </PermissionRoute>
      </section>

      {/* Settings - requires manage_settings permission */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Settings</h2>
        <PermissionRoute permission="manage_settings">
          <SettingsPage />
        </PermissionRoute>
      </section>
    </div>
  );
};

// Example of conditional rendering based on permissions
export const ConditionalContent = () => {
  return (
    <div className="space-y-6">
      {/* Show different content based on permissions */}
      <PermissionRoute permission="hostel_update">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900">Owner Dashboard</h3>
          <p className="text-blue-700">You have full access to hostel management.</p>
        </div>
      </PermissionRoute>

      <PermissionRoute permission="complaint_update">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900">Warden Dashboard</h3>
          <p className="text-green-700">You can handle complaints and manage students.</p>
        </div>
      </PermissionRoute>

      <PermissionRoute permission="view_own_profile">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900">Student Dashboard</h3>
          <p className="text-gray-700">You can view your profile and submit complaints.</p>
        </div>
      </PermissionRoute>
    </div>
  );
};

// Example of nested permission routes
export const NestedPermissionExample = () => {
  return (
    <PermissionRoute permission="room_read">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Room Management</h2>
        
        {/* Nested permission check for room creation */}
        <PermissionRoute 
          permission="room_update"
          fallback={
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">You can view rooms but cannot create or edit them.</p>
            </div>
          }
        >
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900">Room Creation Tools</h3>
            <p className="text-green-700">You have full room management access.</p>
            <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Create New Room
            </button>
          </div>
        </PermissionRoute>

        {/* Always show room list if user can view rooms */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900">Room List</h3>
          <p className="text-blue-700">Here are all the rooms in your hostel.</p>
        </div>
      </div>
    </PermissionRoute>
  );
};







