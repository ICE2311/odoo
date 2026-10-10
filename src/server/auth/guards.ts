import { cache } from 'react';
import { eq, and, lte, gt } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/server/db';
import { users, memberships } from '@/server/db/schema';

// ─── getCaller ────────────────────────────────────────────────────────────────
// Cached per-request (React cache): one DB round-trip per request max.
// Membership is checked live on every request — expiry is honoured immediately.

export const getCaller = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return { kind: 'visitor' as const };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, name: true, email: true, role: true },
  });
  if (!user) return { kind: 'visitor' as const };

  const now = new Date();
  const activeMembership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, user.id),
      eq(memberships.status, 'active'),
      lte(memberships.startsAt, now),
      gt(memberships.endsAt, now),
    ),
    columns: { id: true },
  });

  return {
    kind: 'user' as const,
    user,
    isAdmin: user.role === 'admin',
    isMember: !!activeMembership,
  };
});

export type Caller = Awaited<ReturnType<typeof getCaller>>;

// ─── Guards ───────────────────────────────────────────────────────────────────

export async function requireUser() {
  const caller = await getCaller();
  if (caller.kind === 'visitor') throw new Error('UNAUTHORIZED');
  return caller;
}

export async function requireMember() {
  const caller = await requireUser();
  if (!caller.isMember) throw new Error('FORBIDDEN: Active membership required');
  return caller;
}

export async function requireAdmin() {
  const caller = await requireUser();
  if (!caller.isAdmin) throw new Error('FORBIDDEN: Admin access required');
  return caller;
}

export async function requireDoorAccess(_eventId: string) {
  // Stub — full implementation in Phase 4
  throw new Error('FORBIDDEN: Door access not yet implemented');
}

