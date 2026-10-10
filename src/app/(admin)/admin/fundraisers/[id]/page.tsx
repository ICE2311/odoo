import { requireAdmin } from '@/server/auth/guards';
import { getFundraiserBoard } from '@/server/data/fundraisers';
import FundraiserBoardClient from '@/app/(public)/volunteer/fundraisers/[id]/FundraiserBoardClient';
import AdminFundraiserExtras from './AdminFundraiserExtras';

export default async function AdminFundraiserPage({ params }: { params: Promise<{ id: string }> }) {
  const caller = await requireAdmin();
  const data = await getFundraiserBoard((await params).id);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex gap-4">
        <div className="w-2/3">
          <FundraiserBoardClient data={data} currentUser={caller.user} />
        </div>
        <div className="w-1/3">
          <AdminFundraiserExtras fundraiser={data.fundraiser} volunteers={data.volunteers} tasks={data.tasks} />
        </div>
      </div>
    </div>
  );
}

