PROMPT 9 — FINANCE DASHBOARD, REPORTS & ADMIN OVERVIEW
Read PROJECT_SPEC.md (from Phase 0) first and follow it. Build ONLY this phase.
Scene: "At the end of semester the treasurer explains where the money went: dues, tickets, merch, every reimbursed expense. One place shows what came in, what went out and how much is left, understandable at a glance."
Build
/admin/finance (replace the temporary page):
Top cards: Balance, In (period), Out (period), Net (period). Period picker: this month / this semester / custom / all time. [ASSUMPTION] Semesters defined in settings (semesters: [{name, start, end}]).
"Money in by source" (dues, tickets, merch, fundraisers, manual) and "Money out by type" (reimbursements, refunds, manual) — simple horizontal bar charts with exact ₹ values.
Monthly in vs out chart for the period.
Ledger table: date, description, category, method, in/out amount, linked event/fundraiser, recorded by; filters; paginated; CSV export.
Manual entry form (from Phase 2) kept, with required note; reversing entry button ("Reverse this entry") instead of edit/delete.
/admin/finance/reports:
Semester report: opening balance, total in by category, total out by category, closing balance — must reconcile: opening + in − out = closing.
Per-event P&L: ticket revenue − refunds − linked expenses = profit; attendance %.
Per-fundraiser P&L: takings − linked expenses vs goal.
Merch report: units and revenue by product and size, remaining stock.
Membership report: new vs renewed, cash vs online, active count.
Export each as CSV and as a printable page (print CSS) for PDF.
All report numbers computed with SQL aggregates in a single query per report (no loading all rows into JS).
/admin overview dashboard (one aggregated call): balance, active members, memberships expiring in 30 days, upcoming events with sold/capacity, pending expense claims count and total, low-stock variants, at-risk fundraisers, latest announcements. Every card links to its page.
Reconciliation check function reconcile() (admin button + nightly cron): verifies each module total equals its ledger category total (memberships paid vs ledger dues, ticket orders vs ticket_sales, merch orders vs merch_sales, paid claims vs reimbursements, captured Razorpay payments vs ledger razorpay entries). Shows ✅ or lists mismatches.
Checkpoint 9
With seed data from all phases, reconcile() returns zero mismatches.
Semester report: opening + in − out = closing (test with seed data).
Per-event and per-fundraiser P&L match hand-calculated numbers from the seed (write the expected values in the test).
Ledger CSV export opens correctly in Excel/Sheets (₹ amounts as numbers, dates IST).
Admin dashboard loads in one server request (verify via logs/test) and under 1s locally with 5,000 seeded ledger rows.
Role matrix: every finance/report function → Admin only.
Manual: a non-technical person can answer "how much did the gala make?" and "how much is left?" within 10 seconds of opening the finance page.
STOP after the Checkpoint Report.

