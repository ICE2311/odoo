import { eq } from 'drizzle-orm';
import { requireUser } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users, memberships } from '@/server/db/schema';

/**
 * Returns the caller's own profile — only columns needed by the profile page.
 * Throws UNAUTHORIZED if not logged in.
 */
export async function getMyProfile() {
  const caller = await requireUser();

  const user = await db.query.users.findFirst({
    where: eq(users.id, caller.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      studentId: true,
      college: true,
      emailOptIn: true,
      createdAt: true,
    },
  });

  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

/**
 * Returns minimal membership status for the /account dashboard.
 */
export async function getMyAccountDashboard() {
  const caller = await requireUser();

  const now = new Date();
  const membership = await db.query.memberships.findFirst({
    where: (m, { and, eq, lte, gt }) =>
      and(
        eq(m.userId, caller.user.id),
        eq(m.status, 'active'),
        lte(m.startsAt, now),
        gt(m.endsAt, now),
      ),
    columns: { id: true, endsAt: true },
  });

  return {
    user: caller.user,
    isMember: !!membership,
    membershipEndsAt: membership?.endsAt ?? null,
  };
}

