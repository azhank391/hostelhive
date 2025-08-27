'use client'

import React, { memo, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { useAdminApiWithHostel, useCurrentHostelId } from '@/lib/context-aware-api';

import { BuildingIcon, UsersIcon, LayoutDashboardIcon, BedIcon, SettingsIcon, HelpCircleIcon, XIcon, GraduationCapIcon, AlertCircleIcon, UserCheckIcon } from 'lucide-react';

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
  count?: number;
}



const NavItem = memo(({
  to,
  icon,
  children,
  end = false,
  count
}: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname ? (end ? pathname === to : pathname.startsWith(to)) : false;
  
  const linkClassName = useMemo(() => `
    flex items-center px-4 sm:px-6 py-3 sm:py-2 text-base sm:text-sm font-medium rounded-lg sm:rounded-md transition-all duration-200
    ${isActive ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'}
  `, [isActive]);

  const countClassName = useMemo(() => `
    ml-auto px-2 py-1 text-xs font-medium rounded-full
    ${isActive ? 'bg-white text-[#3B82F6]' : 'bg-blue-100 text-blue-800'}
  `, [isActive]);
  
  return (
    <Link href={to} className={linkClassName}>
      <span className="mr-3 sm:mr-3 flex-shrink-0">{icon}</span>
      <span className="flex-1">{children}</span>
      {count !== undefined && count > 0 && (
        <span className={countClassName}>
          {count}
        </span>
      )}
    </Link>
  );
})

NavItem.displayName = 'NavItem'

export const Sidebar = memo(({
  mobile = false,
  onClose
}: SidebarProps) => {
  const { user } = useAuth();
  const { currentHostel } = useHostel();
  const { hasHostel, getHostelIdSafe, isReady } = useCurrentHostelId();
  const admin = useAdminApiWithHostel();
  const [visitorCount, setVisitorCount] = useState(0);
  
  const { isOwner, isWarden, isStudent } = useMemo(() => ({
    isOwner: user?.role === 'owner',
    isWarden: user?.role === 'warden',
    isStudent: user?.role === 'student',
  }), [user?.role]);

  // Get current hostel ID for URL construction
  const currentHostelId = getHostelIdSafe();

  // Fetch visitor count for owners/wardens using context-aware API with caching
  useEffect(() => {
    if ((isOwner || isWarden) && hasHostel && isReady) {
      let isMounted = true;
      
      const fetchVisitorCount = async () => {
        try {
          // 🎯 Use context-aware API - hostelId automatically injected
          const result = await admin.getVisitorLogs({ 
            page: 1, 
            limit: 100, 
            status: 'checked-in' 
          });
          
          if (isMounted) {
            // Count visitors who are still checked in (no exitTime)
            const currentVisitors = (result as any)?.data?.filter((visitor: any) => !visitor.exitTime)?.length || 0;
            setVisitorCount(currentVisitors);
          }
        } catch (error) {
          console.error('Failed to fetch visitor count:', error);
          if (isMounted) {
            setVisitorCount(0);
          }
        }
      };

      // Only fetch if we have a valid hostel ID
      const hostelId = getHostelIdSafe();
      if (hostelId) {
        // Initial fetch
        fetchVisitorCount();
        
        // Set up periodic refresh every 30 seconds for real-time updates
        const interval = setInterval(fetchVisitorCount, 30000);
        
        return () => {
          isMounted = false;
          clearInterval(interval);
        };
      }
    }
  }, [isOwner, isWarden, hasHostel, isReady, admin, getHostelIdSafe]);


  const userInitial = useMemo(() => 
    user?.name ? user.name.charAt(0).toUpperCase() : 'U',
    [user?.name]
  );

  return (
    <div className="h-full flex flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 sm:px-6">
        <div className="flex items-center">
          {/* Only show logo on mobile, hide on larger screens to avoid duplication with header */}
          <span className="text-[#3B82F6] font-bold text-xl md:hidden">
            Hostel<span className="text-[#10B981]">Hive</span>
          </span>
        </div>
        {mobile && onClose && (
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Close sidebar"
          >
            <XIcon size={24} />
          </button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 lg:pt-2 pb-4">
        <div className="px-3 sm:px-4 mt-2 lg:mt-0">
          <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-2">
            General
          </p>
          <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
            <NavItem 
              to={isOwner && currentHostelId ? `/dashboard/hostels/${currentHostelId}` : `/dashboard/${user?.role}`} 
              icon={<LayoutDashboardIcon size={24} className="sm:w-5 sm:h-5" />} 
              end
            >
              Dashboard
            </NavItem>
            {isOwner && (
              <NavItem 
                to="/dashboard/owner/hostels" 
                icon={<BuildingIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                My Hostels
              </NavItem>
            )}
            {(isOwner || isWarden) && currentHostelId && (
              <NavItem 
                to={isOwner ? `/dashboard/hostels/${currentHostelId}/rooms` : `/dashboard/${user?.role}/rooms`}
                icon={<BedIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                Room Management
              </NavItem>
            )}
          </nav>
        </div>
        
        {(isOwner || isWarden) && currentHostelId && (
          <div className="px-3 sm:px-4 mt-6 lg:mt-4">
            <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-2">
              People
            </p>
            <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
              <NavItem 
                to={isOwner ? `/dashboard/hostels/${currentHostelId}/students` : `/dashboard/${user?.role}/students`}
                icon={<GraduationCapIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                Students
              </NavItem>
              {isOwner && (
                <NavItem to="/dashboard/owner/wardens" icon={<UsersIcon size={24} className="sm:w-5 sm:h-5" />}>
                  Wardens
                </NavItem>
              )}
              <NavItem 
                to={isOwner ? `/dashboard/hostels/${currentHostelId}/visitors` : `/dashboard/${user?.role}/visitors`}
                icon={<UserCheckIcon size={24} className="sm:w-5 sm:h-5" />}
                count={visitorCount}
              >
                Visitors
              </NavItem>
            </nav>
          </div>
        )}
        
        <div className="px-3 sm:px-4 mt-6 lg:mt-4">
            <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-2">
              Operations
            </p>
            <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
            {(isOwner || isWarden) && currentHostelId && (
              <NavItem 
                to={isOwner ? `/dashboard/hostels/${currentHostelId}/complaints` : `/dashboard/${user?.role}/complaints`}
                icon={<AlertCircleIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                Complaints
              </NavItem>
            )}
            {isStudent && (
              <NavItem 
                to="/dashboard/student/complaints" 
                icon={<AlertCircleIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                My Complaints
              </NavItem>
            )}
            <NavItem to={`/dashboard/${user?.role}/settings`} icon={<SettingsIcon size={24} className="sm:w-5 sm:h-5" />}>
              Settings
            </NavItem>
            <NavItem to={`/dashboard/${user?.role}/help`} icon={<HelpCircleIcon size={24} className="sm:w-5 sm:h-5" />}>
              Help & Support
            </NavItem>
          </nav>
        </div>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4 sm:p-6">
        <div className="flex items-center w-full">
          <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg sm:text-lg flex-shrink-0">
            {userInitial}
          </div>
          <div className="ml-3 sm:ml-3 flex-1 min-w-0">
            <p className="text-base sm:text-sm font-semibold text-gray-700 truncate">{user?.name || 'Loading...'}</p>
            <p className="text-sm sm:text-xs text-gray-500 capitalize truncate">{user?.role || '...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
})

Sidebar.displayName = 'Sidebar'