'use server';

import { requireAdmin } from '@/server/auth/guards';
import { db } from '@/server/db';
import { events, auditLog, tickets, eventDoorStaff } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cancelEventAdmin } from '@/server/data/admin/events';

const eventFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: z.string().trim().min(1, 'Slug is required').max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. spring-gala-2025)'),
  description: z.string().min(1, 'Description is required'),
  bannerUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  venue: z.string().trim().min(1, 'Venue is required'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  salesOpenAt: z.coerce.date(),
  salesCloseAt: z.coerce.date(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  memberPricePaise: z.coerce.number().int().min(0, 'Member price cannot be negative'),
  nonMemberPricePaise: z.coerce.number().int().min(0, 'Non-member price cannot be negative'),
  maxTicketsPerUser: z.coerce.number().int().min(1).max(20).default(4),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
});

export async function createEventAction(input: any) {
  const caller = await requireAdmin();
  const data = eventFormSchema.parse(input);

  // Check unique slug
  const [existing] = await db.select({ id: events.id }).from(events).where(eq(events.slug, data.slug));
  if (existing) {
    throw new Error(`An event with slug "${data.slug}" already exists`);
  }

  const [newEvent] = await db
    .insert(events)
    .values({
      title: data.title,
      slug: data.slug,
      description: data.description,
      bannerUrl: data.bannerUrl || null,
      venue: data.venue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      salesOpenAt: data.salesOpenAt,
      salesCloseAt: data.salesCloseAt,
      capacity: data.capacity,
      memberPricePaise: data.memberPricePaise,
      nonMemberPricePaise: data.nonMemberPricePaise,
      maxTicketsPerUser: data.maxTicketsPerUser,
      status: data.status,
    })
    .returning();

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'create_event',
    entityType: 'event',
    entityId: newEvent.id,
    afterJson: data,
  });

  revalidatePath('/events');
  revalidatePath('/admin/events');
  return { success: true, eventId: newEvent.id, slug: newEvent.slug };
}

export async function updateEventAction(id: string, input: any) {
  const caller = await requireAdmin();
  const data = eventFormSchema.parse(input);

  const [existingEvent] = await db.select().from(events).where(eq(events.id, id));
  if (!existingEvent) throw new Error('Event not found');

  // Check slug uniqueness if changed
  if (existingEvent.slug !== data.slug) {
    const [slugConflict] = await db.select({ id: events.id }).from(events).where(eq(events.slug, data.slug));
    if (slugConflict && slugConflict.id !== id) {
      throw new Error(`An event with slug "${data.slug}" already exists`);
    }
  }

  const [updated] = await db
    .update(events)
    .set({
      title: data.title,
      slug: data.slug,
      description: data.description,
      bannerUrl: data.bannerUrl || null,
      venue: data.venue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      salesOpenAt: data.salesOpenAt,
      salesCloseAt: data.salesCloseAt,
      capacity: data.capacity,
      memberPricePaise: data.memberPricePaise,
      nonMemberPricePaise: data.nonMemberPricePaise,
      maxTicketsPerUser: data.maxTicketsPerUser,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'update_event',
    entityType: 'event',
    entityId: id,
    beforeJson: {
      title: existingEvent.title,
      slug: existingEvent.slug,
      capacity: existingEvent.capacity,
      status: existingEvent.status,
    },
    afterJson: data,
  });

  revalidatePath('/events');
  revalidatePath(`/events/${updated.slug}`);
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${id}`);
  return { success: true, event: updated };
}

export async function cancelEventWithRefundsAction(id: string) {
  const caller = await requireAdmin();
  const event = await cancelEventAdmin(id);

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'cancel_event',
    entityType: 'event',
    entityId: id,
    afterJson: { status: 'cancelled' },
  });

  revalidatePath('/events');
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${id}`);
  return { success: true, event };
}

export async function deleteEventAdminAction(id: string) {
  const caller = await requireAdmin();

  const [existingEvent] = await db.select().from(events).where(eq(events.id, id));
  if (!existingEvent) throw new Error('Event not found');

  // Check if there are tickets
  const existingTickets = await db.select().from(tickets).where(eq(tickets.eventId, id));
  if (existingTickets.length > 0) {
    // If it has tickets, cancel and issue refunds rather than breaking ticket references
    const cancelled = await cancelEventAdmin(id);
    await db.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'cancel_and_refund_event',
      entityType: 'event',
      entityId: id,
      beforeJson: { title: existingEvent.title, status: existingEvent.status },
      afterJson: { status: 'cancelled', ticketsRefunded: existingTickets.length },
    });
    revalidatePath('/events');
    revalidatePath('/admin/events');
    revalidatePath(`/admin/events/${id}`);
    return {
      success: true,
      cancelled: true,
      message: `Event has ${existingTickets.length} ticket(s). It was safely marked as cancelled and refunds were processed.`,
    };
  }

  // If no tickets exist, cleanly delete door staff records and the event row
  await db.delete(eventDoorStaff).where(eq(eventDoorStaff.eventId, id));
  await db.delete(events).where(eq(events.id, id));

  await db.insert(auditLog).values({
    actorId: caller.user.id,
    action: 'delete_event',
    entityType: 'event',
    entityId: id,
    beforeJson: { title: existingEvent.title, slug: existingEvent.slug },
  });

  revalidatePath('/events');
  revalidatePath('/admin/events');
  return {
    success: true,
    cancelled: false,
    message: `Event "${existingEvent.title}" was permanently deleted.`,
  };
}


