import { db } from '@/server/db';
import { events, ticketOrders, tickets, eventDoorStaff, ledgerEntries } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAdmin } from '@/server/auth/guards';
import { z } from 'zod';

export async function getAdminEvents() {
  await requireAdmin();
  const list = await db.query.events.findMany({
    orderBy: (events, { desc }) => [desc(events.createdAt)],
  });

  // Calculate gross revenue for each
  const listWithRevenue = await Promise.all(list.map(async (event) => {
    const res = await db.select({ total: sql<number>\`SUM(amount_paise)\` }).from(ledgerEntries).where(and(eq(ledgerEntries.eventId, event.id), eq(ledgerEntries.category, 'ticket_sales')));
    const refundsRes = await db.select({ total: sql<number>\`SUM(amount_paise)\` }).from(ledgerEntries).where(and(eq(ledgerEntries.eventId, event.id), eq(ledgerEntries.category, 'refund')));
    return {
      ...event,
      grossRevenue: res[0]?.total || 0,
      refunds: refundsRes[0]?.total || 0,
    };
  }));

  return listWithRevenue;
}

export async function getAdminEvent(id: string) {
  await requireAdmin();
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });
  return event;
}

const eventSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  bannerUrl: z.string().url().optional(),
  venue: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  capacity: z.coerce.number().min(1),
  memberPricePaise: z.coerce.number().min(0),
  nonMemberPricePaise: z.coerce.number().min(0),
  salesOpenAt: z.coerce.date(),
  salesCloseAt: z.coerce.date(),
  maxTicketsPerUser: z.coerce.number().min(1).default(4),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']),
});

export async function createAdminEvent(input: any) {
  await requireAdmin();
  const data = eventSchema.parse(input);
  const [event] = await db.insert(events).values(data).returning();
  return event;
}

export async function updateAdminEvent(id: string, input: any) {
  await requireAdmin();
  const data = eventSchema.parse(input);
  const [event] = await db.update(events).set({ ...data, updatedAt: new Date() }).where(eq(events.id, id)).returning();
  return event;
}

export async function getEventReport(id: string) {
  await requireAdmin();
  const event = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!event) throw new Error('Event not found');

  const allTickets = await db.query.tickets.findMany({
    where: and(eq(tickets.eventId, id), eq(tickets.status, 'valid')),
  });

  const memberSold = allTickets.filter(t => t.priceType === 'member').length;
  const nonMemberSold = allTickets.filter(t => t.priceType === 'non_member').length;
  const compSold = allTickets.filter(t => t.priceType === 'comp').length;
  const checkedIn = allTickets.filter(t => t.checkedInAt !== null).length;
  const noShows = allTickets.length - checkedIn;
  const attendancePercent = allTickets.length > 0 ? (checkedIn / allTickets.length) * 100 : 0;

  const res = await db.select({ total: sql<number>\`SUM(amount_paise)\` }).from(ledgerEntries).where(and(eq(ledgerEntries.eventId, id), eq(ledgerEntries.category, 'ticket_sales')));
  const refundsRes = await db.select({ total: sql<number>\`SUM(amount_paise)\` }).from(ledgerEntries).where(and(eq(ledgerEntries.eventId, id), eq(ledgerEntries.category, 'refund')));
  const grossRevenue = Number(res[0]?.total || 0);
  const refunds = Number(refundsRes[0]?.total || 0);
  const netRevenue = grossRevenue - refunds;

  return {
    ticketsSold: { member: memberSold, nonMember: nonMemberSold, comp: compSold, total: allTickets.length },
    checkedIn,
    noShows,
    attendancePercent,
    grossRevenue,
    refunds,
    netRevenue,
  };
}

export async function cancelEventAdmin(id: string) {
  const caller = await requireAdmin();
  return await db.transaction(async (tx) => {
    // 1. Mark event cancelled
    const [event] = await tx.update(events).set({ status: 'cancelled' }).where(eq(events.id, id)).returning();
    
    // 2. Void valid tickets
    const validTickets = await tx.execute(sql\`SELECT id, order_id, price_paise FROM tickets WHERE event_id = \${id} AND status = 'valid' FOR UPDATE\`);
    if (validTickets.length > 0) {
      await tx.update(tickets).set({ status: 'refunded' }).where(and(eq(tickets.eventId, id), eq(tickets.status, 'valid')));
      
      // 3. Mark orders as refunded
      await tx.update(ticketOrders).set({ status: 'refunded' }).where(eq(ticketOrders.eventId, id));

      // 4. Ledger refund entries (one per order or bulk? Usually per order, but let's do bulk for simplicity, or per ticket)
      // Get unique orders
      const orderIds = [...new Set(validTickets.map(t => (t as any).order_id))];
      for (const oid of orderIds) {
        const orderTickets = validTickets.filter(t => (t as any).order_id === oid);
        const refundAmt = orderTickets.reduce((sum, t) => sum + (t as any).price_paise, 0);
        if (refundAmt > 0) {
          await tx.insert(ledgerEntries).values({
            direction: 'out',
            amountPaise: refundAmt,
            category: 'refund',
            method: 'razorpay',
            sourceType: 'ticket_order',
            sourceId: oid as string,
            eventId: id,
            description: \`Bulk refund for cancelled event \${id}\`,
            recordedBy: caller.user.id,
          });
        }
      }
    }
    return event;
  });
}

export async function getAdminDoorStaff(eventId: string) {
  await requireAdmin();
  return await db.query.eventDoorStaff.findMany({
    where: eq(eventDoorStaff.eventId, eventId),
    with: {
      user: {
        columns: { name: true, email: true }
      }
    }
  });
}

export async function addDoorStaff(eventId: string, userId: string) {
  const caller = await requireAdmin();
  const [staff] = await db.insert(eventDoorStaff).values({
    eventId,
    userId,
    grantedBy: caller.user.id,
  }).returning();
  return staff;
}

export async function revokeDoorStaff(id: string) {
  await requireAdmin();
  const [staff] = await db.update(eventDoorStaff).set({ revokedAt: new Date() }).where(eq(eventDoorStaff.id, id)).returning();
  return staff;
}

