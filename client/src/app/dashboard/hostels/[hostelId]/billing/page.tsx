'use client';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { redirect } from 'next/navigation';

// Lightweight client wrapper to gate by view_billing
export default function BillingPage() {
  // Because this is a client route segment, we can safely call hooks
  // If project uses Server Components by default, convert to "use client" block.
  return <BillingPageClient />;
}


function BillingPageClient() {
  const { user } = useAuth();
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <div className="p-8 text-gray-600">Loading billing...</div>;
  }

  if (!user) {
    redirect('/login');
    return null;
  }

  if (!hasPermission('view_billing')) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-sm mb-4">You do not have permission to view billing information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Billing Overview</h1>
        <p className="text-gray-600 mt-1 text-sm">Subscription, invoices and usage metrics for this hostel.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Current Plan</h2>
          <div className="text-lg font-semibold text-gray-900">Standard</div>
          <p className="text-xs text-gray-500 mt-1">Billed monthly</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Active Staff</h2>
            <div className="text-lg font-semibold text-gray-900">--</div>
            <p className="text-xs text-gray-500 mt-1">Coming soon</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Storage Usage</h2>
            <div className="text-lg font-semibold text-gray-900">--</div>
            <p className="text-xs text-gray-500 mt-1">Coming soon</p>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>
        <div className="text-sm text-gray-600">No invoices available yet.</div>
      </section>
    </div>
  );
}
