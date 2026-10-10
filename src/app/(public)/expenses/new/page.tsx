import { requireMember } from '@/server/auth/guards';
import { db } from '@/server/db';
import { events, fundraisers } from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { ExpenseClaimForm } from './expense-form';

export default async function NewExpenseClaimPage() {
  await requireMember();

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
    <div className="container mx-auto px-4 py-8">
      <ExpenseClaimForm
        events={eventsList}
        fundraisers={fundraisersList}
      />
    </div>
  );
}

