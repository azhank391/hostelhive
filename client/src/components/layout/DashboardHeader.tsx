'use client'

import React, { memo } from 'react';
import { MenuIcon, BellIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { CompactHostelSelector } from '../HostelSelector';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  hostel?: any;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

export const DashboardHeader = memo(({
  onMenuClick,
  hostel,
  onSidebarToggle,
  isSidebarOpen = true
}: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { currentHostel } = useHostel();
  
  // Use the provided hostel prop or fall back to context
  const displayHostel = hostel || currentHostel;

  return (
    <header className="bg-gray-900 shadow-sm sticky top-0 z-10 border-b border-gray-700">
      <div className="px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            type="button" 
            className="md:hidden text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1 transition-colors" 
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <MenuIcon size={24} />
          </button>
          
          {/* Desktop sidebar toggle button */}
          <button 
            type="button" 
            className="hidden md:flex text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1 transition-colors mr-3" 
            onClick={onSidebarToggle}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
          
          <div className="ml-4 md:ml-0">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-white font-bold text-xl">
                Hostel<span className="text-green-400">Hive</span>
              </span>
            </Link>
          </div>
          
          {/* Hostel Selector - Replace static name with interactive selector */}
          {displayHostel && (
            <div className="ml-6">
              <CompactHostelSelector />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button 
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Notifications"
          >
            <BellIcon size={20} />
          </button>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-white">
                {user?.name || 'Loading...'}
              </span>
              <span className="text-xs text-gray-300 capitalize">
                {user?.role || '...'}
              </span>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={() => logout()}
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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