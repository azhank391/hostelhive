"use client";
import { useSubdomain } from '@/context/SubdomainContext';
import { useHostel } from '@/context/HostelContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Hostel } from '@/lib/types';

export default function SubdomainTestPage() {
  const { subdomain } = useSubdomain();
  const { currentHostel, hostels, isMultiHostelOwner } = useHostel();
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subdomain Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subdomain Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Subdomain Detection</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Current URL:</span>
              <span className="font-mono text-sm">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Detected Subdomain:</span>
              <span className={`font-mono ${subdomain ? 'text-green-600' : 'text-gray-400'}`}>
                {subdomain || 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Is Valid:</span>
              <span className={subdomain ? 'text-green-600' : 'text-red-500'}>
                {subdomain ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Hostel Context Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Hostel Context</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Selected Hostel:</span>
              <span className="font-medium">
                {currentHostel ? currentHostel.name : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hostel Subdomain:</span>
              <span className="font-mono text-sm">
                {currentHostel ? currentHostel.subdomain : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Multi-Hostel Owner:</span>
              <span className={isMultiHostelOwner ? 'text-blue-600' : 'text-gray-500'}>
                {isMultiHostelOwner ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Hostels:</span>
              <span className="font-medium">{hostels.length}</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">User Info</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">
                {user?.name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-sm">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium">{user?.role || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Available Hostels List */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Available Hostels</h2>
          {hostels.length > 0 ? (
            <div className="space-y-2">
              {hostels.map((hostel: Hostel) => (
                <div key={hostel.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{hostel.name}</div>
                    <div className="text-xs text-gray-500">{hostel.subdomain}.hostelhive.com</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${hostel.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {hostel.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {currentHostel?.id === hostel.id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No hostels available</div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Visit <code>localhost:3000</code> - Should show no subdomain</li>
          <li>• Visit <code>abc.localhost:3000</code> - Should detect &quot;abc&quot; subdomain</li>
          <li>• Create a hostel with subdomain &quot;abc&quot; to test context resolution</li>
          <li>• Login as owner with multiple hostels to test selector visibility</li>
        </ul>
      </div>
    </div>
  );
}
