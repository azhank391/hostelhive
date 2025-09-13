'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HostelWardensPage() {
  const params = useParams<{ hostelId: string }>()
  const router = useRouter()
  const hostelId = params?.hostelId

  // Redirect to unified staff management
  useEffect(() => {
    if (hostelId) {
      router.replace(`/dashboard/hostels/${hostelId}/staff/manage`)
    } else {
      router.replace('/dashboard')
    }
  }, [hostelId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Redirecting to Staff Management...</p>
      </div>
    </div>
  )
}
