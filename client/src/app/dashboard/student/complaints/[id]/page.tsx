import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { StudentComplaintDetail } from '@/components/dashboard/StudentComplaintDetail'

export default async function StudentComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <ProtectedRoute>
      <StudentComplaintDetail complaintId={id} />
    </ProtectedRoute>
  )
}
