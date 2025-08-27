'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BuildingIcon, GlobeIcon } from 'lucide-react';
import type { Hostel } from '@/lib/types';

export function HostelSelectionModal() {
  const { user } = useAuth();
  const { hostels, currentHostel, setActiveHostel, isMultiHostelOwner } = useHostel();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Show modal if user is owner, has multiple hostels, and no hostel is selected
  const needsHostelSelection = user?.role === 'owner' && isMultiHostelOwner && !currentHostel;

  const handleHostelSelect = async (hostelId: string) => {
    const hostel = hostels.find(h => h.id === hostelId);
    if (!hostel) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 🎯 Use the new setActiveHostel method
      await setActiveHostel(hostelId);
      
      // 🚀 CRITICAL FIX: Navigate to the correct hostel-specific dashboard URL
      router.push(`/dashboard/hostels/${hostelId}`);
      
      // Modal will automatically close when currentHostel updates
    } catch (err) {
      console.error('Failed to select hostel:', err);
      setError(err instanceof Error ? err.message : 'Failed to select hostel');
    } finally {
      setLoading(false);
    }
  };

  if (!needsHostelSelection || !user || user.role !== 'owner') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <BuildingIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Your Hostel
            </h2>
            <p className="text-gray-600">
              Choose which hostel you&apos;d like to manage
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : hostels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No hostels found</p>
              <Button onClick={() => window.location.href = '/dashboard/create-hostel'}>
                Create Your First Hostel
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {hostels.map((hostel: Hostel) => (
                <div
                  key={hostel.id}
                  className={`border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer ${
                    loading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onClick={() => handleHostelSelect(hostel.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{hostel.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <GlobeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {hostel.subdomain || hostel.id}.localhost:3000
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {hostel.plan || 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
