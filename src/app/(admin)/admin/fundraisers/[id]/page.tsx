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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <AdminFundraiserClient data={data} currentUser={caller.user} />
    </div>
  );
}
