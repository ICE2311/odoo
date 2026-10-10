PROMPT 4 — EVENTS, TICKETS, DOOR STAFF & CHECK-IN
Read PROJECT_SPEC.md (from Phase 0) first and follow it. Build ONLY this phase.
Scene: "Tickets for the spring gala go on sale online, with member and non-member prices and a seat limit. At the door, someone checks a ticket in seconds without a printed list. After the event the club knows how many showed up and how much it made."
Rules
Each event: title, slug, description, banner_url (public https link, PROJECT_SPEC §1c), venue, starts_at, ends_at, capacity, member_price_paise, non_member_price_paise, sales_open_at, sales_close_at, max_tickets_per_user (default 4), status draft|published|cancelled|completed.
Price is chosen on the server: caller is active member → member price for 1 ticket (their own); additional guest tickets in the same order are at non-member price. [ASSUMPTION]
Ticket price is snapshotted. If membership lapses later, the ticket stays valid.
Never oversell. Seats are held when checkout starts and released if payment fails/expires.
[ASSUMPTION] Online sales only; no cash sales at the door. Admins can still issue a complimentary ticket (₹0, reason required).
Build
Tables:
events(... as above, seats_sold INT DEFAULT 0, seats_held INT DEFAULT 0)
ticket_orders(id, user_id, event_id, qty, total_paise, status 'pending'|'paid'|'cancelled'|'refunded', payment_id, created_at)
tickets(id, order_id, event_id, owner_user_id, holder_name, price_type 'member'|'non_member'|'comp',
        price_paise, code UNIQUE, status 'valid'|'refunded'|'void',
        checked_in_at NULL, checked_in_by NULL)
event_door_staff(id, event_id, user_id, granted_by, granted_at, revoked_at NULL, UNIQUE(event_id,user_id))

Seat hold (atomic, no race conditions):
UPDATE events SET seats_held = seats_held + :qty
WHERE id=:id AND status='published' AND now() BETWEEN sales_open_at AND sales_close_at
  AND seats_sold + seats_held + :qty <= capacity
RETURNING id         -- if no row: "Sold out / not enough seats"

On capture: held → sold, create tickets. On fail/expire: held -= qty. 3. Register payment purpose ticket_order (computeAmount uses the rules above; onCaptured issues tickets + ledger 'ticket_sales' with event_id + emails tickets; onRefunded voids tickets, frees seats, ledger refund). 4. Ticket QR = signed token HMAC("t:" + ticket.id). Ticket page shows a big QR, event info, holder name; works offline once loaded (cache the page). 5. Public pages: /events (upcoming, published only, cached), /events/[slug] (details, both prices with "Members pay ₹X — Join" hint for non-members, live seats left, quantity picker, buy button; logged-out → login then back). 6. Account: /account/tickets (upcoming/past), /account/tickets/[id] (QR). Dashboard shows next ticket. 7. Admin: /admin/events (list with sold/capacity, revenue), /admin/events/new + /admin/events/[id] (edit, publish, close sales, cancel event → bulk refund with confirmation), attendee list (paginated, search), issue comp ticket, refund single ticket. 8. Door Staff assignment /admin/events/[id]/door-staff: search active members only, add/revoke. Show the access window.
requireDoorAccess(eventId):
    caller = requireMember()                 // must still be active member
    if caller.isAdmin: return caller         // admins can always scan
    row = event_door_staff WHERE event_id AND user_id=caller AND revoked_at IS NULL
    event = events.find(eventId)
    assert row AND now BETWEEN event.starts_at - 2h AND event.ends_at
    return caller

Note: admins pass even if not members — implement as: if isAdmin -> allow; else requireMember + assignment + window. 9. Check-in screen (shared component) used at /admin/events/[id]/check-in and /door/[eventId]:
Full-screen camera scanner, big result panel: 🟢 "Valid — Priya S. (Member ticket)" / 🟠 "Already checked in at 7:42 PM by Rahul" / 🔴 "Not valid for this event / refunded / unknown".
Result appears in under 1 second; sound/vibration feedback.
Manual search by name (min 2 chars), check-in button.
Live counter "142 / 300 checked in" (poll every 10s, tiny payload: two integers).
Can also scan a membership card QR → shows member active/inactive (uses verifyMemberQr).
checkIn(eventId, token):
    requireDoorAccess(eventId)
    ticketId = verifySignedToken(token, prefix 't:') or return INVALID
    UPDATE tickets SET checked_in_at=now(), checked_in_by=caller
      WHERE id=ticketId AND event_id=eventId AND status='valid' AND checked_in_at IS NULL
    if updated: return OK(holder_name, price_type)
    else: return reason (already in at X by Y / wrong event / refunded)

Door DTO contains ONLY: holder_name, price_type, status, checked_in_at, checked_in_by_name. 10. /door/[eventId] appears as a card on the assigned member's /account dashboard only while access is live. 11. Event report /admin/events/[id]/report: tickets sold (member vs non-member vs comp), checked in, no-shows, attendance %, gross revenue, refunds, net revenue (expenses linked in Phase 8 will appear here as "Costs" and "Profit" — leave the section ready). CSV export of attendees. 12. Completed status set automatically by cron after ends_at.
Checkpoint 4
Concurrency test: event with capacity 5, fire 20 simultaneous checkout attempts → exactly 5 seats sold, no oversell.
Member pays member price for 1 ticket; extra tickets at non-member price; non-member pays non-member price (test). Client-sent price ignored.
Abandoned checkout releases seats after hold expiry.
Ticket scan: valid → green; second scan → orange with time & scanner; other event's ticket → red; tampered QR → red; refunded → red.
Door Staff: can only be granted to active members; access fails before window, after window, after revoke, and after membership lapses; works inside window. Door Staff cannot open any other event or admin page.
Door DTO contains no email/phone/payment fields (test asserts keys).
Report numbers match the database (sold, checked-in, revenue = sum ledger ticket_sales − refunds for that event).
Cancel event → all tickets refunded in test mode, ledger refund entries created.
Manual walkthrough of the Spring Gala scene on a phone-sized screen: create gala → member buys → non-member buys → door staff scans both → report shows 2/2 attended and correct revenue.
STOP after the Checkpoint Report.

