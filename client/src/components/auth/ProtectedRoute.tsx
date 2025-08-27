'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { STORAGE_KEYS } from '@/lib/config'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'owner' | 'warden' | 'student' | 'superadmin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading) return

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      // Clear any stale data and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      }
      router.push('/auth/login?error=unauthorized')
      return
    }

    // Check if user has required role (if specified)
    if (requiredRole && user.role !== requiredRole) {
      router.push('/auth/login?error=insufficient_permissions')
      return
    }
  }, [user, isLoading, isAuthenticated, requiredRole, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render children
  if (!isAuthenticated || !user) {
    return null
  }

  // If role check fails, don't render children
  if (requiredRole && user.role !== requiredRole) {
    return null
  }

  // User is authenticated and authorized
  return <>{children}</>
}
