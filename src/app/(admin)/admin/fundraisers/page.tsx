import { requireAdmin } from '@/server/auth/guards';
import { getAdminFundraisers } from '@/server/data/fundraisers';
import { FundraisersListClient } from './FundraisersListClient';

export default async function AdminFundraisersPage() {
  await requireAdmin();
  const fundraisers = await getAdminFundraisers();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <FundraisersListClient fundraisers={fundraisers as any} />
    </div>
  );
}
