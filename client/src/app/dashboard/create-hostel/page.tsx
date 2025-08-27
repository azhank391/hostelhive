'use client';

import { CreateHostelForm } from '@/components/forms/CreateHostelForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function CreateHostelPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Hostel</h1>
          <p className="mt-2 text-gray-600">
            Add another hostel to your portfolio. You can manage multiple hostels from a single dashboard.
          </p>
        </div>
        
        <CreateHostelForm />
      </div>
    </DashboardLayout>
  );
}
