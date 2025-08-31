'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useHostel } from '@/context/HostelContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { currentHostel, hostels, loadingState, isReady } = useHostel()
  const router = useRouter()

  // Skip hostel logic for superadmin users
  const shouldSkipHostelLogic = user?.role === 'superadmin';

  // Debug logging
  console.log('🔍 DEBUG: DashboardPage render', {
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    isLoading,
    currentHostel: currentHostel?.id,
    hostelsCount: hostels.length,
    loadingState,
    isReady,
    shouldSkipHostelLogic
  });

  // 🚀 NEW: Immediate debug log for superadmin routing
  if (user?.role === 'superadmin' && !isLoading) {
    console.log('🚀 DEBUG: Superadmin detected in render, should route immediately');
  }

  const handleOwnerRedirect = () => {
    // Skip for superadmin users
    if (shouldSkipHostelLogic) {
      console.log('🔍 DEBUG: Skipping hostel redirect for superadmin user');
      return;
    }

    // Wait for hostel data to be fully loaded
    if (loadingState === 'loading' || !isReady) {
      return;
    }

    // 🚀 ENHANCED: Comprehensive owner hostel logic
    if (hostels.length === 0) {
      // No hostels - redirect to create hostel form
      router.push('/dashboard/create-hostel');
      return;
    }
    
    if (hostels.length === 1) {
      // Single hostel - auto-select and redirect to hostel dashboard
      const singleHostel = hostels[0];
      router.push(`/dashboard/hostels/${singleHostel.id}`);
      return;
    }
    
    // Multiple hostels (2+)
    if (currentHostel) {
      // Hostel already selected - redirect to its dashboard
      router.push(`/dashboard/hostels/${currentHostel.id}`);
      return;
    } else {
      // No current hostel selected - redirect to first hostel (selector will be shown)
      router.push(`/dashboard/hostels/${hostels[0].id}`);
      return;
    }
  }

  // 🚀 NEW: Debug log before useEffect
  console.log('🔍 DEBUG: DashboardPage - About to define useEffect, user role:', user?.role);

  useEffect(() => {
    console.log('🔍 DEBUG: Dashboard routing effect triggered', {
      isLoading,
      user: user ? { id: user.id, name: user.name, role: user.role } : null,
      currentHostel: currentHostel?.id,
      hostelsCount: hostels.length,
      loadingState,
      isReady,
      shouldSkipHostelLogic
    });

    // Wait for authentication to complete
    if (isLoading || !user) {
      if (!isLoading && !user) {
        console.log('🔍 DEBUG: No user, redirecting to login');
        router.push('/auth/login?error=unauthorized');
      }
      return;
    }

    const role = user.role;
    console.log('🔍 DEBUG: User authenticated, role:', role);
    
    // 🚀 NEW: For superadmin users, route immediately without waiting for hostel data
    if (role === 'superadmin') {
      console.log('🔍 DEBUG: Routing superadmin to /dashboard/superadmin (immediate)');
      router.push('/dashboard/superadmin');
      return;
    }
    
    // Route based on user role
    switch (role) {
      case 'student':
        router.push('/dashboard/student');
        break;
        
      case 'warden':
        router.push('/dashboard/warden');
        break;
        
      case 'owner':
        // For owners, wait for hostel data to load before routing
        if (isReady) {
          handleOwnerRedirect();
        }
        break;
        
      case 'admin':
        // Legacy support
        router.push('/dashboard/superadmin');
        break;
        
      default:
        console.warn(`Unknown user role: ${role}, defaulting to student dashboard`);
        router.push('/dashboard/student');
    }
  }, [user, isLoading, router, currentHostel, hostels, loadingState, isReady, handleOwnerRedirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="text-xl font-medium text-gray-900 mt-4">
          {isLoading ? 'Verifying your account...' : 'Redirecting to dashboard...'}
        </h2>
        <p className="mt-2 text-gray-600">
          {isLoading 
            ? 'Please wait while we load your profile information.' 
            : `Welcome${user?.name ? ` ${user.name}` : ''}! Taking you to your personalized dashboard.`}
        </p>
      </div>
    </div>
  )
}
