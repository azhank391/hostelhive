'use client'

import { HostelManagement } from '@/components/dashboard/HostelManagement'
import { useAuth } from '@/contexts/AuthContext'
import { useHostel } from '@/context/HostelContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function OwnerHostelsPage() {
  const { user, isLoading } = useAuth()
  const { loadingState } = useHostel()

  if (isLoading || loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || user.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only hostel owners can access this page.</p>
        </div>
      </div>
    )
  }

  return <HostelManagement />
}
