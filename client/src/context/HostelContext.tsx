"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { authApi, hostelApi, studentApi } from "../lib/api";
import { notification } from "../lib/toast";
import { STORAGE_KEYS } from "../lib/config";
import type {
  Hostel,
  CreateHostelData,
} from "../lib/types";

enum LoadingState {
  IDLE = "idle",
  LOADING = "loading",
  LOADED = "loaded",
  ERROR = "error",
}

interface HostelContextType {
  hostels: Hostel[];
  currentHostel: Hostel | null;
  loadingState: LoadingState;
  error: string | null;
  setCurrentHostel: (hostel: Hostel) => void;
  isReady: boolean; // Computed property for easy checking
  setActiveHostel: (hostelId: string, syncToServer?: boolean) => Promise<void>;
  refreshHostels: () => Promise<void>;
  createHostel: (hostelData: CreateHostelData) => Promise<Hostel>;
  updateHostel: (hostelId: string, updates: Partial<Hostel>) => Promise<Hostel>;
  isMultiHostelOwner: boolean;
  getCurrentHostelId: () => string | null;
}

const HostelContext = createContext<HostelContextType | null>(null);

export const HostelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [currentHostel, setCurrentHostel] = useState<Hostel | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(
    LoadingState.IDLE
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch owner hostels using optimized API
  const fetchOwnerHostels = useCallback(async (): Promise<Hostel[]> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await authApi.getUserHostels();

      // Handle response format (could be direct array or wrapped in object)
      let hostelArray: Hostel[];
      if (Array.isArray(response)) {
        hostelArray = response;
      } else if (
        (response as any)?.hostels &&
        Array.isArray((response as any).hostels)
      ) {
        hostelArray = (response as any).hostels;
      } else {
        console.error("Unexpected hostel data format:", response);
        throw new Error("Invalid hostel data format");
      }

      return hostelArray;
    } catch (error) {
      console.error("Failed to fetch owner hostels:", error);
      throw error;
    }
  }, [user]);

  // Fetch student/warden hostel using optimized API
  const fetchStudentWardenHostel = useCallback(async () => {
    if (!user || !user.hostelId) return null;

    try {
      // Students use their own endpoint that doesn't require hostel_read permission
      if (user.role === "student") {
        const studentHostel = await studentApi.getMyHostel();
        // Convert student hostel to full hostel type with defaults
        return {
          id: studentHostel.id,
          name: studentHostel.name,
          subdomain: studentHostel.subdomain,
          isActive: studentHostel.isActive,
          plan_id: (studentHostel as any).plan_id,
          ownerId: "", // Students don't need owner info
          email: "",
          isPaid: true,
          location: {
            country: "",
            city: "",
            address: "",
          },
          createdAt: "",
          updatedAt: "",
        } as Hostel;
      }

      // For wardens and other roles with hostel_read permission
      const hostel = await hostelApi.getHostelDetails(user.hostelId);
      return hostel;
    } catch (error) {
      console.error(
        "Failed to fetch student/warden/custom role hostel:",
        error
      );
      throw error;
    }
  }, [user]);

  // Initial data loading effect
  useEffect(() => {
    if (!user) {
      console.log("🔄 HostelContext: No user, setting IDLE state");
      setLoadingState(LoadingState.IDLE);
      setCurrentHostel(null);
      setHostels([]);
      return;
    }

    let isMounted = true;
    console.log("🔄 HostelContext: Starting fetch for user role:", user.role);

    const fetchHostels = async () => {
      setLoadingState(LoadingState.LOADING);
      setError(null);

      try {
        let hostelList: Hostel[] = [];

        if (user.role === "owner") {
          console.log("🔄 HostelContext: Fetching owner hostels");
          hostelList = await fetchOwnerHostels();
        } else if (user.role === "student" || user.role === "warden") {
          console.log("🔄 HostelContext: Fetching student/warden hostel");
          const hostel = await fetchStudentWardenHostel();
          if (hostel) {
            hostelList = [hostel];
          }
        } else if (user.hostelId && user.role !== "superadmin") {
          // Handle custom roles (custom_manager, admin, etc.) that have a hostelId
          console.log(
            "🔄 HostelContext: Fetching hostel for custom role:",
            user.role
          );
          const hostel = await fetchStudentWardenHostel(); // Reuse the same logic
          if (hostel) {
            hostelList = [hostel];
          }
        }

        if (isMounted) {
          console.log("🔄 HostelContext: Setting hostels:", hostelList.length);
          setHostels(hostelList);

          // Check for user's activeHostelId first (from token/userData)
          let targetHostelId = user.activeHostelId || user.hostelId;

          // Then check for saved hostel ID in localStorage
          const savedHostelId = localStorage.getItem(
            STORAGE_KEYS.ACTIVE_HOSTEL
          );
          if (!targetHostelId && savedHostelId) {
            targetHostelId = savedHostelId;
          }

          if (targetHostelId) {
            const targetHostel = hostelList.find(
              (h) => h.id === targetHostelId
            );
            if (targetHostel) {
              console.log(
                "🔄 HostelContext: Setting target hostel as current:",
                targetHostel.id
              );
              setCurrentHostel(targetHostel);
              localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, targetHostel.id);
            } else if (hostelList.length > 0) {
              // Fallback to first hostel if target not found
              console.log(
                "🔄 HostelContext: Target hostel not found, setting first hostel as current:",
                hostelList[0].id
              );
              setCurrentHostel(hostelList[0]);
              localStorage.setItem(
                STORAGE_KEYS.ACTIVE_HOSTEL,
                hostelList[0].id
              );
            }
          } else if (hostelList.length > 0) {
            console.log(
              "🔄 HostelContext: Setting first hostel as current:",
              hostelList[0].id
            );
            setCurrentHostel(hostelList[0]);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, hostelList[0].id);
          }

          setLoadingState(LoadingState.LOADED);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          console.error("❌ HostelContext: Failed to fetch hostels:", err);
          setError(errorMessage);
          setLoadingState(LoadingState.ERROR);
          notification.error("Failed to load hostels");
        }
      }
    };

    fetchHostels();

    return () => {
      isMounted = false;
    };
  }, [user, fetchOwnerHostels, fetchStudentWardenHostel]);

  // Handle routing after hostel context is ready
  useEffect(() => {
    if (loadingState === LoadingState.LOADED) {
      console.log(
        "🛣️ HostelContext: Handling routing, hostels:",
        hostels.length,
        "currentHostel:",
        currentHostel?.id
      );

      const currentPath = window.location.pathname;

      if (hostels.length === 0) {
        // Redirect to create hostel if user has no hostels
        console.log(
          "🛣️ HostelContext: No hostels, redirecting to create-hostel"
        );
        if (currentPath !== "/dashboard/create-hostel") {
          router.push("/dashboard/create-hostel");
        }
      } else if (currentHostel) {
        // We have a current hostel selected
        const targetPath = `/dashboard/hostels/${currentHostel.id}`;
        console.log(
          "🛣️ HostelContext: Current hostel exists, target path:",
          targetPath
        );

        // Only redirect if we're on the dashboard root or an incorrect hostel path
        if (
          currentPath === "/dashboard" ||
          (currentPath.includes("/dashboard/hostels/") &&
            !currentPath.includes(currentHostel.id))
        ) {
          console.log("🛣️ HostelContext: Redirecting to target path");
          router.push(targetPath);
        }
      }
    }
  }, [loadingState, hostels, currentHostel, router]);

  // Implementation of HostelContextValue methods
  const setActiveHostel = useCallback(
    async (hostelId: string, syncToServer: boolean = true) => {
      const hostel = hostels.find((h) => h.id === hostelId);
      if (hostel) {
        setCurrentHostel(hostel);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, hostel.id);

        // 🚀 CRITICAL: Navigate to hostel-specific URL
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;

          // If we're on the main dashboard, redirect to hostel-specific dashboard
          if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
            const newPath = `/dashboard/hostels/${hostelId}`;
            router.push(newPath);
          }
          // If we're already on a hostel-specific route, just update the hostelId
          else if (currentPath.includes("/dashboard/hostels/")) {
            const newPath = currentPath.replace(
              /\/dashboard\/hostels\/[^\/]+/,
              `/dashboard/hostels/${hostelId}`
            );
            if (newPath !== currentPath) {
              router.push(newPath);
            }
          }
        }

        // Call API to set active hostel on server (only if explicitly requested and user is authenticated)
        if (syncToServer) {
          try {
            // Only call API if user is authenticated, has a token, and is an owner
            if (typeof window !== "undefined" && user?.role === "owner") {
              const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
              if (token) {
                const response = await authApi.setActiveHostel(hostelId);

                // If the API returns a new token, update it
                if (response?.token) {
                  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
                }
              }
            }
          } catch (error) {
            console.error(
              "❌ HostelContext: Failed to set active hostel on server:",
              error
            );
            // Don't show notification for authentication errors during initial load
            if (
              error instanceof Error &&
              !error.message.includes("Authentication required")
            ) {
              console.warn(
                "Server sync failed, but continuing with local state update"
              );
            }
            // Continue with navigation despite the error
          }
        }
      } else {
        console.warn("⚠️ HostelContext: Hostel not found for ID:", hostelId);
      }
    },
    [hostels, user, router]
  );

  const createHostel = useCallback(
    async (hostelData: CreateHostelData): Promise<Hostel> => {
      try {
        const response = await hostelApi.createHostel(hostelData);
        const newHostel = (response as any).hostel || response;

        // Update local list immediately (optimistic append)
        setHostels((prev) => [...prev, newHostel]);

        // Always set the newly created hostel as current (improves first-hostel UX and immediate navigation)
        setCurrentHostel(newHostel);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, newHostel.id);

        // Attempt to sync active hostel on server & capture potential new token
        try {
          if (user?.role === "owner") {
            const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (authToken) {
              const activeResponse = await authApi.setActiveHostel(
                newHostel.id
              );
              if ((activeResponse as any)?.token) {
                localStorage.setItem(
                  STORAGE_KEYS.AUTH_TOKEN,
                  (activeResponse as any).token
                );
              }
            }
          }
        } catch (syncErr) {
          console.warn(
            "HostelContext: active hostel sync after creation failed (non-blocking):",
            syncErr
          );
        }

        return newHostel;
      } catch (error) {
        console.error("Failed to create hostel:", error);
        throw error;
      }
    },
    [user?.role]
  );

  const updateHostel = useCallback(
    async (hostelId: string, updates: Partial<Hostel>): Promise<Hostel> => {
      try {
        const updatedHostel = await hostelApi.updateHostel(hostelId, updates);

        // Update local state
        setHostels((prev) =>
          prev.map((h) => (h.id === hostelId ? updatedHostel : h))
        );

        // Update current hostel if it's the one being updated
        if (currentHostel?.id === hostelId) {
          setCurrentHostel(updatedHostel);
        }

        return updatedHostel;
      } catch (error) {
        console.error("Failed to update hostel:", error);
        throw error;
      }
    },
    [currentHostel]
  );

  const refreshHostels = useCallback(async () => {
    try {
      if (user?.role === "owner") {
        const hostelList = await fetchOwnerHostels();
        setHostels(hostelList);
      } else if (user?.role === "student" || user?.role === "warden") {
        const hostel = await fetchStudentWardenHostel();
        if (hostel) {
          setHostels([hostel]);
        }
      } else if (user?.hostelId && user?.role !== "superadmin") {
        // Handle custom roles (custom_manager, admin, etc.) that have a hostelId
        const hostel = await fetchStudentWardenHostel(); // Reuse the same logic
        if (hostel) {
          setHostels([hostel]);
        }
      }
    } catch (error) {
      console.error("Failed to refresh hostels:", error);
      throw error;
    }
  }, [user, fetchOwnerHostels, fetchStudentWardenHostel]);

  // Helper method to get current hostel ID for API calls
  const getCurrentHostelId = useCallback((): string | null => {
    if (currentHostel?.id) {
      return currentHostel.id;
    }
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_HOSTEL);
      return savedId;
    }
    return null;
  }, [currentHostel]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      hostels,
      currentHostel,
      loadingState,
      error,
      setCurrentHostel,
      isReady: loadingState === LoadingState.LOADED && currentHostel !== null,
      setActiveHostel,
      refreshHostels,
      createHostel,
      updateHostel,
      isMultiHostelOwner: user?.role === "owner" && hostels.length > 1,
      getCurrentHostelId,
    }),
    [
      hostels,
      currentHostel,
      loadingState,
      error,
      setActiveHostel,
      refreshHostels,
      createHostel,
      updateHostel,
      getCurrentHostelId,
      user?.role,
    ]
  );

  return (
    <HostelContext.Provider value={contextValue}>
      {children}
    </HostelContext.Provider>
  );
};

export const useHostel = () => {
  const context = useContext(HostelContext);
  if (!context) {
    throw new Error("useHostel must be used within a HostelProvider");
  }
  return context;
};

// Custom hook for components that need to wait for hostel to be ready
export const useCurrentHostelId = () => {
  const { currentHostel, isReady } = useHostel();

  if (!isReady) return null;
  return currentHostel?.id || null;
};
