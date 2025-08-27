'use client';

import React from 'react';
import { 
  LazyComplaintManagement, 
  LazyQuickActions, 
  LazyStudentForm 
} from './OptimizedLazyComponents';

/**
 * Test component to verify lazy loading functionality
 * This can be used to test if the lazy components load correctly
 */
export function LazyLoadingTest() {
  const [showComplaintManagement, setShowComplaintManagement] = React.useState(false);
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const [showStudentForm, setShowStudentForm] = React.useState(false);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Lazy Loading Test</h2>
      <p className="text-gray-600">
        Click the buttons below to dynamically load components and test the lazy loading functionality.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-4">
          <button
            onClick={() => setShowComplaintManagement(!showComplaintManagement)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showComplaintManagement ? 'Hide' : 'Load'} Complaint Management
          </button>
          
          {showComplaintManagement && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Complaint Management Component</h3>
              <LazyComplaintManagement />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showQuickActions ? 'Hide' : 'Load'} Quick Actions
          </button>
          
          {showQuickActions && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Quick Actions Component</h3>
              <LazyQuickActions />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowStudentForm(!showStudentForm)}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            {showStudentForm ? 'Hide' : 'Load'} Student Form
          </button>
          
          {showStudentForm && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Student Form Component</h3>
              <LazyStudentForm 
                hostels={[]}
                onSubmit={() => {}}
                onCancel={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Expected Behavior:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Components should show skeleton/loading state initially</li>
          <li>• Components should load dynamically when requested</li>
          <li>• Error boundaries should handle any loading failures gracefully</li>
          <li>• Network tab should show component chunks loading on demand</li>
        </ul>
      </div>
    </div>
  );
}
