'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { notification, apiNotification } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/config';
// Removed hostel-storage import - using direct localStorage access
import type { 
  AuthUser, 
  LoginCredentials, 
  AuthContextValue 
} from '@/lib/types';

// Enhanced AuthContext interface matching our types.ts
interface AuthContextType extends AuthContextValue {
  setToken: (token: string) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Computed property for authentication status
  const isAuthenticated = !!user;

  const setToken = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  }, []);

  const clearToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearToken();
    // Clear hostel selection from localStorage
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
    router.push('/auth/login');
  }, [router, clearToken]);

  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    setUser(current => current ? { ...current, ...userData } : null);
    
    // Update localStorage if user exists
    if (user && typeof window !== 'undefined') {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    // Implementation would depend on having a "me" endpoint
    // For now, this is a placeholder
    return Promise.resolve();
  }, []);

  const verifyToken = useCallback(async (token: string) => {
    console.log('🔍 DEBUG: verifyToken called with token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    try {
      // Decode JWT token to get user data
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('🔍 DEBUG: verifyToken - decoded payload:', payload);
      
      if (payload.exp * 1000 < Date.now()) {
        // Token expired
        console.log('🔍 DEBUG: verifyToken - token expired, logging out');
        // Call logout directly instead of depending on it
        setUser(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
        router.push('/auth/login');
        return
      }
      
      // Set token directly instead of depending on setToken
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      }
      console.log('🔍 DEBUG: verifyToken - token set successfully');
      
      // Try to restore user data from localStorage first
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      console.log('🔍 DEBUG: verifyToken - stored user data:', storedUser ? 'found' : 'not found');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('🔍 DEBUG: verifyToken - parsed stored user data:', userData);
          
          // Verify the stored user data matches the token
          if (userData.id === payload.id) {
            console.log('🔍 DEBUG: verifyToken - stored user data matches token, setting user');
            setUser(userData)
            setIsLoading(false)
            return
          } else {
            console.log('🔍 DEBUG: verifyToken - stored user ID does not match token ID:', userData.id, 'vs', payload.id);
          }
        } catch (parseError) {
          console.warn('Failed to parse stored user data:', parseError)
          // Continue to fallback
        }
      }
      
      // Fallback to creating user data from token payload
      // Use the stored user data if available, otherwise create from payload
      let userData: AuthUser;
      
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser)
          console.log('🔍 DEBUG: verifyToken - using stored user data as base');
          // Update with latest token data
          userData.token = token
          userData.hostelId = payload.hostelId
          userData.activeHostelId = payload.hostelId
        } catch {
          console.log('🔍 DEBUG: verifyToken - failed to parse stored user, creating new user data');
          // If parsing fails, create new user data
          userData = {
            id: payload.id,
            name: payload.name,
            email: 'user@example.com', // Fallback email
            role: payload.role,
            hostelId: payload.hostelId,
            isActive: true,
            token,
            activeHostelId: payload.hostelId
          }
        }
      } else {
        console.log('🔍 DEBUG: verifyToken - no stored user data, creating new user data from payload');
        // Create new user data from payload
        userData = {
          id: payload.id,
          name: payload.name,
          email: 'user@example.com', // Fallback email
          role: payload.role,
          hostelId: payload.hostelId,
          isActive: true,
          token,
          activeHostelId: payload.hostelId
        }
      }
      
      console.log('🔍 DEBUG: verifyToken - Created user data from payload:', userData);
      setUser(userData)
      
      // Store in localStorage for future use
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
      console.log('🔍 DEBUG: verifyToken - User data stored in localStorage');
      
    } catch (error) {
      console.error('❌ AuthContext: Error in verifyToken:', error);
      // Don't logout immediately on error, just set loading to false
      // This prevents the token from being cleared unnecessarily
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  }, [router]) // Only depend on router

  useEffect(() => {
    // Don't run if we already have a user
    if (user) {
      console.log('🔍 DEBUG: AuthContext useEffect - user already authenticated, skipping token check');
      setIsLoading(false);
      return;
    }
    
    console.log('🔍 DEBUG: AuthContext useEffect - checking for stored token');
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    console.log('🔍 DEBUG: AuthContext useEffect - stored token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'null');
    
    if (storedToken) {
      console.log('🔍 DEBUG: AuthContext useEffect - calling verifyToken');
      verifyToken(storedToken)
    } else {
      console.log('🔍 DEBUG: AuthContext useEffect - no stored token, setting loading to false');
      setIsLoading(false)
    }

    // Set up periodic token validation (check every 5 minutes)
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]))
          if (payload.exp * 1000 < Date.now()) {
            // Token expired, logout automatically
            console.log('🔍 DEBUG: AuthContext interval - token expired, logging out');
            // Call logout directly
            setUser(null);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
            router.push('/auth/login');
          }
        } catch {
          // Invalid token, logout automatically
          console.log('🔍 DEBUG: AuthContext interval - invalid token, logging out');
          // Call logout directly
          setUser(null);
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
          router.push('/auth/login');
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [router]) // Add router dependency since it's used in the interval

  const login = async (credentials: LoginCredentials) => {
    const { email, password } = credentials;
    
    // Clear any previous hostel selection from localStorage
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
    
    try {
      // Try standard user login first
      try {
        // Use our enhanced API with proper error handling
        const data = await authApi.login(credentials) as {
          token: string;
          name: string;
          role: string;
          hostelId?: string;
          profilePicture?: string;
        };
        
        // Show success notification
        notification.success('Welcome Back!', {
          description: `Successfully signed in as ${data.name}`
        });
        
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token)
        
        setToken(data.token)
        
        // Decode JWT token to get user ID and other data
        const payload = JSON.parse(atob(data.token.split('.')[1]))
        console.log('🔍 DEBUG: Login - Token payload:', payload);
        console.log('🔍 DEBUG: Login - Response data:', data);
        
        // Create user data from response with proper typing
        const userData: AuthUser = {
          id: payload.id,
          name: data.name,
          email: email, // Use the email from the login form
          role: data.role as 'owner' | 'admin' | 'warden' | 'student' | 'superadmin', // Allow any role value
          hostelId: data.hostelId,
          isActive: true,
          token: data.token,
          activeHostelId: data.hostelId
        }
        
        // Handle owner with multiple hostels
        if (data.role === 'owner' && payload.ownedHostels && Array.isArray(payload.ownedHostels)) {
          userData.hostels = payload.ownedHostels;
          
          // If only one hostel, auto-select it
          if (payload.ownedHostels.length === 1) {
            const firstHostel = payload.ownedHostels[0];
            userData.hostelId = firstHostel.id;
            userData.activeHostelId = firstHostel.id;
            
            // Store the selected hostel in localStorage
            localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, firstHostel.id);
          }
        }
        
        console.log('🔍 DEBUG: Login - Created user data:', userData);
        
        // Store user data in localStorage for persistence
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        
        console.log('🔍 DEBUG: Login - User data stored in localStorage, setting user state');
        setUser(userData)
        console.log('🔍 DEBUG: Login - User state set, login process complete');
        
        return data;
      } catch (userLoginError) {
        // If standard user login fails, try superadmin login
        console.log('Standard login failed, attempting superadmin login...');
        
        try {
          const { superadminApi } = await import('@/lib/api');
          const superadminData = await superadminApi.login({ email, password }) as {
            token: string;
            superadmin: {
              name: string;
              email: string;
            }
          };
          
          // Show success notification for superadmin
          notification.success('Welcome Back, Superadmin!', {
            description: `Successfully signed in as ${superadminData.superadmin.name}`
          });
          
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, superadminData.token)
          
          setToken(superadminData.token)
          
          // Decode JWT token to get superadmin ID and data
          const payload = JSON.parse(atob(superadminData.token.split('.')[1]))
          console.log('🔍 DEBUG: Superadmin Login - Token payload:', payload);
          
          // Create superadmin user data
          const userData: AuthUser = {
            id: payload.id,
            name: superadminData.superadmin.name,
            email: email,
            role: 'superadmin', // Explicitly set role to superadmin
            isActive: true,
            token: superadminData.token
          }
          console.log('🔍 DEBUG: Superadmin Login - Created user data:', userData);
          
          setUser(userData)
          
          // Store superadmin data in localStorage
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
          
          return superadminData;
        } catch (superadminLoginError) {
          console.error('❌ AuthContext: All login attempts failed:', superadminLoginError);
          throw superadminLoginError;
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      // Error handling is now done by our enhanced HTTP client
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading, 
      login, 
      logout, 
      updateUser,
      refreshUser,
      setToken, 
      clearToken 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
