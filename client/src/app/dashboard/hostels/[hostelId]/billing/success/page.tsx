"use client";
import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useBilling } from '@/hooks/useBilling';
import api from '@/lib/http';
import { toast } from 'sonner';

export default function BillingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refetchStatus } = useBilling();
  const sessionId = searchParams?.get('session_id');
  const { hostelId } = params as { hostelId: string };

  useEffect(() => {
    const reconcile = async () => {
      try {
        if (sessionId) {
          await api.post('/billing/sync-session', { sessionId });
        }
        toast.success('Subscription activated successfully');
      } catch (e) {
        console.error('Sync session failed:', e);
      } finally {
        await refetchStatus();
        router.replace(`/dashboard/hostels/${hostelId}/billing`);
      }
    };
    reconcile();
  }, [sessionId, hostelId, refetchStatus, router]);

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-white shadow rounded p-6 text-center">
        <h1 className="text-xl font-semibold">Processing your subscription…</h1>
        <p className="text-gray-600 mt-2">Please wait while we confirm your payment.</p>
      </div>
    </div>
  );
}
