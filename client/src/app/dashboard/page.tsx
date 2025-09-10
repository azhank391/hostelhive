'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getPermissionBasedRoute } from '@/lib/permission-routing'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for the authentication state to be fully loaded
    if (isLoading) return
    
    // If authentication is complete and no user is found, redirect to login
    if (!user) {
      router.push('/auth/login?error=unauthorized')
      return
    }

    // Use the new permission-based routing system
    const targetRoute = getPermissionBasedRoute(user)
    
    console.log('🎯 Redirecting user based on permissions:', {
      userId: user.id,
      role: user.role,
      permissions: user.permissions,
      targetRoute
    })

    router.push(targetRoute)
  }, [user, router, isLoading])

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
            : `Welcome${user?.name ? ` ${user.name}` : ''}! Taking you to your personalized dashboard based on your permissions.`}
        </p>
      </div>
    </div>
  )
}
