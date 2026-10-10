import { db } from '@/server/db';
import { tickets, events, auditLog, eventDoorStaff, users } from '@/server/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { requireUser, requireDoorAccess } from '@/server/auth/guards';
import crypto from 'crypto';

export function parseTicketInput(rawInput: string) {
  let cleaned = rawInput.trim();
  if (!cleaned) return null;

  // Strip wrapping quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // 1. Check for signed QR token format: "t:{uuid}:{sig}" or URL containing it
  const qrTokenMatch = cleaned.match(/(?:^|[/?#&=])t:([0-9a-f-]{36}):([0-9a-f]{64})(?:$|[/?#&=])/i);
  if (qrTokenMatch) {
    return {
      type: 'qr' as const,
      candidateId: qrTokenMatch[1],
      signature: qrTokenMatch[2],
    };
  }

  // 2. Check for ticket URL containing UUID e.g. /tickets/uuid
  const urlUuidMatch = cleaned.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (urlUuidMatch && (cleaned.includes('/') || cleaned.includes(':'))) {
    return {
      type: 'uuid' as const,
      ticketId: urlUuidMatch[0],
    };
  }

  // 3. Direct UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned)) {
    return {
      type: 'uuid' as const,
      ticketId: cleaned,
    };
  }

  // 4. Try JSON format e.g. {"id":"...", "code":"..."}
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.id) return { type: 'uuid' as const, ticketId: String(parsed.id) };
      if (parsed.code) return { type: 'code' as const, ticketCode: String(parsed.code).toUpperCase().trim() };
      if (parsed.qrToken) return parseTicketInput(String(parsed.qrToken));
    } catch {}
  }

  // 5. Short code (e.g. 8 alphanumeric chars like "84485FD0", "68993584")
  const codeCleaned = cleaned.replace(/^(?:code|ticket|#)\s*[:=]?\s*/i, '').trim().toUpperCase();
  return {
    type: 'code' as const,
    ticketCode: codeCleaned,
  };
}

export async function checkInTicket(
  eventId: string,
  rawInput: string,
  options?: { autoSwitch?: boolean }
) {
  const caller = await requireUser();

  const parsed = parseTicketInput(rawInput);
  if (!parsed) {
    return { ok: false as const, reason: 'INVALID_INPUT' };
  }

  let ticketId: string | null = null;
  let ticketCode: string | null = null;

  if (parsed.type === 'qr') {
    const candidateId = parsed.candidateId;
    const signature = parsed.signature;

    // Verify HMAC with all potential secrets
    const secrets = [
      process.env.QR_SIGNING_SECRET,
      process.env.AUTH_SECRET,
      'secret',
    ].filter(Boolean) as string[];

    const isValidSig = secrets.some((sec) => {
      const hmac = crypto.createHmac('sha256', sec);
      hmac.update(`t:${candidateId}`);
      return hmac.digest('hex') === signature;
    });

    if (isValidSig) {
      ticketId = candidateId;
    } else {
      // Fallback: If UUID is valid, still attempt lookup in DB
      ticketId = candidateId;
    }
  } else if (parsed.type === 'uuid') {
    ticketId = parsed.ticketId;
  } else if (parsed.type === 'code') {
    ticketCode = parsed.ticketCode;
  }

  return await db.transaction(async (tx) => {
    let ticketRows;
    if (ticketId) {
      ticketRows = await tx.execute(
        sql`SELECT t.id, t.event_id, t.status, t.checked_in_at, t.checked_in_by, t.holder_name, t.price_type, t.code
            FROM tickets t
            WHERE t.id = ${ticketId} FOR UPDATE`
      );
    } else if (ticketCode) {
      ticketRows = await tx.execute(
        sql`SELECT t.id, t.event_id, t.status, t.checked_in_at, t.checked_in_by, t.holder_name, t.price_type, t.code
            FROM tickets t
            WHERE UPPER(t.code) = ${ticketCode} FOR UPDATE`
      );
    } else {
      return { ok: false as const, reason: 'INVALID_INPUT' };
    }

    if (!ticketRows || ticketRows.rows.length === 0) {
      return { ok: false as const, reason: 'TICKET_NOT_FOUND', input: rawInput };
    }
    const ticket = ticketRows.rows[0] as any;

    // Retrieve the event details for this ticket
    const ticketEvent = await tx.query.events.findFirst({
      where: eq(events.id, ticket.event_id),
      columns: { id: true, title: true, startsAt: true, venue: true },
    });

    // Check caller permission for this ticket's event (admins and active members can check in)
    if (!caller.isAdmin && !caller.isMember) {
      const activeStaff = await tx.query.eventDoorStaff.findFirst({
        where: and(
          eq(eventDoorStaff.eventId, ticket.event_id),
          eq(eventDoorStaff.userId, caller.user.id),
          isNull(eventDoorStaff.revokedAt)
        ),
      });
      if (!activeStaff) {
        return {
          ok: false as const,
          reason: 'FORBIDDEN_EVENT',
          ticketEventTitle: ticketEvent?.title,
          message: `You do not have door staff permissions for "${ticketEvent?.title || 'this event'}".`,
        };
      }
    }

    // Check if the scanned ticket belongs to the selected event
    const isTargetEvent = !eventId || eventId === 'auto' || ticket.event_id === eventId;
    const shouldAutoSwitch = options?.autoSwitch !== false || caller.isAdmin;

    if (!isTargetEvent && !shouldAutoSwitch) {
      return {
        ok: false as const,
        reason: 'WRONG_EVENT',
        ticketId: ticket.id,
        holderName: ticket.holder_name,
        code: ticket.code,
        actualEventId: ticket.event_id,
        actualEventTitle: ticketEvent?.title,
        actualEventDate: ticketEvent?.startsAt
          ? new Date(ticketEvent.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
          : '',
      };
    }

    // Status checks
    if (ticket.status === 'refunded') {
      return { ok: false as const, reason: 'REFUNDED', holderName: ticket.holder_name, code: ticket.code };
    }
    if (ticket.status === 'void') {
      return { ok: false as const, reason: 'VOID', holderName: ticket.holder_name, code: ticket.code };
    }

    if (ticket.checked_in_at) {
      let checkedInByName = 'Door Staff';
      if (ticket.checked_in_by) {
        const staffUser = await tx.query.users.findFirst({
          where: eq(users.id, ticket.checked_in_by),
          columns: { name: true },
        });
        if (staffUser?.name) checkedInByName = staffUser.name;
      }

      return {
        ok: false as const,
        reason: 'ALREADY_CHECKED_IN',
        holderName: ticket.holder_name,
        code: ticket.code,
        checkedInAt: ticket.checked_in_at,
        checkedInBy: checkedInByName,
        eventTitle: ticketEvent?.title,
      };
    }

    const checkInTime = new Date();
    await tx.execute(
      sql`UPDATE tickets SET checked_in_at = ${checkInTime}, checked_in_by = ${caller.user.id} WHERE id = ${ticket.id}`
    );

    // Audit log
    await tx.insert(auditLog).values({
      actorId: caller.user.id,
      action: 'ticket.check_in',
      entityType: 'ticket',
      entityId: ticket.id,
      beforeJson: { checkedInAt: null },
      afterJson: {
        checkedInAt: checkInTime.toISOString(),
        checkedInBy: caller.user.id,
        eventId: ticket.event_id,
        holderName: ticket.holder_name,
        code: ticket.code,
      },
    });

    const isSwitched = Boolean(eventId && eventId !== 'auto' && ticket.event_id !== eventId);

    return {
      ok: true as const,
      ticketId: ticket.id,
      holderName: ticket.holder_name,
      priceType: ticket.price_type,
      code: ticket.code,
      checkedInAt: checkInTime.toISOString(),
      eventId: ticket.event_id,
      eventTitle: ticketEvent?.title,
      switchedEvent: isSwitched && ticketEvent
        ? { id: ticketEvent.id, title: ticketEvent.title }
        : undefined,
    };
  });
}

export async function getDoorStats(eventId: string) {
  if (eventId && eventId !== 'auto') {
    await requireDoorAccess(eventId);
    const rows = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) as checked_in,
        COUNT(*) as total
      FROM tickets
      WHERE event_id = ${eventId} AND status = 'valid'
    `);

    const checkedIn = Number(rows.rows[0]?.checked_in || 0);
    const total = Number(rows.rows[0]?.total || 0);
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return { checkedIn, total, percentage };
  } else {
    const caller = await requireUser();
    if (!caller.isAdmin && !caller.isMember) {
      return { checkedIn: 0, total: 0, percentage: 0 };
    }
    const rows = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) as checked_in,
        COUNT(*) as total
      FROM tickets
      WHERE status = 'valid'
    `);

    const checkedIn = Number(rows.rows[0]?.checked_in || 0);
    const total = Number(rows.rows[0]?.total || 0);
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return { checkedIn, total, percentage };
  }
}

export async function getRecentCheckIns(eventId?: string, limit = 20) {
  if (eventId && eventId !== 'auto') {
    await requireDoorAccess(eventId);
    const rows = await db.execute(sql`
      SELECT 
        t.id, 
        t.holder_name as "holderName", 
        t.price_type as "priceType", 
        t.code, 
        t.checked_in_at as "checkedInAt",
        u.name as "checkedInByName",
        e.title as "eventTitle"
      FROM tickets t
      LEFT JOIN users u ON t.checked_in_by = u.id
      LEFT JOIN events e ON t.event_id = e.id
      WHERE t.event_id = ${eventId} AND t.checked_in_at IS NOT NULL
      ORDER BY t.checked_in_at DESC
      LIMIT ${limit}
    `);

    return rows.rows as Array<{
      id: string;
      holderName: string;
      priceType: string;
      code: string;
      checkedInAt: string;
      checkedInByName: string | null;
      eventTitle: string | null;
    }>;
  } else {
    const caller = await requireUser();
    const rows = await db.execute(sql`
      SELECT 
        t.id, 
        t.holder_name as "holderName", 
        t.price_type as "priceType", 
        t.code, 
        t.checked_in_at as "checkedInAt",
        u.name as "checkedInByName",
        e.title as "eventTitle"
      FROM tickets t
      LEFT JOIN users u ON t.checked_in_by = u.id
      LEFT JOIN events e ON t.event_id = e.id
      WHERE t.checked_in_at IS NOT NULL
      ORDER BY t.checked_in_at DESC
      LIMIT ${limit}
    `);

    return rows.rows as Array<{
      id: string;
      holderName: string;
      priceType: string;
      code: string;
      checkedInAt: string;
      checkedInByName: string | null;
      eventTitle: string | null;
    }>;
  }
}

export async function getCheckInEvents() {
  const eventsList = await db.query.events.findMany({
    orderBy: [desc(events.startsAt)],
  });

  return eventsList.map((e) => ({
    id: e.id,
    title: e.title,
    venue: e.venue,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    capacity: e.capacity,
    status: e.status,
  }));
}

