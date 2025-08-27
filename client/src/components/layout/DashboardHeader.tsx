'use client'

import React, { memo } from 'react';
import { MenuIcon, BellIcon, BuildingIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { MainContentHostelSelector } from '../HostelSelector';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  hostel?: any;
}

export const DashboardHeader = memo(({
  onMenuClick,
  hostel
}: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { currentHostel } = useHostel();
  
  // Use the provided hostel prop or fall back to context
  const displayHostel = hostel || currentHostel;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            type="button" 
            className="md:hidden text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1" 
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <MenuIcon size={24} />
          </button>
          <div className="ml-4 md:ml-0">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-[#3B82F6] font-bold text-xl">
                Hostel<span className="text-[#10B981]">Hive</span>
              </span>
            </Link>
          </div>
          
          {/* Hostel Selector - Replace static name with interactive selector */}
          {displayHostel && (
            <div className="ml-6">
              <MainContentHostelSelector />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button 
            className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Notifications"
          >
            <BellIcon size={20} />
          </button>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-700">
                {user?.name || 'Loading...'}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {user?.role || '...'}
              </span>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={() => logout()}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';