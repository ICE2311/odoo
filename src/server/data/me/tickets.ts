import { db } from '@/server/db';
import { tickets, events, ticketOrders } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireUser } from '@/server/auth/guards';
import crypto from 'crypto';

export async function getMyTickets() {
  const caller = await requireUser();
  const list = await db.query.tickets.findMany({
    where: eq(tickets.ownerUserId, caller.user.id),
    with: {
      event: {
        columns: {
          title: true,
          slug: true,
          startsAt: true,
          venue: true,
        },
      },
    },
    orderBy: [desc(tickets.createdAt)],
  });

  return list;
}

export async function getMyTicket(id: string) {
  const caller = await requireUser();
  const ticket = await db.query.tickets.findFirst({
    where: and(
      eq(tickets.id, id),
      eq(tickets.ownerUserId, caller.user.id)
    ),
    with: {
      event: {
        columns: {
          title: true,
          slug: true,
          startsAt: true,
          endsAt: true,
          venue: true,
          bannerUrl: true,
        }
      }
    }
  });

  if (!ticket) throw new Error('Ticket not found');

  // Ticket QR = signed token HMAC("t:" + ticket.id)
  const hmac = crypto.createHmac('sha256', process.env.AUTH_SECRET || 'secret');
  hmac.update(`t:${ticket.id}`);
  const signature = hmac.digest('hex');
  const qrToken = `t:${ticket.id}:${signature}`;

  return { ...ticket, qrToken };
}

