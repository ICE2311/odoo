PROMPT 8 — VOLUNTEER EXPENSE REIMBURSEMENTS
Read PROJECT_SPEC.md (from Phase 0) first and follow it. Build ONLY this phase.
Scene: "Volunteer expenses get reimbursed only after chasing receipts."
Rules
Only active members can submit claims. Every claim needs at least one receipt link (a publicly accessible https URL to an image or PDF, e.g. Google Drive "Anyone with the link"). No file uploads.
Flow: submitted → approved → paid or submitted → rejected (reason required). Submitter can edit/withdraw only while submitted.
[ASSUMPTION] The approving admin cannot approve their own claim (another admin must).
If membership lapses: already-submitted claims continue to be processed; no new claims until renewal.
Claims can be linked to an event or fundraiser (optional) so per-event/per-fundraiser costs and profit can be reported. If the linked fundraiser/event has a budget, show "₹X of ₹Y budget used" to the approver and warn if over budget.
Mark paid: admin enters payout method (UPI/bank/cash) + reference → creates ledger out entry expense_reimbursement (with event_id/fundraiser_id) in the same transaction.
Build
Tables:
expense_claims(id, claimant_id, title, description, amount_paise, spent_on DATE,
               event_id NULL, fundraiser_id NULL, receipt_urls TEXT[] (1–5 links, PROJECT_SPEC §1c),
               status 'submitted'|'approved'|'rejected'|'paid'|'withdrawn',
               reviewed_by NULL, reviewed_at NULL, rejection_reason NULL,
               paid_by NULL, paid_at NULL, payout_method NULL, payout_ref NULL,
               payee_upi_id NULL, created_at)

Receipts: validated with the shared publicUrl schema and normalised with normaliseShareLink(). Receipt URLs appear only in DTOs for the claimant and admins. Admin view shows an inline preview via <RemoteImage> when the link is an image, otherwise an "Open receipt ↗" button. If the link is broken, admin can reject with reason "Receipt link not accessible" or set status back to submitted with a note asking the member to fix the link (member can then edit links).
Member /expenses (my claims with status chips, totals pending/paid) and /expenses/new (mobile-first form: amount, what for, date, link to event/fundraiser dropdown of active ones, paste receipt link(s) with live preview + "make sure anyone with the link can view it" hint, UPI ID for payout).
Admin /admin/expenses: queue tabs (Submitted / Approved-awaiting-payment / Paid / Rejected), detail drawer with receipt preview, budget usage, approve / reject (reason) / mark paid (method + reference). Bulk "mark paid" for approved claims.
Emails: claim received, approved, rejected (with reason), paid (with reference).
Event report (Phase 4) and fundraiser page (Phase 7) now show linked paid expenses as Costs and compute Net/Profit.
Checkpoint 8
Role matrix: submit → active member only; lapsed@ 403 for new claim but their previously submitted claim can still be approved & paid; list/approve/pay → admin only; receipt URLs → returned only to the claimant or admins (another member requesting the claim gets 403/404, and receipt_urls never appear in any other DTO).
Self-approval blocked.
Mark paid creates exactly one ledger entry; calling it twice does not double-pay (idempotent).
Receipt link validation: rejects http://, javascript:, data:, localhost, IP addresses and malformed URLs; accepts https Drive/Dropbox/image links and normalises Drive/Dropbox share links (unit tests). No code path fetches the URL server-side (grep + test).
Event report and fundraiser page show correct costs and profit after a paid claim.
Manual walkthrough: member submits ₹850 claim with a Google Drive receipt link for "Bake Sale supplies" from a phone → admin approves → marks paid with UPI ref → member sees "Paid", ledger shows the out entry.
STOP after the Checkpoint Report.

