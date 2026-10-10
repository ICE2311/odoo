import { getFinanceDashboardData, getLedger } from '@/server/data/admin/finance';
import { FinanceCharts } from './FinanceCharts';
import { addManualEntry, reverseEntry } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { db } from '@/server/db';
import { settings, events, fundraisers } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PlusCircle, Download, FileText, ArrowUpRight, ArrowDownRight, Wallet, Filter } from 'lucide-react';

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; customStart?: string; customEnd?: string; page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.period || 'all';
  let periodStart: Date | undefined = undefined;
  let periodEnd: Date | undefined = undefined;
  const now = new Date();

  if (period === 'month') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === 'semester') {
    const semestersResult = await db.select().from(settings).where(eq(settings.key, 'semesters'));
    if (semestersResult[0]?.valueJson) {
      const sems = semestersResult[0].valueJson as { name: string; start: string; end: string }[];
      const currentSem = sems.find((s) => new Date(s.start) <= now && new Date(s.end) >= now) || sems[sems.length - 1];
      if (currentSem) {
        periodStart = new Date(currentSem.start);
        periodEnd = new Date(currentSem.end);
      }
    }
  } else if (period === 'custom') {
    if (sp.customStart) periodStart = new Date(sp.customStart);
    if (sp.customEnd) periodEnd = new Date(sp.customEnd);
  }

  const [data, eventsList, fundraisersList] = await Promise.all([
    getFinanceDashboardData(periodStart, periodEnd),
    db.query.events.findMany({ columns: { id: true, title: true }, orderBy: [desc(events.startsAt)] }),
    db.query.fundraisers.findMany({ columns: { id: true, name: true }, orderBy: [desc(fundraisers.createdAt)] }),
  ]);

  const page = parseInt(sp.page || '1', 10);
  const categoryFilter = sp.category || 'all';
  const ledger = await getLedger(page, 20, { start: periodStart, end: periodEnd, category: categoryFilter });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Wallet className="w-8 h-8 text-primary" />
            Finance & Ledger
          </h1>
          <p className="text-muted-foreground mt-1">
            Club balance, period breakdown, double-entry ledger, and manual entry posting.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/finance/reports"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold shadow-sm transition-colors text-foreground"
          >
            <FileText className="w-4 h-4 text-primary" />
            Semester Reports & P&L
          </Link>
          <a
            href="/api/finance/export-ledger"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Period Filter Bar */}
      <Card className="rounded-2xl border border-border shadow-sm p-4 bg-card">
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Time Period
            </label>
            <select
              name="period"
              defaultValue={period}
              className="border border-border bg-input text-foreground px-3.5 py-2 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Start Date
                </label>
                <Input type="date" name="customStart" defaultValue={sp.customStart} className="h-9 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  End Date
                </label>
                <Input type="date" name="customEnd" defaultValue={sp.customEnd} className="h-9 rounded-xl" />
              </div>
            </>
          )}

          <Button type="submit" variant="secondary" className="rounded-xl h-9 px-4 font-semibold text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" /> Apply Filter
          </Button>
        </form>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Balance</div>
          <div className="text-3xl font-extrabold text-foreground mt-1">₹{(data.totalBalance / 100).toFixed(2)}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Total across all club accounts</p>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period Income</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1 flex items-baseline gap-1">
            <ArrowUpRight className="w-6 h-6 shrink-0 self-center text-emerald-600" />
            ₹{(data.periodIn / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Dues, tickets, merch & fundraisers</p>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period Expenses</div>
          <div className="text-3xl font-extrabold text-rose-600 mt-1 flex items-baseline gap-1">
            <ArrowDownRight className="w-6 h-6 shrink-0 self-center text-rose-600" />
            ₹{(data.periodOut / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Reimbursements, refunds & costs</p>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm p-5 bg-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Period Inflow</div>
          <div className="text-3xl font-extrabold text-primary mt-1">₹{(data.periodNet / 100).toFixed(2)}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Income minus expenses this period</p>
        </Card>
      </div>

      {/* Visual Charts */}
      <FinanceCharts inByCategory={data.inByCategory} outByCategory={data.outByCategory} monthlyTrend={data.monthlyTrend} />

      {/* ─── RECORD MANUAL LEDGER ENTRY FORM ─── */}
      <Card className="rounded-2xl border-2 border-primary/25 shadow-md p-6 bg-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" />
              Add Ledger Entry
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record offline dues, cash takings, manual sponsor income, or direct club expenditures.
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold text-xs self-start sm:self-auto">
            Double-Entry Append Only
          </Badge>
        </div>

        <form action={addManualEntry} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Direction
            </label>
            <select
              name="direction"
              className="w-full border border-border bg-input text-foreground p-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
              required
            >
              <option value="in">📈 Income (In)</option>
              <option value="out">📉 Expense (Out)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Category
            </label>
            <select
              name="category"
              className="w-full border border-border bg-input text-foreground p-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
              required
            >
              <option value="manual_income">Manual Income</option>
              <option value="manual_expense">Manual Expense</option>
              <option value="fundraiser_income">Fundraiser Takings</option>
              <option value="ticket_sales">Ticket Sales</option>
              <option value="membership_dues">Membership Dues</option>
              <option value="expense_reimbursement">Expense Reimbursement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Amount (₹)
            </label>
            <Input
              type="number"
              name="amount"
              placeholder="e.g. 500"
              required
              className="h-10 rounded-xl font-medium"
              step="0.01"
              min="0.01"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Payment Method
            </label>
            <select
              name="method"
              className="w-full border border-border bg-input text-foreground p-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
              required
            >
              <option value="cash">Cash in Hand</option>
              <option value="upi_manual">UPI Transfer</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Link Event / Fundraiser
            </label>
            <select
              name="eventId"
              className="w-full border border-border bg-input text-foreground p-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="">General Club Treasury</option>
              {eventsList.map((e) => (
                <option key={e.id} value={e.id}>
                  Event: {e.title}
                </option>
              ))}
              {fundraisersList.map((f) => (
                <option key={f.id} value={f.id}>
                  Fundraiser: {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Record Entry
            </Button>
          </div>

          <div className="sm:col-span-2 md:col-span-3 lg:col-span-6">
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              Description / Notes (Required)
            </label>
            <Input
              type="text"
              name="description"
              placeholder="e.g. Bake sale cash takings table 2, Sound equipment deposit, Sponsor contribution, etc."
              required
              className="h-10 rounded-xl font-medium"
            />
          </div>
        </form>
      </Card>

      {/* ─── LEDGER TABLE ─── */}
      <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Ledger Transactions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing page {page} of {ledger.totalPages || 1} ({ledger.totalCount} total entries)
            </p>
          </div>

          <form className="flex items-center gap-2">
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="customStart" value={sp.customStart || ''} />
            <input type="hidden" name="customEnd" value={sp.customEnd || ''} />
            <select
              name="category"
              defaultValue={categoryFilter}
              className="border border-border bg-input text-foreground px-3 py-1.5 rounded-xl text-xs font-semibold"
            >
              <option value="all">All Categories</option>
              <option value="membership_dues">Membership Dues</option>
              <option value="ticket_sales">Ticket Sales</option>
              <option value="merch_sales">Merch Sales</option>
              <option value="fundraiser_income">Fundraiser Income</option>
              <option value="expense_reimbursement">Expense Reimbursement</option>
              <option value="refund">Refunds</option>
              <option value="manual_income">Manual Income</option>
              <option value="manual_expense">Manual Expense</option>
            </select>
            <Button type="submit" variant="outline" size="sm" className="rounded-xl text-xs">
              Filter
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider bg-muted/20">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">In (+)</th>
                <th className="py-3 px-4 text-right">Out (-)</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledger.entries.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(e.occurredAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">{e.description}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs uppercase font-medium">
                      {e.category.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs uppercase text-muted-foreground font-mono">{e.method}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">
                    {e.direction === 'in' ? `₹${(e.amountPaise / 100).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600">
                    {e.direction === 'out' ? `₹${(e.amountPaise / 100).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {e.recordedByData?.name || e.recordedByData?.email || 'System'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <form
                      action={async () => {
                        'use server';
                        await reverseEntry(e.id);
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        disabled={e.description?.startsWith('Reversal of:')}
                        className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-7 px-2"
                      >
                        Reverse
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {ledger.entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No ledger entries found matching this period or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing page {page} of {ledger.totalPages || 1}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?period=${period}&page=${page - 1}&category=${categoryFilter}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted font-medium"
              >
                Previous
              </Link>
            )}
            {page < ledger.totalPages && (
              <Link
                href={`?period=${period}&page=${page + 1}&category=${categoryFilter}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted font-medium"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
