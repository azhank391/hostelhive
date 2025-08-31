"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/http';
import { notification } from '../lib/toast';
import { STORAGE_KEYS } from '../lib/config';
import type { 
  Hostel, 
  HostelContextValue,
  CreateHostelData 
} from '../lib/types';

enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading', 
  LOADED = 'loaded',
  ERROR = 'error'
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
  getCurrentHostelIdWithUrlFallback: () => string | null;
}

const HostelContext = createContext<HostelContextType | null>(null);

export const HostelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [currentHostel, setCurrentHostel] = useState<Hostel | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const didFetchOnce = useRef(false);
  const isChangingHostel = useRef(false); // 🚀 NEW: Flag to prevent URL sync conflicts

  // 🚀 DEBUG: Track provider creation
  useEffect(() => {
    console.log('🏗️ HostelProvider: Provider created/updated');
  });

  // 🚀 DEBUG: Wrap setCurrentHostel to track state changes
  const setCurrentHostelWithLog = useCallback((hostel: Hostel | null) => {
    console.log('🔄 HostelContext.setCurrentHostel called with:', hostel?.id, 'Type:', typeof hostel?.id);
    setCurrentHostel(hostel);
  }, []);

  // Fetch owner hostels using optimized API
  const fetchOwnerHostels = useCallback(async (): Promise<Hostel[]> => {
    try {
      const response = await api.get<{ hostels: Hostel[] }>('/auth/hostels');
      // Handle both array and object response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object' && 'hostels' in response.data) {
        return (response.data as any).hostels || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch owner hostels:', error);
      return [];
    }
  }, []);

  // Fetch student/warden hostel using optimized API
  const fetchStudentWardenHostel = useCallback(async () => {
    if (!user || (user.role !== 'student' && user.role !== 'warden') || !user.hostelId) {
      console.log('🔍 DEBUG: fetchStudentWardenHostel - User validation failed:', {
        user: user ? { id: user.id, role: user.role, hostelId: user.hostelId } : null,
        hasUser: !!user,
        isCorrectRole: user ? (user.role === 'student' || user.role === 'warden') : false,
        hasHostelId: user ? !!user.hostelId : false
      });
      return null;
    }
    
    try {
      console.log('🔍 DEBUG: fetchStudentWardenHostel - Attempting to fetch hostel for:', {
        userId: user.id,
        userRole: user.role,
        hostelId: user.hostelId,
        authToken: localStorage.getItem('authToken') ? 'Present' : 'Missing'
      });
      
      // For students/wardens, use the getUserHostels endpoint which returns their assigned hostel
      const response = await api.get<{ hostels: Hostel[], userRole: string }>('/hostels');
      console.log('🔍 DEBUG: fetchStudentWardenHostel - API response:', response.data);
      
      // The response contains an array of hostels, but wardens/students only have one
      return response.data.hostels[0] || null;
    } catch (error) {
      console.error('❌ DEBUG: fetchStudentWardenHostel - Error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data,
        userHostelId: user.hostelId,
        requestUrl: '/hostels'
      });
      
      // Fallback: Create a minimal hostel object from user data to prevent dashboard from breaking
      console.log('🔍 DEBUG: fetchStudentWardenHostel - Creating fallback hostel object');
      const fallbackHostel: Hostel = {
        id: user.hostelId,
        name: 'Your Hostel', // Generic name since we don't have the actual data
        subdomain: '',
        plan: 'basic',
        isActive: true,
        ownerId: '', // We don't know the owner ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('🔍 DEBUG: fetchStudentWardenHostel - Fallback hostel created:', fallbackHostel);
      return fallbackHostel;
    }
  }, [user?.id, user?.role, user?.hostelId]); // Only depend on specific user properties, not the entire user object

  // Fetch hostels once when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // if logged_out, allow future fetch after re-login
      didFetchOnce.current = false;
      return;
    }
    
    // 🚀 NEW: Skip hostel fetching for superadmin users
    if (user?.role === 'superadmin') {
      console.log('🔍 DEBUG: HostelContext - Skipping hostel fetch for superadmin user');
      setLoadingState(LoadingState.LOADED);
      setHostels([]);
      setCurrentHostel(null);
      return;
    }
    
    if (didFetchOnce.current) return;
    didFetchOnce.current = true;

    (async () => {
      try {
        setLoadingState(LoadingState.LOADING);
        setError(null);
        
        let hostelList: Hostel[] = [];
        
        if (user?.role === 'owner') {
          hostelList = await fetchOwnerHostels();
        } else if (user?.role === 'warden' || user?.role === 'student') {
          const hostel = await fetchStudentWardenHostel();
          if (hostel) {
            hostelList = [hostel];
          }
        }
        
        setHostels(hostelList);
        setLoadingState(LoadingState.LOADED);
        
        // 🚀 ENHANCED: Owner-specific hostel selection logic
        if (user?.role === 'owner') {
          if (hostelList.length === 0) {
            // No hostels - redirect to create hostel page
            setCurrentHostel(null);
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
            router.replace('/dashboard/create-hostel');
          } else if (hostelList.length === 1) {
            // Single hostel - auto-select and redirect
            const singleHostel = hostelList[0];
            setCurrentHostel(singleHostel);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, singleHostel.id);
            router.replace(`/dashboard/hostels/${singleHostel.id}`);
          } else {
            // Multiple hostels - check for previously selected hostel
            const savedHostelId = localStorage.getItem(STORAGE_KEYS.ACTIVE_HOSTEL);
            const savedHostel = savedHostelId ? hostelList.find(h => h.id === savedHostelId) : null;
            
            if (savedHostel) {
              // Use previously selected hostel
              setCurrentHostel(savedHostel);
              router.replace(`/dashboard/hostels/${savedHostel.id}`);
            } else {
              // Default to first hostel and show selector
              const firstHostel = hostelList[0];
              setCurrentHostel(firstHostel);
              localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, firstHostel.id);
              router.replace(`/dashboard/hostels/${firstHostel.id}`);
            }
          }
        } else {
          // For wardens/students - single hostel auto-selection
          const chosen = hostelList[0]?.id ?? null;
          if (chosen) {
            const chosenHostel = hostelList.find(h => h.id === chosen);
            if (chosenHostel) {
              setCurrentHostel(chosenHostel);
              localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, chosen);
            }
          }
        }
      } catch (e) {
        // Do not mutate auth here; just surface/log
        console.error('Failed to fetch hostels:', e);
        setError(e instanceof Error ? e.message : 'Failed to fetch hostels');
        setLoadingState(LoadingState.ERROR);
      }
    })();
  }, [isAuthenticated, user?.role, user?.hostelId, fetchOwnerHostels, router]); // Removed fetchStudentWardenHostel from dependencies

  // Implementation of HostelContextValue methods
  const setActiveHostel = useCallback(async (hostelId: string, syncToServer: boolean = true) => {
    console.log('🎯 HostelContext.setActiveHostel called with:', hostelId, 'Type:', typeof hostelId);
    console.log('🎯 HostelContext.setActiveHostel - Current hostel before update:', currentHostel?.id, 'Type:', typeof currentHostel?.id);
    
    const hostel = hostels.find(h => h.id === hostelId);
    if (hostel) {
      // 🚀 NEW: Set flag to prevent URL sync conflicts
      isChangingHostel.current = true;
      setCurrentHostelWithLog(hostel);
      
      // 🚀 NEW: Reset flag after a short delay to allow navigation to complete
      setTimeout(() => {
        isChangingHostel.current = false;
      }, 100);
      
      console.log('🔄 HostelContext.setActiveHostel - State update triggered for hostel:', hostel.id);
      
      // 🚀 CRITICAL: Navigate to hostel-specific URL (matches backend structure)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        
        // If we're on the main dashboard, redirect to hostel-specific dashboard
        if (currentPath === '/dashboard' || currentPath === '/dashboard/') {
          const newPath = `/dashboard/hostels/${hostelId}`;
          router.push(newPath);
        }
        // If we're already on a hostel-specific route, just update the hostelId
        else if (currentPath.includes('/dashboard/hostels/')) {
          const newPath = currentPath.replace(/\/dashboard\/hostels\/[^\/]+/, `/dashboard/hostels/${hostelId}`);
          if (newPath !== currentPath) {
            router.push(newPath);
          }
        }
        // If we're on any other dashboard route, redirect to hostel dashboard
        else if (currentPath.includes('/dashboard/')) {
          router.push(`/dashboard/hostels/${hostelId}`);
        }
      }
      
      // Call API to set active hostel on server (only if explicitly requested and user is authenticated)
      if (syncToServer) {
        try {
          // Only call API if user is authenticated, has a token, and is an owner
          if (typeof window !== 'undefined' && user?.role === 'owner') {
                          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
              if (token) {
                console.log('🔄 HostelContext.setActiveHostel - Syncing to server...');
                // Include hostelId in both query params and body for backend compatibility
              const response = await api.post(`/auth/set-active-hostel?hostelId=${hostelId}`, { 
                hostelId,
                userId: user.id 
              });
              
                              // If the API returns a new token, update it
                if (response.data?.token) {
                  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
                }
                console.log('✅ HostelContext.setActiveHostel - Server sync completed');
            }
          }
        } catch (error) {
          console.error('❌ HostelContext: Failed to set active hostel on server:', error);
          // Don't show notification for authentication errors during initial load
          if (error instanceof Error && !error.message.includes('Authentication required')) {
            console.warn('Server sync failed, but continuing with local state update');
          }
          // Continue with navigation despite the error
        }
      }
    } else {
      console.warn('⚠️ HostelContext: Hostel not found for ID:', hostelId);
    }
  }, [hostels, user, router]);

  // 🚀 NEW: Effect to sync localStorage when currentHostel changes
  useEffect(() => {
    if (currentHostel?.id && typeof window !== 'undefined') {
      console.log('💾 HostelContext: Syncing to localStorage:', currentHostel.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, currentHostel.id);
    }
  }, [currentHostel?.id]);

  // 🚀 URL Sync: Ensure context matches URL when navigating directly
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated && user && hostels.length > 0 && loadingState === LoadingState.LOADED) {
      const currentPath = window.location.pathname;
      const hostelMatch = currentPath.match(/\/dashboard\/hostels\/([^\/]+)/);
      
      if (hostelMatch) {
        const urlHostelId = hostelMatch[1];
        const isValidHostel = hostels.some(h => h.id === urlHostelId);
        
        if (isValidHostel && currentHostel?.id !== urlHostelId && !isChangingHostel.current) {
          // Sync context with valid URL hostel ID (no navigation needed)
          // Only run if we're not actively changing hostels
          console.log('🔄 HostelContext: URL sync - syncing context with URL hostel:', urlHostelId);
          const hostel = hostels.find(h => h.id === urlHostelId);
          if (hostel) {
            setCurrentHostelWithLog(hostel);
          }
        } else if (!isValidHostel && hostels.length > 0) {
          // Invalid hostel in URL, redirect to first available hostel
          const firstHostel = hostels[0];
          setCurrentHostelWithLog(firstHostel);
          router.replace(`/dashboard/hostels/${firstHostel.id}`);
        }
      } else if (currentPath === '/dashboard' && hostels.length > 0 && !currentHostel) {
        // On main dashboard without hostel selected, auto-select first hostel
        const firstHostel = hostels[0];
        setCurrentHostelWithLog(firstHostel);
        router.replace(`/dashboard/hostels/${firstHostel.id}`);
      }
    }
  }, [isAuthenticated, user, hostels, currentHostel, loadingState, router]);

  const createHostel = useCallback(async (hostelData: CreateHostelData): Promise<Hostel> => {
    try {
      const response = await api.post<Hostel>('/hostels', hostelData);
      const newHostel = response.data;
      
      // Update local state
      setHostels(prev => [...prev, newHostel]);
      
      // If this is the first hostel, auto-select it
      if (hostels.length === 0) {
        setCurrentHostel(newHostel);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, newHostel.id);
      }
      
      return newHostel;
    } catch (error) {
      console.error('Failed to create hostel:', error);
      throw error;
    }
  }, [hostels.length]);

  const updateHostel = useCallback(async (hostelId: string, updates: Partial<Hostel>): Promise<Hostel> => {
    try {
      const response = await api.put<Hostel>(`/hostels/${hostelId}`, updates);
      const updatedHostel = response.data;
      
      // Update local state
      setHostels(prev => prev.map(h => h.id === hostelId ? updatedHostel : h));
      
      // Update current hostel if it's the one being updated
      if (currentHostel?.id === hostelId) {
        setCurrentHostel(updatedHostel);
      }
      
      return updatedHostel;
    } catch (error) {
      console.error('Failed to update hostel:', error);
      throw error;
    }
  }, [currentHostel]);

  const refreshHostels = useCallback(async () => {
    if (user?.role === 'owner') {
      const hostelList = await fetchOwnerHostels();
      setHostels(hostelList);
    } else if (user?.role === 'student' || user?.role === 'warden') {
      const hostel = await fetchStudentWardenHostel();
      if (hostel) {
        setHostels([hostel]);
      }
    }
  }, [user, fetchOwnerHostels, fetchStudentWardenHostel]);

  // Helper method to get current hostel ID for API calls
  const getCurrentHostelId = useCallback((): string | null => {
    if (currentHostel?.id) {
      return currentHostel.id;
    }
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_HOSTEL);
      return savedId;
    }
    return null;
  }, [currentHostel]);

  // 🚀 NEW: Enhanced method to get hostel ID with URL fallback
  const getCurrentHostelIdWithUrlFallback = useCallback((): string | null => {
    // First try to get from context
    const contextId = getCurrentHostelId();
    if (contextId) return contextId;
    
    // Only fallback to URL if hostels are loaded and we have a valid context
    if (loadingState === LoadingState.LOADED && hostels.length > 0) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const hostelMatch = currentPath.match(/\/dashboard\/hostels\/([^\/]+)/);
        if (hostelMatch) {
          const urlHostelId = hostelMatch[1];
          // Only return URL hostel ID if it exists in the user's hostels
          const isValidHostel = hostels.some(h => h.id === urlHostelId);
          if (isValidHostel) {
            return urlHostelId;
          }
        }
      }
    }
    
    return null;
  }, [getCurrentHostelId, hostels, loadingState]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    const computedIsReady = loadingState === LoadingState.LOADED && (user?.role === 'superadmin' || currentHostel !== null);
    
    console.log('🔄 HostelContext: Context value updated, currentHostel:', currentHostel?.id);
    console.log('🔍 DEBUG: HostelContext isReady computation:', {
      loadingState,
      userRole: user?.role,
      currentHostel: currentHostel?.id,
      computedIsReady
    });
    
    return {
    hostels,
    currentHostel,
    loadingState,
    error,
    setCurrentHostel: setCurrentHostelWithLog,
    isReady: computedIsReady,
    setActiveHostel,
    refreshHostels,
    createHostel,
    updateHostel,
    isMultiHostelOwner: hostels.length > 1,
    getCurrentHostelId,
    getCurrentHostelIdWithUrlFallback,
    };
  }, [hostels, currentHostel, loadingState, error, setActiveHostel, refreshHostels, createHostel, updateHostel, getCurrentHostelId, getCurrentHostelIdWithUrlFallback, user?.role]);

  return (
    <HostelContext.Provider value={contextValue}>
      {children}
    </HostelContext.Provider>
  );
};

export const useHostel = () => {
  const context = useContext(HostelContext);
  if (!context) {
    throw new Error('useHostel must be used within a HostelProvider');
  }
  return context;
};

// Custom hook for components that need to wait for hostel to be ready
export const useCurrentHostelId = () => {
  const { currentHostel, isReady, getCurrentHostelIdWithUrlFallback } = useHostel();
  
  if (!isReady) {
    // Even if not ready, try to get hostel ID from URL as fallback
    return getCurrentHostelIdWithUrlFallback();
  }
  return currentHostel?.id || null;
};
