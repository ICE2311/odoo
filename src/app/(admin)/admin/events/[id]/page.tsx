import { requireAdmin } from '@/server/auth/guards';
import { getAdminEvent } from '@/server/data/admin/events';
import { notFound } from 'next/navigation';
import { EventForm } from '../event-form';
import { db } from '@/server/db';
import { eventDoorStaff } from '@/server/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const event = await getAdminEvent(id);
  if (!event) {
    notFound();
  }

  // Count active door staff
  const activeStaff = await db
    .select({ id: eventDoorStaff.id })
    .from(eventDoorStaff)
    .where(and(eq(eventDoorStaff.eventId, id), isNull(eventDoorStaff.revokedAt)));

  return (
    <EventForm
      event={{
        ...event,
        doorStaffCount: activeStaff.length,
      }}
    />
  );
}

