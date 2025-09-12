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
  verifyToken: (token: string) => Promise<void>;
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
      // Clear all user-specific data
      if (user?.id) {
        localStorage.removeItem(`${STORAGE_KEYS.USER_DATA}_${user.id}`);
      }
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }, [user?.id]);

  const logout = useCallback(() => {
    // Clear user-specific data if user exists
    if (user?.id) {
      const userDataKey = `${STORAGE_KEYS.USER_DATA}_${user.id}`;
      localStorage.removeItem(userDataKey);
    }
    
    setUser(null);
    clearToken();
    // Clear hostel selection from localStorage
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
    router.push('/auth/login');
  }, [router, clearToken, user?.id]);

  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    setUser(current => current ? { ...current, ...userData } : null);
    
    // Update localStorage if user exists
    if (user && typeof window !== 'undefined') {
      const updatedUser = { ...user, ...userData };
      const userDataKey = `${STORAGE_KEYS.USER_DATA}_${user.id}`;
      localStorage.setItem(userDataKey, JSON.stringify(updatedUser));
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
        logout()
        return
      }
      
      setToken(token)
      
      // Try to restore user data from localStorage first
      const userDataKey = `${STORAGE_KEYS.USER_DATA}_${payload.id}`;
      const storedUser = localStorage.getItem(userDataKey)
      
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        
        // Verify the stored user data matches the token
        if (userData.id === payload.id) {
          // Update permissions from token (they might have changed)
          userData.permissions = payload.permissions || []
          userData.requiresPasswordChange = payload.requiresPasswordChange || false // Update from token
          userData.token = token
          
          setUser(userData)
          
          // Update localStorage with fresh data using user-specific key
          localStorage.setItem(userDataKey, JSON.stringify(userData))
          setIsLoading(false)
          return
        }
      }
      
      // Fallback to creating user data from token payload
      const currentActiveHostel = localStorage.getItem(STORAGE_KEYS.ACTIVE_HOSTEL)
      const userData: AuthUser = {
        id: payload.id,
        name: payload.name,
        email: payload.email || 'user@example.com', // Fallback email
        role: payload.role,
        hostelId: payload.hostelId,
        isActive: true,
        token,
        activeHostelId: currentActiveHostel || payload.hostelId,
        permissions: payload.permissions || [], // Extract permissions from token
        requiresPasswordChange: payload.requiresPasswordChange || false // Extract from token
      }
      
      setUser(userData)
      
      // Store in localStorage for future use with user-specific key
      localStorage.setItem(userDataKey, JSON.stringify(userData));
      
      // Set active hostel if user has a hostelId (for custom roles, wardens, students)
      if (payload.hostelId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, payload.hostelId);
      }
      
    } catch (error) {
      console.error('AuthContext: Error in verifyToken:', error);
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [logout, setToken])

  useEffect(() => {
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
            logout()
          }
        } catch {
          logout()
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [verifyToken, logout])

  const login = async (credentials: LoginCredentials) => {
    const { email, password } = credentials;
    
    // Clear any previous hostel selection from localStorage
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_HOSTEL);
    
    try {
      // Try standard user login first
      try {
        console.log('🔍 AuthContext: Attempting standard user login');
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
          token: data.token,
          activeHostelId: data.hostelId,
          permissions: payload.permissions || [] // Extract permissions from token
        }
        
        setUser(userData)
        
        // Store user data in localStorage for persistence using user-specific key
        const userDataKey = `${STORAGE_KEYS.USER_DATA}_${payload.id}`;
        localStorage.setItem(userDataKey, JSON.stringify(userData))
        
        // Set active hostel if user has a hostelId (for custom roles, wardens, students)
        if (data.hostelId || payload.hostelId) {
          const hostelId = data.hostelId || payload.hostelId;
          localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSTEL, hostelId);
          console.log('🔄 AuthContext: Set active hostel for user:', hostelId);
        }
        
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
          
          // Create superadmin user data
          const userData: AuthUser = {
            id: payload.id,
            name: superadminData.superadmin.name,
            email: email,
            role: 'superadmin', // Explicitly set role to superadmin
            isActive: true,
            token: superadminData.token
          }
          
          setUser(userData)
          
          // Store superadmin data in localStorage with user-specific key
          const userDataKey = `${STORAGE_KEYS.USER_DATA}_${userData.id}`;
          localStorage.setItem(userDataKey, JSON.stringify(userData))
          
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
      clearToken,
      verifyToken 
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
