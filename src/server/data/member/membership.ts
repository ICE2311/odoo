import { eq, and, lte, gt } from 'drizzle-orm';
import { requireMember } from '@/server/auth/guards';
import { db } from '@/server/db';
import { memberships } from '@/server/db/schema';

/**
 * Returns the caller's active membership.
 * Throws FORBIDDEN if no active membership.
 */
export async function getMyMembership() {
  const caller = await requireMember();

  const now = new Date();
  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, caller.user.id),
      eq(memberships.status, 'active'),
      lte(memberships.startsAt, now),
      gt(memberships.endsAt, now),
    ),
    columns: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      pricePaise: true,
      method: true,
      createdAt: true,
    },
  });

  return membership ?? null;
}

