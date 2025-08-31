import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SuperadminAnalyticsPage } from '@/components/dashboard/SuperadminAnalyticsPage'

export default function SuperadminAnalyticsPageRoute() {
  return (
    <ProtectedRoute>
      <SuperadminAnalyticsPage />
    </ProtectedRoute>
  )
}
