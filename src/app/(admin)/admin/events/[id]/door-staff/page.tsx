import { requireAdmin } from '@/server/auth/guards';
import { getAdminEvent } from '@/server/data/admin/events';
import { notFound } from 'next/navigation';
import { db } from '@/server/db';
import { eventDoorStaff, users, memberships } from '@/server/db/schema';
import { eq, and, lte, gt } from 'drizzle-orm';
import { DoorStaffClient } from './door-staff-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventDoorStaffPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const event = await getAdminEvent(id);
  if (!event) notFound();

  const now = new Date();

  // Load all door staff for this event
  const staffRows = await db.query.eventDoorStaff.findMany({
    where: eq(eventDoorStaff.eventId, id),
    with: {
      user: true,
    },
  });

  // Load active memberships to check candidate statuses
  const activeMemberships = await db.query.memberships.findMany({
    where: and(
      eq(memberships.status, 'active'),
      lte(memberships.startsAt, now),
      gt(memberships.endsAt, now)
    ),
  });
  const activeMemberUserIds = new Set(activeMemberships.map((m) => m.userId));

  const allUsers = await db.query.users.findMany({
    columns: { id: true, name: true, email: true, studentId: true, role: true },
  });

  const formattedStaff = staffRows.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user?.name || null,
    userEmail: s.user?.email || '',
    phone: s.user?.phone || null,
    studentId: s.user?.studentId || null,
    grantedAt: s.grantedAt.toISOString(),
    revokedAt: s.revokedAt?.toISOString() || null,
    isMember: activeMemberUserIds.has(s.userId),
  }));

  const candidateUsers = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isMember: activeMemberUserIds.has(u.id),
    studentId: u.studentId,
  }));

  return (
    <DoorStaffClient
      event={{
        id: event.id,
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        venue: event.venue,
        status: event.status,
      }}
      initialStaff={formattedStaff}
      candidateUsers={candidateUsers}
    />
  );
}

