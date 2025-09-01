'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { notification, apiNotification } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/config';
import { setOnUnauthorized } from '@/lib/http';
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
  const [isLoggingIn, setIsLoggingIn] = useState(false); // 🚀 NEW: Flag to prevent useEffect during login
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

    
    try {
      // Decode JWT token to get user data
      const payload = JSON.parse(atob(token.split('.')[1]))

      
      if (payload.exp * 1000 < Date.now()) {
        // Token expired

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

      
      // Try to restore user data from localStorage first
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA)

      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)

          
          // Verify the stored user data matches the token
          if (userData.id === payload.id) {

            setUser(userData)
            setIsLoading(false)
            return
          } else {

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

          // Update with latest token data
          userData.token = token
          userData.hostelId = payload.hostelId
          userData.activeHostelId = payload.hostelId
        } catch {

                  // If parsing fails, create new user data
        userData = {
          id: payload.id,
          name: payload.name,
          email: 'user@example.com', // Fallback email
          role: payload.role,
          hostelId: payload.hostelId,
          isActive: true,
          requiresPasswordChange: payload.requiresPasswordChange || false,
          token,
          activeHostelId: payload.hostelId
        }
        }
      } else {

                  // Create new user data from payload
          userData = {
            id: payload.id,
            name: payload.name,
            email: 'user@example.com', // Fallback email
            role: payload.role,
            hostelId: payload.hostelId,
            isActive: true,
            requiresPasswordChange: payload.requiresPasswordChange || false,
            token,
            activeHostelId: payload.hostelId
          }
      }
      

      setUser(userData)
      
      // Store in localStorage for future use
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))

      
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
    // Set up the unauthorized callback for the HTTP client
    setOnUnauthorized(() => {

      logout();
    });

    // 🚀 NEW: Don't run if we're currently logging in
    if (isLoggingIn) {

      return;
    }

    // Don't run if we already have a user
    if (user) {

      setIsLoading(false);
      return;
    }
    

    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)

    
    if (storedToken) {

      verifyToken(storedToken)
    } else {

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

            // Call logout directly
            setUser(null);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
            router.push('/auth/login');
          }
        } catch {
          // Invalid token, logout automatically

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
  }, [router, isLoggingIn]) // Add router and isLoggingIn dependencies

  const login = async (credentials: LoginCredentials) => {
    const { email, password } = credentials;
    
    // 🚀 NEW: Set flag to prevent useEffect interference
    setIsLoggingIn(true);
    
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

        
        // Create user data from response with proper typing
        const userData: AuthUser = {
          id: payload.id,
          name: data.name,
          email: email, // Use the email from the login form
          role: data.role as 'owner' | 'admin' | 'warden' | 'student' | 'superadmin', // Allow any role value
          hostelId: data.hostelId,
          isActive: true,
          requiresPasswordChange: payload.requiresPasswordChange || false,
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
        

        
        // Store user data in localStorage for persistence
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        
        setUser(userData)
        
        // 🚀 NEW: Reset flag after successful login
        setIsLoggingIn(false);
        
        return data;
      } catch (userLoginError) {
        // Log the error for debugging
        console.error('❌ AuthContext: User login failed:', userLoginError);
        console.error('❌ AuthContext: Error details:', {
          message: userLoginError instanceof Error ? userLoginError.message : 'Unknown error',
          stack: userLoginError instanceof Error ? userLoginError.stack : undefined,
          error: userLoginError
        });
        
        // For now, just throw the original error without superadmin fallback
        // This will help us debug what's actually failing in regular user login
        throw userLoginError;
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      // 🚀 NEW: Reset flag on error
      setIsLoggingIn(false);
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
