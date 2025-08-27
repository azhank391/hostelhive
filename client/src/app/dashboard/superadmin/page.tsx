import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SuperadminDashboard } from '@/components/dashboard/SuperadminDashboard'

export default function SuperadminDashboardPage() {
  return (
    <ProtectedRoute>
      <SuperadminDashboard />
    </ProtectedRoute>
  )
}
