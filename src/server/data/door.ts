import { db } from '@/server/db';
import { tickets, events } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireDoorAccess } from '@/server/auth/guards';
import crypto from 'crypto';

export async function checkInTicket(eventId: string, token: string) {
  const caller = await requireDoorAccess(eventId);

  // token format: "t:{id}:{signature}"
  const parts = token.split(':');
  if (parts.length !== 3 || parts[0] !== 't') {
    return { ok: false, reason: 'INVALID_TOKEN_FORMAT' };
  }

  const ticketId = parts[1];
  const signature = parts[2];

  const hmac = crypto.createHmac('sha256', process.env.AUTH_SECRET || 'secret');
  hmac.update(`t:${ticketId}`);
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  return await db.transaction(async (tx) => {
    const ticketRows = await tx.execute(
      sql`SELECT t.id, t.event_id, t.status, t.checked_in_at, t.holder_name, t.price_type, u.name as checked_in_by_name
          FROM tickets t
          LEFT JOIN users u ON t.checked_in_by = u.id
          WHERE t.id = ${ticketId} FOR UPDATE`
    );

    if (ticketRows.rows.length === 0) return { ok: false, reason: 'TICKET_NOT_FOUND' };
    const ticket = ticketRows.rows[0] as any;

    if (ticket.event_id !== eventId) return { ok: false, reason: 'WRONG_EVENT' };
    if (ticket.status === 'refunded') return { ok: false, reason: 'REFUNDED' };
    if (ticket.status === 'void') return { ok: false, reason: 'VOID' };

    if (ticket.checked_in_at) {
      return { 
        ok: false, 
        reason: 'ALREADY_CHECKED_IN',
        checkedInAt: ticket.checked_in_at,
        checkedInBy: ticket.checked_in_by_name || 'Unknown'
      };
    }

    await tx.execute(
      sql`UPDATE tickets SET checked_in_at = NOW(), checked_in_by = ${caller.user.id} WHERE id = ${ticketId}`
    );

    return {
      ok: true,
      holderName: ticket.holder_name,
      priceType: ticket.price_type,
    };
  });
}

export async function getDoorStats(eventId: string) {
  await requireDoorAccess(eventId);
  const rows = await db.execute(sql`
    SELECT 
      COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) as checked_in,
      COUNT(*) as total
    FROM tickets
    WHERE event_id = ${eventId} AND status = 'valid'
  `);
  
  return {
    checkedIn: Number(rows.rows[0]?.checked_in || 0),
    total: Number(rows.rows[0]?.total || 0),
  };
}

