'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { IntelligentLandingResolver } from '@/utils/intelligentLandingResolver';

/**
 * 🎯 INTELLIGENT DASHBOARD LANDING COMPONENT
 * 
 * This component determines where users should land based on their permissions
 * instead of forcing everyone to the main dashboard.
 */

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { currentHostel, hostels, loadingState } = useHostel();

  useEffect(() => {
    // Wait for auth and hostel data to load
    if (isLoading || loadingState === 'loading' || !user) {
      console.log('⏳ Waiting for auth/hostel data to load...');
      return;
    }

    console.log('🎯 IntelligentDashboardLanding: Analyzing user access');
    console.log('👤 User:', { id: user.id, role: user.role });
    console.log('🏨 Hostels:', hostels.length, 'Current:', currentHostel?.name);
    console.log('🔐 Permissions:', user.permissions || []);

    // Special handling for superadmin
    if (user.role === 'superadmin') {
      console.log('🎯 Superadmin detected - redirecting to superadmin dashboard');
      router.replace('/dashboard/superadmin');
      return;
    }

    // Special handling for owners without hostels
    if (user.role === 'owner' && hostels.length === 0) {
      console.log('🏗️ Owner without hostels - redirecting to hostel creation');
      router.replace('/dashboard/create-hostel');
      return;
    }

    // Special handling for owners with hostels but none selected
    if (user.role === 'owner' && hostels.length > 0 && !currentHostel) {
      console.log('📋 Owner needs to select hostel - showing selector');
      // Stay on this page, the layout will show the hostel selector
      return;
    }

    // For users with permissions, determine appropriate landing page
    if (user.permissions && user.permissions.length > 0) {
      // Convert permission array to object for the resolver
      const permissionsObj = user.permissions.reduce((acc, perm) => {
        acc[perm] = true;
        return acc;
      }, {} as { [key: string]: boolean });

      const analysis = IntelligentLandingResolver.analyzePermissions(permissionsObj);
      console.log('📊 Permission Analysis:', analysis);
      
      const landingPage = analysis.recommendedLanding;
      
      // If user should go to login, handle that
      if (landingPage.path === '/auth/login') {
        console.log('❌ No valid permissions - redirecting to login');
        router.replace('/auth/login');
        return;
      }

      // Store landing information for sidebar auto-expansion
      if (landingPage.autoExpand) {
        localStorage.setItem('autoExpandSection', landingPage.autoExpand);
      }

      console.log(`🎯 Redirecting to: ${landingPage.path}`);
      console.log(`📋 Reason: ${landingPage.reason}`);
      
      // Redirect to the appropriate page
      router.replace(landingPage.path);
      return;
    }

    // Special case for owners - they should have dashboard access by default
    if (user.role === 'owner') {
      console.log('👑 Owner detected - redirecting to dashboard overview');
      router.replace('/dashboard/overview');
      return;
    }

    // Fallback for users without clear permissions
    console.warn('⚠️ User has no clear permissions - needs manual review');
    router.replace('/auth/login');
    
  }, [user, isLoading, hostels, currentHostel, loadingState, router]);

  // Show loading state while determining landing page
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isLoading || loadingState === 'loading' ? 'Loading...' : 'Analyzing Permissions...'}
        </h3>
        <p className="text-sm text-gray-600">
          {isLoading || loadingState === 'loading' 
            ? 'Fetching user data and permissions' 
            : 'Determining the best landing page for your access level'
          }
        </p>
      </div>
    </div>
  );
}
