import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SuperadminBillingPage } from '@/components/dashboard/SuperadminBillingPage'

export default function SuperadminBillingPageRoute() {
  return (
    <ProtectedRoute>
      <SuperadminBillingPage />
    </ProtectedRoute>
  )
}
