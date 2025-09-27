"use client";

import React, { memo, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHostel } from "@/context/HostelContext";
import {
  useAdminApiWithHostel,
  useCurrentHostelId,
} from "@/lib/context-aware-api";
import { usePermissions } from "@/contexts/PermissionContext";
import { getAccessibleSidebarSections } from "@/lib/permission-routing";

import {
  BuildingIcon,
  LayoutDashboardIcon,
  BedIcon,
  SettingsIcon,
  HelpCircleIcon,
  XIcon,
  GraduationCapIcon,
  AlertCircleIcon,
  UserCheckIcon,
  CreditCardIcon,
  BarChart3Icon,
  EyeIcon,
  UserPlusIcon,
  MessageCircleIcon,
  FileTextIcon,
  ShieldIcon,
} from "lucide-react";

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

interface SidebarItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  path: string;
  permission: string;
  children?: SidebarItem[];
  count?: number;
}

// Define sidebar structure with permissions (using actual database permission names)
// Simplified - no sub-sections for reduced complexity
const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "rooms",
    name: "Room Management",
    icon: BedIcon,
    path: "/dashboard/hostels/:hostelId/rooms",
    permission: "room_read",
  },
  {
    id: "students",
    name: "Students",
    icon: GraduationCapIcon,
    path: "/dashboard/hostels/:hostelId/students",
    permission: "student_read",
  },
  {
    id: "staff",
    name: "Staff Management",
    icon: ShieldIcon,
    path: "/dashboard/hostels/:hostelId/staff/manage",
    permission: "staff_read", // Updated to use staff permission instead of role permission
  },
  {
    id: "complaints",
    name: "Complaints",
    icon: AlertCircleIcon,
    path: "/complaints",
    permission: "complaint_read", // Using actual database permission
  },
  {
    id: "visitors",
    name: "Visitor Management",
    icon: UserCheckIcon,
    path: "/visitors",
    permission: "visitor_read", // Using actual database permission
  },
  //this is owner dashboard page
  {
    id: "billing",
    name: "Billing",
    icon: CreditCardIcon,
    path: "/billing",
    permission: "view_billing",
  },
];

const NavItem = memo(
  ({ to, icon, children, end = false, count }: NavItemProps) => {
    const pathname = usePathname();
    const { currentHostel } = useHostel();

    // Replace :hostelId with actual hostel ID in the path
    const actualPath = currentHostel
      ? to.replace(":hostelId", currentHostel.id)
      : to;
    const isActive = pathname
      ? end
        ? pathname === actualPath
        : pathname.startsWith(actualPath)
      : false;

    const linkClassName = useMemo(
      () => `
    flex items-center px-4 sm:px-6 py-3 sm:py-2 text-base sm:text-sm font-medium rounded-lg sm:rounded-md transition-all duration-200
    ${
      isActive
        ? "bg-white text-gray-900 shadow-md"
        : "text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700"
    }
  `,
      [isActive]
    );

    const countClassName = useMemo(
      () => `
    ml-auto px-2 py-1 text-xs font-medium rounded-full
    ${isActive ? "bg-gray-900 text-white" : "bg-gray-700 text-gray-300"}
  `,
      [isActive]
    );

    return (
      <Link href={to} className={linkClassName}>
        <span className="mr-3 sm:mr-3 flex-shrink-0">{icon}</span>
        <span className="flex-1">{children}</span>
        {count !== undefined && count > 0 && (
          <span className={countClassName}>{count}</span>
        )}
      </Link>
    );
  }
);

NavItem.displayName = "NavItem";

export const Sidebar = memo(({ mobile = false, onClose }: SidebarProps) => {
  const { user } = useAuth();
  // Access both currentHostel and hostels list so we can suppress invalid links for first-time owners
  const { currentHostel, hostels } = useHostel();
  const { hasPermission, userRole, loading } = usePermissions();
  const [activeItem, setActiveItem] = useState<string>("dashboard");
  // Removed expandedSections state since we no longer have sub-sections

  // 🚀 NEW: Skip hostel-related hooks for superadmin users
  const isSuperadmin = user?.role === "superadmin";

  // Only call hostel-related hooks for non-superadmin users
  const { hasHostel, getHostelIdSafe, isReady } = isSuperadmin
    ? { hasHostel: false, getHostelIdSafe: () => null, isReady: true }
    : useCurrentHostelId();
  const admin = isSuperadmin ? null : useAdminApiWithHostel();
  const [visitorCount, setVisitorCount] = useState(0);

  const { isOwner, isWarden, isStudent } = useMemo(
    () => ({
      isOwner: user?.role === "owner",
      isWarden: user?.role === "warden",
      isStudent: user?.role === "student",
    }),
    [user?.role]
  );

  // Get current hostel ID for URL construction
  const currentHostelId = isSuperadmin
    ? null
    : typeof getHostelIdSafe === "function"
    ? getHostelIdSafe()
    : getHostelIdSafe;

  // Fetch visitor count for owners/wardens using context-aware API with caching
  useEffect(() => {
    // 🚀 NEW: Skip for superadmin users or if admin API is not available
    if (isSuperadmin || !admin) return;

    if ((isOwner || isWarden) && hasHostel && isReady) {
      let isMounted = true;

      const fetchVisitorCount = async () => {
        try {
          // 🎯 Use context-aware API - hostelId automatically injected
          const result = await admin.getVisitorLogs({
            page: 1,
            limit: 100,
            status: "checked-in",
          });

          if (isMounted) {
            // Count visitors who are still checked in (no exitTime)
            const currentVisitors =
              (result as any)?.data?.filter((visitor: any) => !visitor.exitTime)
                ?.length || 0;
            setVisitorCount(currentVisitors);
          }
        } catch (error) {
          console.error("Failed to fetch visitor count:", error);
          if (isMounted) {
            setVisitorCount(0);
          }
        }
      };

      // Only fetch if we have a valid hostel ID
      const hostelId =
        typeof getHostelIdSafe === "function"
          ? getHostelIdSafe()
          : getHostelIdSafe;
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
  }, [
    isOwner,
    isWarden,
    hasHostel,
    isReady,
    admin,
    getHostelIdSafe,
    isSuperadmin,
  ]);

  const userInitial = useMemo(
    () => (user?.name ? user.name.charAt(0).toUpperCase() : "U"),
    [user?.name]
  );

  // Filter sidebar items based on user permissions using our new utility
  const getFilteredSidebarItems = (items: SidebarItem[]): SidebarItem[] => {
    if (!user) return [];

    // Guard: First-time owner (no hostels yet) should NOT see operational sidebar items that depend on a hostel context.
    if (user.role === "owner" && (!hostels || hostels.length === 0)) {
      return [];
    }

    // Get accessible sections for this user
    const accessibleSections = getAccessibleSidebarSections(user);

    return items.filter((item) => {
      // Map item IDs to section names for filtering
      const sectionMap: Record<string, string> = {
        students: "students",
        staff: "staff",
        complaints: "complaints",
        rooms: "rooms",
        visitors: "visitors",
        billing: "billing",
      };

      const section = sectionMap[item.id];
      if (section) {
        return accessibleSections.includes(section);
      }

      // Default: use permission check
      return item.permission ? hasPermission(item.permission) : false;
    });
  };

  // Check if GENERAL section should be visible
  const shouldShowGeneralSection = useMemo(() => {
    // Always show for system roles
    if (
      user?.role === "superadmin" ||
      user?.role === "owner" ||
      user?.role === "warden" ||
      user?.role === "student"
    ) {
      return true;
    }

    // For custom roles, only show if they have dashboard access or are an owner
    return hasPermission("view_hostel_stats") || isOwner;
  }, [user?.role, hasPermission, isOwner]);

  // Check if there are any visible items in GENERAL section
  const hasGeneralItems = useMemo(() => {
    let itemCount = 0;

    // Dashboard item
    if (
      user?.role === "superadmin" ||
      user?.role === "owner" ||
      user?.role === "warden" ||
      user?.role === "student" ||
      hasPermission("view_hostel_stats")
    ) {
      itemCount++;
    }

    // My Hostels item (owner only)
    if (isOwner) {
      itemCount++;
    }

    return itemCount > 0;
  }, [user?.role, hasPermission, isOwner]);

  const filteredItems = getFilteredSidebarItems(SIDEBAR_ITEMS);

  // Removed toggleSection function since we no longer have expandable sections

  const renderSidebarItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;

    // Build the correct path based on user role and hostel context
    let itemPath = item.path;
    if (item.id === "dashboard") {
      if (isSuperadmin) {
        itemPath = "/dashboard/superadmin";
      } else if (isStudent) {
        // Students always go to their student dashboard
        itemPath = "/dashboard/student";
      } else if (isWarden) {
        // Wardens always go to their warden dashboard
        itemPath = "/dashboard/warden";
      } else if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}`;
      } else if (user?.hostelId) {
        // For custom roles with hostelId, route to hostel dashboard
        itemPath = `/dashboard/hostels/${user.hostelId}`;
      } else if (currentHostelId) {
        // Fallback to current hostel context
        itemPath = `/dashboard/hostels/${currentHostelId}`;
      } else {
        // Last resort - use role-based path
        itemPath = `/dashboard/${user?.role}`;
      }
    } else if (item.id === "rooms") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/rooms`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/rooms`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/rooms`;
      } else {
        itemPath = `/dashboard/${user?.role}/rooms`;
      }
    } else if (item.id === "students") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/students`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/students`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/students`;
      } else {
        itemPath = `/dashboard/${user?.role}/students`;
      }
    } else if (item.id === "staff") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/staff`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff`;
      } else {
        itemPath = `/dashboard/${user?.role}/staff`;
      }
    } else if (item.id === "view-staff") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/staff`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff`;
      } else {
        itemPath = `/dashboard/${user?.role}/staff`;
      }
    } else if (item.id === "manage-staff") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff/manage`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/staff/manage`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff/manage`;
      } else {
        itemPath = `/dashboard/${user?.role}/staff/manage`;
      }
    } else if (item.id === "custom-roles") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff/roles`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/staff/roles`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/staff/roles`;
      } else {
        itemPath = `/dashboard/${user?.role}/staff/roles`;
      }
    } else if (item.id === "complaints") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/complaints`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/complaints`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/complaints`;
      } else {
        itemPath = `/dashboard/${user?.role}/complaints`;
      }
    } else if (item.id === "visitors") {
      if (isOwner && currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/visitors`;
      } else if (user?.hostelId) {
        itemPath = `/dashboard/hostels/${user.hostelId}/visitors`;
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/visitors`;
      } else {
        itemPath = `/dashboard/${user?.role}/visitors`;
      }
    } else if (item.id === "billing") {
      // Billing is available to users with view_billing permission
      if (isSuperadmin) {
        itemPath = "/dashboard/superadmin/billing";
      } else if (currentHostelId) {
        itemPath = `/dashboard/hostels/${currentHostelId}/billing`;
      } else {
        itemPath = `/dashboard/${user?.role}/billing`;
      }
    }

    return (
      <div key={item.id} className="mb-1">
        <NavItem
          to={itemPath}
          icon={<Icon size={24} className="sm:w-5 sm:h-5" />}
          end={item.id === "dashboard"}
          count={item.id === "visitors" ? visitorCount : undefined}
        >
          {item.name}
        </NavItem>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col border-r border-gray-700 bg-gray-900">
        <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 sm:px-6">
          <span className="text-[#3B82F6] font-bold text-xl md:hidden">
            Hostel<span className="text-[#10B981]">Hive</span>
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-300">Loading sidebar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-r border-gray-700 bg-gray-900">
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
            className="text-gray-400 hover:text-white focus:outline-none p-2 rounded-full hover:bg-gray-800 transition-colors touch-manipulation"
            aria-label="Close sidebar"
          >
            <XIcon size={24} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto pt-5 lg:pt-2 pb-4">
        {/* Legacy navigation for backward compatibility - only show if there are visible items */}
        {shouldShowGeneralSection && hasGeneralItems && (
          <div className="px-3 sm:px-4 mt-2 lg:mt-0">
            <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-2">
              General
            </p>
            <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
              {/* Dashboard access - only show if user has explicit dashboard permission */}
              {(user?.role === "superadmin" ||
                user?.role === "owner" ||
                user?.role === "warden" ||
                user?.role === "student" ||
                hasPermission("view_hostel_stats")) && (
                <NavItem
                  to={
                    isSuperadmin
                      ? "/dashboard/superadmin"
                      : isStudent
                      ? "/dashboard/student"
                      : isWarden
                      ? "/dashboard/warden"
                      : isOwner && currentHostelId
                      ? `/dashboard/hostels/${currentHostelId}`
                      : user?.hostelId
                      ? `/dashboard/hostels/${user.hostelId}`
                      : currentHostelId
                      ? `/dashboard/hostels/${currentHostelId}`
                      : `/dashboard/${user?.role}`
                  }
                  icon={
                    <LayoutDashboardIcon size={24} className="sm:w-5 sm:h-5" />
                  }
                  end
                >
                  Dashboard
                </NavItem>
              )}
              {isOwner && (
                <NavItem
                  to="/dashboard/owner/hostels"
                  icon={<BuildingIcon size={24} className="sm:w-5 sm:h-5" />}
                >
                  My Hostels
                </NavItem>
              )}
            </nav>
          </div>
        )}

        {/* 🚀 NEW: Superadmin-specific navigation */}
        {isSuperadmin && (
          <div className="px-3 sm:px-4 mt-6 lg:mt-4">
            <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-2">
              Superadmin
            </p>
            <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
              <NavItem
                to="/dashboard/superadmin/hostels"
                icon={<BuildingIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                All Hostels
              </NavItem>
              <NavItem
                to="/dashboard/superadmin/billing"
                icon={<CreditCardIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                Billing Overview
              </NavItem>
              <NavItem
                to="/dashboard/superadmin/analytics"
                icon={<BarChart3Icon size={24} className="sm:w-5 sm:h-5" />}
              >
                Analytics
              </NavItem>
            </nav>
          </div>
        )}

        {/* Permission-based navigation - Hide for students */}
        {!isStudent && (
          <div className="px-3 sm:px-4 mt-6 lg:mt-4">
            <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-2">
              Operations
            </p>
            {filteredItems.length > 0 ? (
              <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
                {filteredItems.map((item) => renderSidebarItem(item))}
              </nav>
            ) : (
              <div className="mt-2 text-xs text-gray-400 bg-gray-800 border border-dashed border-gray-700 rounded-md p-3 leading-relaxed">
                <p className="font-medium text-gray-300 mb-1">No Hostels Yet</p>
                <p>
                  Create a hostel to unlock management features like Rooms,
                  Students, Staff, Visitors, Complaints, and Billing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Legacy student navigation */}
        {isStudent && (
          <div className="px-3 sm:px-4 mt-6 lg:mt-4">
            <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-2">
              Student
            </p>
            <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
              <NavItem
                to="/dashboard/student/rooms"
                icon={<BedIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                My Room
              </NavItem>
              <NavItem
                to="/dashboard/student/complaints"
                icon={<AlertCircleIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                My Complaints
              </NavItem>
              <NavItem
                to="/dashboard/student/visitors"
                icon={<UserCheckIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                My Visitors
              </NavItem>
            </nav>
          </div>
        )}

        {/* System section - only show if there are visible items */}
        {user && (
          <div className="px-3 sm:px-4 mt-6 lg:mt-4">
            <p className="px-2 sm:px-4 text-sm sm:text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 sm:mb-2">
              System
            </p>
            <nav className="mt-2 lg:mt-1 space-y-2 sm:space-y-1">
              <NavItem
                to={
                  isSuperadmin
                    ? "/dashboard/superadmin/settings"
                    : isOwner && currentHostelId
                    ? `/dashboard/hostels/${currentHostelId}/settings`
                    : user?.hostelId
                    ? `/dashboard/hostels/${user.hostelId}/settings`
                    : currentHostelId
                    ? `/dashboard/hostels/${currentHostelId}/settings`
                    : `/dashboard/${user?.role}/settings`
                }
                icon={<SettingsIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                Settings
              </NavItem>
              <NavItem
                to={`/dashboard/${user?.role}/help`}
                icon={<HelpCircleIcon size={24} className="sm:w-5 sm:h-5" />}
              >
                Help & Support
              </NavItem>
            </nav>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex border-t border-gray-700 p-4 sm:p-6">
        <div className="flex items-center w-full">
          <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg sm:text-lg flex-shrink-0">
            {userInitial}
          </div>
          <div className="ml-3 sm:ml-3 flex-1 min-w-0">
            <p className="text-base sm:text-sm font-semibold text-white truncate">
              {user?.name || "Loading..."}
            </p>
            <p className="text-sm sm:text-xs text-gray-300 capitalize truncate">
              {user?.role || "..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";
