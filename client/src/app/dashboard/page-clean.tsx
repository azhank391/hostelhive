'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';

/**
 * 🎯 INTELLIGENT DASHBOARD LANDING COMPONENT
 * 
 * This component determines where users should land based on their role and permissions
 * without forcing dashboard access for users who don't need it.
 */

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { currentHostel, hostels, loadingState, isReady } = useHostel();

  const handleOwnerRedirect = () => {
    console.log('🔍 Dashboard: handleOwnerRedirect called with:', {
      loadingState,
      isReady,
      hostelsCount: hostels.length,
      currentHostel: currentHostel ? { id: currentHostel.id, name: currentHostel.name } : 'None'
    });

    // Wait for hostel data to load
    if (loadingState === 'loading') {
      console.log('⏳ Dashboard: Waiting for hostel data to load...');
      return;
    }

    // If owner has hostels
    if (hostels.length > 0) {
      console.log('✅ Dashboard: Owner has hostels, processing routing...');
      
      // If a hostel is already selected, check for permissions and redirect appropriately
      if (currentHostel) {
        console.log('🎯 Dashboard: Current hostel selected, checking permissions...');
        
        // If user has specific permissions, redirect to first available section
        if (user?.permissions && user.permissions.length > 0) {
          const permissions = user.permissions;
          console.log('🔐 User permissions:', permissions);
          
          // Priority order for landing pages based on permissions
          if (permissions.includes('student_read')) {
            console.log('🎯 Redirecting to students section');
            localStorage.setItem('autoExpandSection', 'students');
            router.replace('/dashboard/students');
            return;
          }
          if (permissions.includes('room_read')) {
            console.log('🎯 Redirecting to rooms section');
            localStorage.setItem('autoExpandSection', 'rooms');
            router.replace('/dashboard/rooms');
            return;
          }
          if (permissions.includes('complaint_read')) {
            console.log('🎯 Redirecting to complaints section');
            localStorage.setItem('autoExpandSection', 'complaints');
            router.replace('/dashboard/complaints');
            return;
          }
          if (permissions.includes('visitor_read')) {
            console.log('🎯 Redirecting to visitors section');
            localStorage.setItem('autoExpandSection', 'visitors');
            router.replace('/dashboard/visitors');
            return;
          }
          if (permissions.includes('role_read')) {
            console.log('🎯 Redirecting to staff management section');
            localStorage.setItem('autoExpandSection', 'staff');
            router.replace(`/dashboard/hostels/${currentHostel.id}/staff`);
            return;
          }
        }
        
        // Fallback: If owner or has view_dashboard permission, go to owner dashboard
        if (user?.role === 'owner' || (user?.permissions?.includes('view_dashboard_owner'))) {
          console.log('🎯 Dashboard: Redirecting to owner dashboard');
          router.replace('/dashboard/owner');
          return;
        }
        
        // If no specific permissions but has hostel access, show basic info
        console.log('🎯 Dashboard: Basic access - staying on main dashboard');
        return;
      }
      
      // If owner has only one hostel, auto-select it
      if (hostels.length === 1) {
        console.log('🎯 Dashboard: Auto-selecting single hostel');
        // The hostel context should handle this, just wait
        return;
      }
      
      // If owner has multiple hostels but none selected, stay on this page
      // The HostelSelectionModal will handle the selection
      console.log('⏸️ Dashboard: Multiple hostels, staying on page for selection');
      return;
    }
    
    // Only redirect to create-hostel if we're sure there are no hostels
    // AND the loading is complete
    if (loadingState === 'loaded' && hostels.length === 0) {
      console.log('🚨 Dashboard: No hostels found, redirecting to create-hostel');
      router.replace('/dashboard/create-hostel');
    } else {
      console.log('⏳ Dashboard: Still waiting for hostel data or hostels exist');
    }
  };

  useEffect(() => {
    console.log('🔍 Dashboard: useEffect triggered with:', {
      user: user ? { id: user.id, role: user.role, permissions: user.permissions?.length || 0 } : 'No user',
      isLoading,
      loadingState,
      isReady,
      hostelsCount: hostels.length
    });

    // Wait for the authentication state to be fully loaded
    if (isLoading) {
      console.log('⏳ Dashboard: Waiting for auth to load...');
      return;
    }
    
    // If authentication is complete and no user is found, redirect to login
    if (!user) {
      console.log('🚨 Dashboard: No user found, redirecting to login');
      router.replace('/auth/login?error=unauthorized');
      return;
    }

    // The role property should now properly include 'superadmin' as a valid value
    const role = user.role;
    console.log('🎭 Dashboard: User role:', role);
    
    // Check for superadmin first (special case from Superadmin model)
    if (role === 'superadmin') {
      console.log('🎯 Dashboard: Redirecting superadmin to superadmin dashboard');
      router.replace('/dashboard/superadmin');
      return;
    }
    
    // Handle standard roles from the User model
    switch (role) {
      case 'student':
        console.log('🎯 Dashboard: Redirecting student to student dashboard');
        router.replace('/dashboard/student');
        break;
      case 'warden':
        console.log('🎯 Dashboard: Redirecting warden to warden dashboard');
        router.replace('/dashboard/warden');
        break;
      case 'owner':
        // For owners, wait for hostel data to load before making routing decisions
        console.log('🏠 Dashboard: Owner detected, checking hostel loading status...');
        if (isReady) {
          console.log('✅ Dashboard: Hostel data loaded, calling handleOwnerRedirect');
          handleOwnerRedirect();
        } else {
          console.log('⏳ Dashboard: Hostel data still loading, waiting...');
        }
        break;
      case 'admin':
        // Legacy support for 'admin' role
        console.log('🎯 Dashboard: Redirecting admin to superadmin dashboard');
        router.replace('/dashboard/superadmin');
        break;
      default:
        // For custom roles, check permissions and redirect accordingly
        if (user.permissions && user.permissions.length > 0) {
          const permissions = user.permissions;
          console.log('🔐 Custom role permissions:', permissions);
          
          // Priority order for custom roles based on permissions
          if (permissions.includes('student_read')) {
            console.log('🎯 Custom role: Redirecting to students section');
            localStorage.setItem('autoExpandSection', 'students');
            router.replace('/dashboard/students');
            return;
          }
          if (permissions.includes('room_read')) {
            console.log('🎯 Custom role: Redirecting to rooms section');
            localStorage.setItem('autoExpandSection', 'rooms');
            router.replace('/dashboard/rooms');
            return;
          }
          if (permissions.includes('complaint_read')) {
            console.log('🎯 Custom role: Redirecting to complaints section');
            localStorage.setItem('autoExpandSection', 'complaints');
            router.replace('/dashboard/complaints');
            return;
          }
          if (permissions.includes('visitor_read')) {
            console.log('🎯 Custom role: Redirecting to visitors section');
            localStorage.setItem('autoExpandSection', 'visitors');
            router.replace('/dashboard/visitors');
            return;
          }
          if (permissions.includes('role_read')) {
            console.log('🎯 Custom role: Redirecting to staff management section');
            localStorage.setItem('autoExpandSection', 'staff');
            // Need hostel context for staff routes
            if (currentHostel) {
              router.replace(`/dashboard/hostels/${currentHostel.id}/staff`);
            } else {
              router.replace('/dashboard/students'); // Fallback
            }
            return;
          }
          if (permissions.includes('view_dashboard_owner')) {
            console.log('🎯 Custom role: Has dashboard permission, redirecting to owner dashboard');
            router.replace('/dashboard/owner');
            return;
          }
        }
        
        // If we get an unexpected role without clear permissions, log and default to student dashboard
        console.warn(`⚠️ Dashboard: Unknown user role: ${role}, defaulting to student dashboard`);
        router.replace('/dashboard/student');
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
  );
}
