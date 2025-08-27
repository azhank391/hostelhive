'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHostel } from '@/context/HostelContext'

export default function OwnerVisitorsRedirectPage() {
  const router = useRouter()
  const { currentHostel, hostels, isLoading } = useHostel()

  useEffect(() => {
    if (isLoading) return

    // If owner has a selected hostel, redirect to hostel-specific visitors page
    if (currentHostel?.id) {
      router.replace(`/dashboard/${currentHostel.id}/visitors`)
      return
    }

    // If owner has hostels but none selected, redirect to select one
    if (hostels.length > 0) {
      router.replace('/dashboard/owner') // Show hostel selector
      return
    }

    // If no hostels, redirect to create hostel page
    router.replace('/dashboard/create-hostel')
  }, [router, currentHostel, hostels, isLoading])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to visitor management...</p>
      </div>
    </div>
  )
}
