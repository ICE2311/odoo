import { requireAdmin } from '@/server/auth/guards';
import { getFundraiserBoard } from '@/server/data/fundraisers';
import AdminFundraiserClient from './AdminFundraiserClient';

export default async function AdminFundraiserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const caller = await requireAdmin();
  const { id } = await params;
  const data = await getFundraiserBoard(id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdminFundraiserClient data={data} currentUser={caller.user} />
    </div>
  );
}
