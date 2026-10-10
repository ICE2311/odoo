import { requireMember } from '@/server/auth/guards';
import { db } from '@/server/db';
import { events, fundraisers } from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { ExpenseClaimForm } from '@/app/(public)/expenses/new/expense-form';

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewAccountExpensePage({ searchParams }: PageProps) {
  await requireMember();
  const params = await searchParams;
  const defaultType = params?.type === 'income' ? 'income' : 'expense';

  const [eventsList, fundraisersList] = await Promise.all([
    db.query.events.findMany({
      columns: { id: true, title: true },
      orderBy: [desc(events.startsAt)],
    }),
    db.query.fundraisers.findMany({
      columns: { id: true, name: true },
      orderBy: [desc(fundraisers.createdAt)],
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ExpenseClaimForm
        events={eventsList}
        fundraisers={fundraisersList}
        defaultType={defaultType}
      />
    </div>
  );
}
