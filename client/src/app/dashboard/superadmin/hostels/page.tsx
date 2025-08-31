import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SuperadminHostelsPage } from '@/components/dashboard/SuperadminHostelsPage'

export default function SuperadminHostelsPageRoute() {
  return (
    <ProtectedRoute>
      <SuperadminHostelsPage />
    </ProtectedRoute>
  )
}
