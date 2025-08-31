"use client";
import { useCallback, useEffect } from 'react';
import { useHostel } from '../context/HostelContext';
import { BuildingIcon, Share2Icon } from 'lucide-react';
import { ShareableLink } from './ShareableLink';

export function HostelSelector() {
  const { currentHostel, hostels, setActiveHostel, isMultiHostelOwner } = useHostel();

  // Hide selector if user has only one hostel
  if (!isMultiHostelOwner) return null;

  const handleHostelChange = useCallback(async (hostelId: string) => {
    if (!hostelId) return;
    
    try {
      // Update the hostel context - this handles navigation internally
      await setActiveHostel(hostelId, true);
    } catch (error) {
      console.error('Failed to switch hostel:', error);
    }
  }, [setActiveHostel]);

  const handleShareHostel = useCallback((hostel: any) => {
    if (!hostel?.subdomain) return;
    
    const subdomain = hostel.subdomain;
    const isLocalhost = window.location.hostname === 'localhost';
    const baseUrl = isLocalhost ? 'localhost:3000' : 'hostelhive.com';
    const shareUrl = isLocalhost ? `http://${subdomain}.${baseUrl}` : `https://${subdomain}.${baseUrl}`;
    
    // Open in new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // Ensure we always have a string value for the select
  const selectedHostelId = currentHostel?.id || '';

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <BuildingIcon className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-medium text-gray-700">Hostel:</span>
        
        <select
          value={selectedHostelId}
          onChange={(e) => handleHostelChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-base font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[200px]"
        >
          <option value="" disabled>
            Select Hostel
          </option>
          {hostels.map(hostel => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name} ({hostel.subdomain || hostel.id})
            </option>
          ))}
        </select>
      </div>
      
      {/* Share button for current hostel */}
      {currentHostel && (
        <button
          onClick={() => handleShareHostel(currentHostel)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={`Share ${currentHostel.subdomain || currentHostel.name}`}
        >
          <Share2Icon size={16} />
          <span>Share {currentHostel.subdomain || currentHostel.name}</span>
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

  // Hide selector if user has only one hostel
  if (!isMultiHostelOwner) return null;

  const handleHostelChange = useCallback(async (hostelId: string) => {
    if (!hostelId) return;
    
    try {
      // Update the hostel context - this handles navigation internally
      await setActiveHostel(hostelId, true);
    } catch (error) {
      console.error('Failed to switch hostel:', error);
    }
  }, [setActiveHostel]);

  // Ensure we always have a string value for the select
  const selectedHostelId = currentHostel?.id || '';

  return (
    <div className="flex items-center gap-2">
      <BuildingIcon className="h-4 w-4 text-blue-600" />
      <select
        value={selectedHostelId}
        onChange={(e) => handleHostelChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[150px]"
      >
        <option value="" disabled>
          Select Hostel
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

  // 🚀 DEBUG: Track component re-renders and context changes
  useEffect(() => {
    console.log('🔄 MainContentHostelSelector: Component re-rendered with currentHostel:', currentHostel?.id);
  });

  // 🚀 DEBUG: Track when currentHostel actually changes
  useEffect(() => {
    console.log('🎯 MainContentHostelSelector: currentHostel changed to:', currentHostel?.id);
  }, [currentHostel?.id]);

  // Hide selector if user has only one hostel
  if (!isMultiHostelOwner) return null;

  const handleHostelChange = useCallback(async (hostelId: string) => {
    if (!hostelId) return;
    
    console.log('🎯 MainContentHostelSelector: Hostel change requested:', hostelId, 'Type:', typeof hostelId);
    console.log('🎯 MainContentHostelSelector: Current hostel before change:', currentHostel?.id, 'Type:', typeof currentHostel?.id);
    
    try {
      // Update the hostel context - this handles navigation internally
      await setActiveHostel(hostelId, true);
      console.log('✅ MainContentHostelSelector: setActiveHostel completed');
    } catch (error) {
      console.error('Failed to switch hostel:', error);
    }
  }, [setActiveHostel]);

  const handleShareHostel = useCallback((hostel: any) => {
    if (!hostel?.subdomain) return;
    
    const subdomain = hostel.subdomain;
    const isLocalhost = window.location.hostname === 'localhost';
    const baseUrl = isLocalhost ? 'localhost:3000' : 'hostelhive.com';
    const shareUrl = isLocalhost ? `http://${subdomain}.${baseUrl}` : `https://${subdomain}.${baseUrl}`;
    
    // Open in new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // Ensure we always have a string value for the select
  const selectedHostelId = currentHostel?.id || '';
  
  // Debug logging to track state values
  console.log('🔍 MainContentHostelSelector Debug:', {
    currentHostelId: currentHostel?.id,
    currentHostelIdType: typeof currentHostel?.id,
    selectedHostelId,
    selectedHostelIdType: typeof selectedHostelId,
    hostelsCount: hostels.length,
    hostelsIds: hostels.map(h => ({ id: h.id, type: typeof h.id }))
  });

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <BuildingIcon className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-medium text-gray-700">Hostel:</span>
        
        <select
          value={selectedHostelId}
          onChange={(e) => handleHostelChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-base font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[200px]"
        >
          <option value="" disabled>
            Select Hostel
          </option>
          {hostels.map(hostel => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name} ({hostel.subdomain || hostel.id})
            </option>
          ))}
        </select>
      </div>
      
      {/* Share button for current hostel */}
      {currentHostel && (
        <button
          onClick={() => handleShareHostel(currentHostel)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={`Share ${currentHostel.subdomain || currentHostel.name}`}
        >
          <Share2Icon size={16} />
          <span>Share {currentHostel.subdomain || currentHostel.name}</span>
        </button>
      )}
    </div>
  );
}
