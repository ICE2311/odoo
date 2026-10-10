import { requireAdmin } from '@/server/auth/guards';
import { getAdminFundraisers } from '@/server/data/fundraisers';
import Link from 'next/link';
import { FundraiserTableActions } from './fundraiser-table-actions';

export default async function AdminFundraisersPage() {
  await requireAdmin();
  const fundraisers = await getAdminFundraisers();

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fundraisers</h1>
        <Link href="/admin/fundraisers/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius-md)]">
          Create Fundraiser
        </Link>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">Name</th>
            <th className="p-2">Date</th>
            <th className="p-2">Status</th>
            <th className="p-2">Goal vs Raised</th>
            <th className="p-2">On Track</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fundraisers.map(f => (
            <tr key={f.id} className="border-b">
              <td className="p-2">{f.name}</td>
              <td className="p-2">{f.date.toLocaleDateString()}</td>
              <td className="p-2 capitalize">{f.status}</td>
              <td className="p-2">₹{f.raisedPaise / 100} / ₹{f.goalPaise / 100}</td>
              <td className="p-2">
                <span className={`px-2 py-1 text-xs rounded-[var(--radius-md)] font-bold ${
                  f.onTrack === 'On track' ? 'bg-success/10 text-success' :
                  f.onTrack === 'Behind' ? 'bg-warning/10 text-warning-foreground' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {f.onTrack}
                </span>
              </td>
              <td className="p-2 text-right">
                <FundraiserTableActions
                  fundraiserId={f.id}
                  fundraiserName={f.name}
                />
              </td>
            </tr>
          ))}
          {fundraisers.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-muted-foreground">No fundraisers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

