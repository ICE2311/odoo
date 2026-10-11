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
    isTreasurer: user.role === 'treasurer',
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
  if (!caller.isMember && !caller.isAdmin) throw new Error('FORBIDDEN: Active membership required');
  return caller;
}

export async function requireAdmin() {
  const caller = await requireUser();
  if (!caller.isAdmin) throw new Error('FORBIDDEN: Admin access required');
  return caller;
}

export async function requireFinanceAccess() {
  const caller = await requireUser();
  if (!caller.isAdmin && !caller.isTreasurer) {
    throw new Error('FORBIDDEN: Admin or Treasurer access required');
  }
  return caller;
}

export async function requireDoorAccess(eventId: string) {
  const caller = await getCaller();
  if (caller.kind === 'visitor') throw new Error('UNAUTHORIZED');

  if (caller.isAdmin || caller.isMember) return caller; // Admins and active Members have door access

  const { eventDoorStaff } = await import('@/server/db/schema');
  const { eq, and, isNull } = await import('drizzle-orm');

  // Verify user has an active non-revoked assignment
  const activeStaff = await db.query.eventDoorStaff.findFirst({
    where: and(
      eq(eventDoorStaff.eventId, eventId),
      eq(eventDoorStaff.userId, caller.user.id),
      isNull(eventDoorStaff.revokedAt)
    ),
  });

  if (!activeStaff) {
    throw new Error('FORBIDDEN: Door staff access not granted for this event');
  }

  return caller;
}
