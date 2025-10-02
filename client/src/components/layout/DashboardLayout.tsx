"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HostelSelector } from "@/components/HostelSelector";
import { CreateHostelForm } from "@/components/forms/CreateHostelForm";
import { useHostel } from "@/context/HostelContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoized layout wrapper to prevent unnecessary re-renders
const LayoutWrapper = React.memo(
  ({
    children,
    showHostelSelector = false,
    showCreateForm = false,
    currentHostel,
    isSuperadmin = false,
  }: {
    children: React.ReactNode;
    showHostelSelector?: boolean;
    showCreateForm?: boolean;
    currentHostel?: any;
    isSuperadmin?: boolean;
  }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => {
      // Get sidebar state from localStorage, default to open
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
      }
      return true;
    });

    // Save sidebar state to localStorage when it changes
    React.useEffect(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebarOpen", JSON.stringify(desktopSidebarOpen));
      }
    }, [desktopSidebarOpen]);

    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          {/* Hostel Selector - Only show when needed */}
          {showHostelSelector && <HostelSelector />}

          <div className="flex flex-1">
            {/* Mobile sidebar */}
            <div
              className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-in-out ${
                sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300"
                onClick={() => setSidebarOpen(false)}
              ></div>
              <div
                className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white transform transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <Sidebar mobile onClose={() => setSidebarOpen(false)} />
              </div>
            </div>

            {/* Desktop sidebar */}
            <div
              className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${
                desktopSidebarOpen ? "w-64" : "w-0"
              }`}
            >
              <div
                className={`${
                  desktopSidebarOpen ? "w-64" : "w-0"
                } flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
              >
                <Sidebar />
              </div>
            </div>

            {/* Main content */}
            <div
              className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
                desktopSidebarOpen ? "ml-0" : "ml-0"
              }`}
            >
              <DashboardHeader
                onMenuClick={() => setSidebarOpen(true)}
                hostel={currentHostel}
                onSidebarToggle={() =>
                  setDesktopSidebarOpen(!desktopSidebarOpen)
                }
                isSidebarOpen={desktopSidebarOpen}
              />

              <div className="flex-1 overflow-auto">
                <main
                  className={`py-6 transition-all duration-300 ease-in-out ${
                    desktopSidebarOpen
                      ? "px-4 sm:px-6 md:px-8"
                      : "px-4 sm:px-6 md:px-8"
                  }`}
                >
                  {showCreateForm ? (
                    <CreateHostelForm />
                  ) : currentHostel ||
                    showHostelSelector ||
                    showCreateForm ||
                    isSuperadmin ? (
                    children
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-500">
                        <h3 className="text-lg font-medium mb-2">
                          No Hostel Selected
                        </h3>
                        <p className="text-sm">
                          Please select a hostel to continue.
                        </p>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            </div>

            {/* Floating sidebar toggle button when sidebar is hidden */}
            {!desktopSidebarOpen && (
              <button
                onClick={() => setDesktopSidebarOpen(true)}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 z-30 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-r-lg shadow-lg transition-all duration-300 ease-in-out border-r border-t border-b border-gray-700"
                aria-label="Show sidebar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </ProtectedRoute>
    );
  }
);

LayoutWrapper.displayName = "LayoutWrapper";

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentHostel, hostels, loadingState, isMultiHostelOwner } =
    useHostel();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Owner no-hostel guard: If owner has zero hostels, prevent navigation to hostel-scoped routes and redirect to owner hostels page
  useEffect(() => {
    if (!user || user.role !== "owner") return;
    if (loadingState === "loading") return;
    if (hostels.length > 0) return; // owner already has at least one hostel

    // Define hostel-scoped patterns we want to guard (any /dashboard/hostels/... path)
    const isHostelScoped = pathname?.startsWith("/dashboard/hostels");
    const disallowedSections = ["/dashboard/owner/hostels/new"]; // allow creation page implicitly
    const isAlreadyOnOwnerHostels =
      pathname === "/dashboard/owner/hostels" ||
      pathname === "/dashboard/create-hostel" ||
      pathname === "/dashboard/owner/hostels/new";

    if (
      isHostelScoped ||
      (!isAlreadyOnOwnerHostels &&
        pathname?.startsWith("/dashboard") &&
        !disallowedSections.includes(pathname!))
    ) {
      router.replace("/dashboard/owner/hostels");
    }
  }, [user, hostels.length, pathname, router, loadingState]);

  // Memoize layout decisions to prevent unnecessary re-calculations
  const layoutConfig = useMemo(() => {
    if (loadingState === "loading") {
      return {
        type: "loading",
        showHostelSelector: false,
        showCreateForm: false,
        currentHostel: null,
      };
    }

    const isStudent = user?.role === "student";
    const isWarden = user?.role === "warden";
    const isOwner = user?.role === "owner";
    const isSuperadmin = user?.role === "superadmin";
    
    // Custom role check: any role that's not one of the system roles
    // This includes empty string, null, or any custom role name
    const isCustomRole =
      user?.role !== undefined &&
      !["student", "warden", "owner", "superadmin", "admin"].includes(
        user.role
      );

    // Superadmin users see the normal dashboard without hostel requirements
    if (isSuperadmin) {
      return {
        type: "normal",
        showHostelSelector: false,
        showCreateForm: false,
        currentHostel: null, // Superadmin doesn't need a hostel
      };
    }

    // Students, wardens, and custom roles (including staff with empty role or custom role_id)
    // always see the normal dashboard with their assigned hostel
    if (isStudent || isWarden || isCustomRole) {
      return {
        type: "normal",
        showHostelSelector: false,
        showCreateForm: false,
        currentHostel,
      };
    }

    // Owner with no hostels - show creation form
    if (isOwner && hostels.length === 0) {
      return {
        type: "create",
        showHostelSelector: false,
        showCreateForm: true,
        currentHostel: null,
      };
    }

    // Owner with single hostel - normal dashboard
    if (isOwner && hostels.length === 1) {
      return {
        type: "normal",
        showHostelSelector: false,
        showCreateForm: false,
        currentHostel,
      };
    }

    // Owner with multiple hostels - show selector in top navbar for all pages
    if (isOwner && isMultiHostelOwner) {
      return {
        type: "multiHostel",
        showHostelSelector: false, // Don't show separate selector since it's now in navbar
        showCreateForm: false,
        currentHostel,
      };
    }

    // Fallback
    return {
      type: "error",
      showHostelSelector: false,
      showCreateForm: false,
      currentHostel: null,
    };
  }, [
    loadingState,
    user?.role,
    hostels.length,
    isMultiHostelOwner,
    currentHostel,
  ]);

  // Handle loading state
  if (layoutConfig.type === "loading") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Handle error state
  if (layoutConfig.type === "error") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600">
              Please refresh the page or contact support.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Render appropriate layout
  return (
    <LayoutWrapper
      showHostelSelector={layoutConfig.showHostelSelector}
      showCreateForm={layoutConfig.showCreateForm}
      currentHostel={layoutConfig.currentHostel}
      isSuperadmin={user?.role === "superadmin"}
    >
      {children}
    </LayoutWrapper>
  );
}
