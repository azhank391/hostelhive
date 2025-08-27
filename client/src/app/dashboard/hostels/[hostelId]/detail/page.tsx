import { HostelDetail } from '@/components/dashboard/HostelDetail'

export default async function HostelDetailPage({
  params,
}: {
  params: Promise<{ hostelId: string }>
}) {
  const { hostelId } = await params;
  return <HostelDetail id={hostelId} />
}

