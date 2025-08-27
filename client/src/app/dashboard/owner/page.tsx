'use client'

import { useRouter } from 'next/navigation'
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard'

export default function OwnerPage() {
  const router = useRouter()
  
  // Simple redirect to hostel dashboard if available
  // For now, just show the owner dashboard component
  return <OwnerDashboard />
}
