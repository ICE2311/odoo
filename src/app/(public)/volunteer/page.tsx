import { requireMember } from '@/server/auth/guards';
import { getActiveFundraisers, getMyTasks } from '@/server/data/fundraisers';
import Link from 'next/link';
import { joinFundraiserAction } from '@/server/actions/fundraisers';

export default async function VolunteerPage() {
  await requireMember();
  const fundraisers = await getActiveFundraisers();
  const myTasks = await getMyTasks();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Volunteer</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Active Fundraisers</h2>
        {fundraisers.length === 0 ? (
          <p className="text-gray-500">No active fundraisers at the moment.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {fundraisers.map((f: any) => (
              <div key={f.id} className="border p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg">{f.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{f.date.toLocaleDateString()}</p>
                {f.isJoined ? (
                  <Link href={`/volunteer/fundraisers/${f.id}`} className="text-blue-600 hover:underline">
                    View Board &rarr;
                  </Link>
                ) : (
                  <form action={async () => {
                    'use server';
                    await joinFundraiserAction(f.id);
                  }}>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                      Join Fundraiser
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
        {myTasks.length === 0 ? (
          <p className="text-gray-500">You have no pending tasks.</p>
        ) : (
          <ul className="space-y-2">
            {myTasks.map((t: any) => (
              <li key={t.id} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-xs text-gray-500">{t.fundraiserName}</div>
                </div>
                <div className="text-sm text-right">
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-2">{t.status}</span>
                  <span className={t.dueAt && t.dueAt < new Date() ? 'text-red-600 font-bold' : ''}>
                    {t.dueAt ? t.dueAt.toLocaleDateString() : 'No due date'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

