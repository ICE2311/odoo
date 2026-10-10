import { db } from '@/server/db';
import { merchOrders, merchOrderItems, users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/server/auth/guards';

export async function getMyMerchOrders() {
  const caller = await requireUser();

  const orders = await db.query.merchOrders.findMany({
    where: eq(merchOrders.userId, caller.user.id),
    with: {
      items: true,
    },
    orderBy: (t) => [db.desc(t.createdAt)],
  });

  return orders;
}
