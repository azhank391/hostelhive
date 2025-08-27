"use client";
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHostel } from '../context/HostelContext';
import { BuildingIcon, Share2Icon } from 'lucide-react';
import { ShareableLink } from './ShareableLink';

export function HostelSelector() {
  const { currentHostel, hostels, setActiveHostel, isMultiHostelOwner } = useHostel();
  const [loading, setLoading] = useState(false);
  const [localSelectedHostelId, setLocalSelectedHostelId] = useState<string>('');
  const router = useRouter();

  // Initialize local state when currentHostel changes
  useEffect(() => {
    if (currentHostel?.id) {
      setLocalSelectedHostelId(currentHostel.id);
    }
  }, [currentHostel?.id]);

  // Hide selector if user has only one hostel
  if (!isMultiHostelOwner) return null;

  const handleHostelChange = useCallback(async (hostelId: string) => {
    if (loading || !hostelId) return;
    
    try {
      setLoading(true);
      
      // IMMEDIATE UI UPDATE: Set local state first for instant feedback
      setLocalSelectedHostelId(hostelId);
      
      // Update the hostel context - this handles navigation internally
      await setActiveHostel(hostelId, true);
      
    } catch (error) {
      console.error('Failed to switch hostel:', error);
      // Revert local state on error to maintain consistency
      setLocalSelectedHostelId(currentHostel?.id || '');
    } finally {
      setLoading(false);
    }
  }, [loading, setActiveHostel, currentHostel?.id]);

  const handleShareHostel = useCallback((hostel: any) => {
    if (!hostel?.subdomain) return;
    
    const subdomain = hostel.subdomain;
    const isLocalhost = window.location.hostname === 'localhost';
    const baseUrl = isLocalhost ? 'localhost:3000' : 'hostelhive.com';
    const shareUrl = isLocalhost ? `http://${subdomain}.${baseUrl}` : `https://${subdomain}.${baseUrl}`;
    
    // Open in new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // Use local state for immediate UI feedback, fallback to context
  const selectedHostelId = localSelectedHostelId || currentHostel?.id || '';
  
  // Find the hostel object for display
  const selectedHostel = hostels.find(h => h.id === selectedHostelId);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <BuildingIcon className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-medium text-gray-700">Hostel:</span>
        
        <select
          value={selectedHostelId}
          onChange={(e) => handleHostelChange(e.target.value)}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-base font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[200px]"
        >
          <option value="" disabled>
            {loading ? 'Switching...' : 'Select Hostel'}
          </option>
          {hostels.map(hostel => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name} ({hostel.subdomain || hostel.id})
            </option>
          ))}
        </select>
      </div>
      
      {/* Share button for current hostel */}
      {selectedHostel && (
        <button
          onClick={() => handleShareHostel(selectedHostel)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={`Share ${selectedHostel.subdomain || selectedHostel.name}`}
        >
          <Share2Icon size={16} />
          <span>Share {selectedHostel.subdomain || selectedHostel.name}</span>
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for mobile or tight spaces
 */
export function CompactHostelSelector() {
  const { currentHostel, hostels, setActiveHostel, isMultiHostelOwner } = useHostel();
  const [loading, setLoading] = useState(false);
  const [localSelectedHostelId, setLocalSelectedHostelId] = useState<string>('');
  const router = useRouter();

  // Initialize local state when currentHostel changes
  useEffect(() => {
    if (currentHostel?.id) {
      setLocalSelectedHostelId(currentHostel.id);
    }
  }, [currentHostel?.id]);

  // Hide selector if user has only one hostel
  if (!isMultiHostelOwner) return null;

  const handleHostelChange = useCallback(async (hostelId: string) => {
    if (loading || !hostelId) return;
    
    try {
      setLoading(true);
      
      // IMMEDIATE UI UPDATE: Set local state first for instant feedback
      setLocalSelectedHostelId(hostelId);
      
      // Update the hostel context - this handles navigation internally
      await setActiveHostel(hostelId, true);
      
    } catch (error) {
      console.error('Failed to switch hostel:', error);
      // Revert local state on error to maintain consistency
      setLocalSelectedHostelId(currentHostel?.id || '');
    } finally {
      setLoading(false);
    }
  }, [loading, setActiveHostel, currentHostel?.id]);

  // Use local state for immediate UI feedback, fallback to context
  const selectedHostelId = localSelectedHostelId || currentHostel?.id || '';

  return (
    <div className="flex items-center gap-2">
      <BuildingIcon className="h-4 w-4 text-blue-600" />
      <select
        value={selectedHostelId}
        onChange={(e) => handleHostelChange(e.target.value)}
        disabled={loading}
        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[150px]"
      >
        <option value="" disabled>
          {loading ? 'Switching...' : 'Select Hostel'}
        </option>
        {hostels.map(hostel => (
          <option key={hostel.id} value={hostel.id}>
            {hostel.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Main Content Hostel Selector - For use in dashboard pages
 */
export function MainContentHostelSelector() {
  const { currentHostel, hostels, setActiveHostel, isMultiHostelOwner } = useHostel();
  const [loading, setLoading] = useState(false);
  const [localSelectedHostelId, setLocalSelectedHostelId] = useState<string>('');
  const router = useRouter();

  // Initialize local state when currentHostel changes
  useEffect(() => {
    if (currentHostel?.id) {
      console.log('🔄 MainContentHostelSelector: Context updated, syncing local state:', currentHostel.id);
      setLocalSelectedHostelId(currentHostel.id);
    }
  }, [currentHostel?.id]);

  // Hide selector if user has only one hostel
  if (!isMultiHostelOwner) return null;

  const handleHostelChange = useCallback(async (hostelId: string) => {
    if (loading || !hostelId) return;
    
    console.log('🎯 MainContentHostelSelector: Hostel change requested:', hostelId);
    
    try {
      setLoading(true);
      
      // IMMEDIATE UI UPDATE: Set local state first for instant feedback
      console.log('⚡ MainContentHostelSelector: Setting local state immediately:', hostelId);
      setLocalSelectedHostelId(hostelId);
      
      // Update the hostel context - this handles navigation internally
      console.log('🔄 MainContentHostelSelector: Calling setActiveHostel...');
      await setActiveHostel(hostelId, true);
      console.log('✅ MainContentHostelSelector: setActiveHostel completed');
      
    } catch (error) {
      console.error('❌ MainContentHostelSelector: Failed to switch hostel:', error);
      // Revert local state on error to maintain consistency
      setLocalSelectedHostelId(currentHostel?.id || '');
    } finally {
      setLoading(false);
    }
  }, [loading, setActiveHostel, currentHostel?.id]);

  const handleShareHostel = useCallback((hostel: any) => {
    if (!hostel?.subdomain) return;
    
    const subdomain = hostel.subdomain;
    const isLocalhost = window.location.hostname === 'localhost';
    const baseUrl = isLocalhost ? 'localhost:3000' : 'hostelhive.com';
    const shareUrl = isLocalhost ? `http://${subdomain}.${baseUrl}` : `https://${subdomain}.${baseUrl}`;
    
    // Open in new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // Use local state for immediate UI feedback, fallback to context
  const selectedHostelId = localSelectedHostelId || currentHostel?.id || '';
  
  // Find the hostel object for display
  const selectedHostel = hostels.find(h => h.id === selectedHostelId);

  // Debug logging to track state values
  console.log('🔍 MainContentHostelSelector Debug:', {
    localSelectedHostelId,
    currentHostelId: currentHostel?.id,
    selectedHostelId,
    selectedHostelName: selectedHostel?.name,
    loading
  });

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <BuildingIcon className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-medium text-gray-700">Hostel:</span>
        
        <select
          value={selectedHostelId}
          onChange={(e) => handleHostelChange(e.target.value)}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-base font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[200px]"
        >
          <option value="" disabled>
            {loading ? 'Switching...' : 'Select Hostel'}
          </option>
          {hostels.map(hostel => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name} ({hostel.subdomain || hostel.id})
            </option>
          ))}
        </select>
      </div>
      
      {/* Share button for current hostel */}
      {selectedHostel && (
        <button
          onClick={() => handleShareHostel(selectedHostel)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={`Share ${selectedHostel.subdomain || selectedHostel.name}`}
        >
          <Share2Icon size={16} />
          <span>Share {selectedHostel.subdomain || selectedHostel.name}</span>
        </button>
      )}
    </div>
  );
}