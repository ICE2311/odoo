import { eq, and } from 'drizzle-orm';
import { requireUser } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users, memberships, accounts } from '@/server/db/schema';

/**
 * Returns the caller's own profile — columns needed by the profile page,
 * along with connected Google OAuth state.
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
      passwordHash: true,
    },
  });

  if (!user) throw new Error('UNAUTHORIZED');

  const googleAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, caller.user.id),
      eq(accounts.provider, 'google')
    ),
    columns: {
      provider: true,
      providerAccountId: true,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    studentId: user.studentId,
    college: user.college,
    emailOptIn: user.emailOptIn,
    createdAt: user.createdAt,
    hasPassword: !!user.passwordHash,
    hasGoogleLinked: !!googleAccount,
  };
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
