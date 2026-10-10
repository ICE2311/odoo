'use server';

import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { eventDoorStaff, auditLog, users, events } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addEventDoorStaffAction(eventId: string, userId: string) {
  const caller = await requireAdmin();

  // Check if existing record exists
  const [existing] = await db
    .select()
    .from(eventDoorStaff)
    .where(and(eq(eventDoorStaff.eventId, eventId), eq(eventDoorStaff.userId, userId)));

  let staffId: string;
  if (existing) {
    await db
      .update(eventDoorStaff)
      .set({
        revokedAt: null,
        grantedBy: caller.user.id,
        grantedAt: new Date(),
      })
      .where(eq(eventDoorStaff.id, existing.id));
    staffId = existing.id;
  } else {
    const [inserted] = await db
      .insert(eventDoorStaff)
      .values({
        eventId,
        userId,
        grantedBy: caller.user.id,
      })
      .returning();
    staffId = inserted.id;
  }

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'add_door_staff',
    entityType: 'event_door_staff',
    entityId: staffId,
    afterJson: { eventId, userId, grantedBy: caller.user.id },
  });

  revalidatePath(`/admin/events/${eventId}/door-staff`);
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath('/admin/users');
  return { success: true, staffId };
}

export async function revokeEventDoorStaffAction(staffId: string) {
  const caller = await requireAdmin();

  const [revoked] = await db
    .update(eventDoorStaff)
    .set({ revokedAt: new Date() })
    .where(eq(eventDoorStaff.id, staffId))
    .returning();

  if (revoked) {
    await db.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'revoke_door_staff',
      entityType: 'event_door_staff',
      entityId: staffId,
      afterJson: { eventId: revoked.eventId, userId: revoked.userId, revokedAt: revoked.revokedAt },
    });

    revalidatePath(`/admin/events/${revoked.eventId}/door-staff`);
    revalidatePath(`/admin/events/${revoked.eventId}`);
    revalidatePath('/admin/users');
  }

  return { success: true };
}

