PROMPT 5 — ANNOUNCEMENTS & MAILING LIST
Read PROJECT_SPEC.md (from Phase 0) first and follow it. Build ONLY this phase.
Scene: "Tell every member about a meeting, deadline or change of plan with one post that reaches everyone, and keep a record of what was said and when."
Rules
Audience: public (everyone, shown on website, emailed to all opted-in users) or members (only active members can see it on site; emailed to active members only).
Channels: web, email, or both.
Status: draft → scheduled → published. Published announcements are never deleted; they can be edited with an "Edited on…" note (store revisions) or archived.
Optional pinned and category (meeting, deadline, event, change of plan, general).
Transactional emails (tickets, receipts, reminders) ignore opt-out; announcement emails respect email_opt_in and include a one-click unsubscribe link (signed token).
Build
Tables:
announcements(id, slug, title, body_markdown, category, audience, channels[], pinned,
              status, scheduled_for NULL, published_at NULL, author_id, created_at, updated_at)
announcement_revisions(id, announcement_id, title, body_markdown, edited_by, edited_at)
announcement_deliveries(id, announcement_id, recipients_count, sent_count, failed_count, started_at, finished_at)

Admin /admin/announcements (history: title, audience, channels, published_at, author, recipients/sent counts) and /admin/announcements/new (markdown editor with preview, audience, channels, schedule or publish now, "Send test email to me").
Publish flow:
publish(id):
    requireAdmin()
    set status='published', published_at=now
    if 'web' in channels: revalidate announcements cache
    if 'email' in channels: enqueue send job
sendJob(id):
    recipients = audience=='members' ? activeMembers WHERE email_opt_in
                                     : allUsers WHERE email_opt_in
    enqueue one email_outbox row per recipient (kind='announcement', ref=announcement)
    the send-emails cron delivers them via Nodemailer in batches (PROJECT_SPEC §1b)
    announcement_deliveries counts are computed from email_outbox rows for this announcement
    update announcement_deliveries counts

Scheduled ones are published by cron /api/cron/publish-scheduled (every 5 min). 4. Public /announcements (public only, paginated, pinned first) and /announcements/[slug]. For members, the same pages also include members-only posts, with a "Members only" badge. Non-members get 404 on members-only slugs (don't leak existence). 5. /account dashboard shows latest 3 announcements the caller can see. 6. Unsubscribe page /unsubscribe?token= + toggle in /account/profile. 7. Email template: club header, title, body, "View on website" link, unsubscribe footer.
Checkpoint 5
Members-only announcement: visible to member@ and admin@ (if member or admin); invisible (404) to guest@, lapsed@ and visitors — test both the page and the data function.
Email recipient query: members-only → only active members with opt-in; public → all opted-in users (unit test with seed data, exact counts).
Unsubscribed user receives no announcement email but still receives a ticket email.
Scheduled announcement publishes automatically within 5 minutes of its time.
Editing a published post creates a revision and shows "Edited on…".
History page shows every post with date, author and delivery counts.
Public announcement list is cached and updates immediately after a new post (revalidation works).
Publishing to 500 seeded recipients returns to the admin instantly (emails are only queued); the send-emails cron delivers them in batches without hitting the serverless time limit or the SMTP rate limit; delivery counts on the history page match email_outbox.
STOP after the Checkpoint Report.
