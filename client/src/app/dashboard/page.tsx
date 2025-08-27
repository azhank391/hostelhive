'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useHostel } from '@/context/HostelContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { currentHostel, hostels, loadingState, isReady } = useHostel()
  const router = useRouter()

  const handleOwnerRedirect = () => {
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

  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading || !user) {
      if (!isLoading && !user) {
        router.push('/auth/login?error=unauthorized');
      }
      return;
    }

    const role = user.role;
    
    // Route based on user role
    switch (role) {
      case 'superadmin':
        router.push('/dashboard/superadmin');
        break;
        
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
  }, [user, isLoading, router, currentHostel, hostels, loadingState, isReady]);

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
