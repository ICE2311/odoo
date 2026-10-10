import { requireMember } from '@/server/auth/guards';
import { getFundraiserBoard } from '@/server/data/fundraisers';
import FundraiserBoardClient from './FundraiserBoardClient';

export default async function FundraiserBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const caller = await requireMember();
  const data = await getFundraiserBoard((await params).id);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <FundraiserBoardClient data={data} currentUser={caller.user} />
    </div>
  );
}

