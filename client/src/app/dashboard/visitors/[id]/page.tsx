import { VisitorDetail } from '@/components/dashboard/VisitorDetail'

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  return <VisitorDetail id={id} />
}
