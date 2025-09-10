// Fallback to dynamic import to avoid type issues if the module isn't exporting named export
import React, { Suspense } from 'react';
const VisitorDetail = React.lazy(() => import('@/components/dashboard/VisitorDetail'));

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VisitorDetail id={id} />
    </Suspense>
  );
}
