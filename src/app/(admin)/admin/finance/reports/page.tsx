import { getSemesterReport, getPerEventPnL, getPerFundraiserPnL, getMerchReport, getMembershipReport, reconcile } from '@/server/data/admin/finance';
import Link from 'next/link';
import { PrintReportButton } from './print-button';
import { 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Ticket, 
  HeartHandshake, 
  ShoppingBag, 
  Users, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

function formatCategory(cat: string): string {
  return cat
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatINR(paise: number): string {
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function FinanceReportsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ runReconcile?: string }> 
}) {
  const semesterStart = new Date(new Date().getFullYear(), 7, 1); // Fall semester start (Aug 1)
  
  const [semester, eventPnL, frPnL, merch, membership] = await Promise.all([
    getSemesterReport(semesterStart),
    getPerEventPnL(),
    getPerFundraiserPnL(),
    getMerchReport(),
    getMembershipReport()
  ]);

  let mismatches: string[] | null = null;
  const sp = await searchParams;
  if (sp.runReconcile === 'true') {
    mismatches = await reconcile();
  }

  const netCashFlow = semester.totalIn - semester.totalOut;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-8 sm:space-y-10">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3 print:hidden">
        <Link 
          href="/admin/finance" 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Finance & Ledger</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
              <span>Semester Finance Reports</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Comprehensive P&L, category cash flows, stock metrics, and reconciliation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <Link 
              href="/admin/finance/reports?runReconcile=true" 
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span>Reconcile Check</span>
            </Link>
            <PrintReportButton />
          </div>
        </div>
      </div>

      {/* Reconciliation Feedback Banner */}
      {mismatches !== null && (
        <div 
          className={`p-4 sm:p-5 border rounded-2xl shadow-sm print:hidden ${
            mismatches.length === 0 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {mismatches.length === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold">
                {mismatches.length === 0 ? 'Ledger Reconciled Perfectly' : `Found ${mismatches.length} Reconciliation Mismatches`}
              </h2>
              {mismatches.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  All module totals (tickets, merch, memberships, expenses) align exactly with ledger postings.
                </p>
              ) : (
                <ul className="mt-2 list-disc list-inside text-xs sm:text-sm space-y-1 font-mono break-words">
                  {mismatches.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Semester Report & Cash Flow */}
      <section className="space-y-4 sm:space-y-6">
        <div className="border-b border-border pb-2.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            <span>Semester Cash Flow (Since Aug 1)</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Opening balance, aggregated income, expenditures, and net closing funds.
          </p>
        </div>

        {/* Balance Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opening Balance</span>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatINR(semester.openingBalance)}
            </div>
            <p className="text-[11px] text-muted-foreground">Prior to Aug 1 semester start</p>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Semester Flow</span>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight font-mono flex items-center gap-1 ${
              netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {netCashFlow >= 0 ? <ArrowUpRight className="w-5 h-5 shrink-0" /> : <ArrowDownRight className="w-5 h-5 shrink-0" />}
              <span>{formatINR(Math.abs(netCashFlow))}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {netCashFlow >= 0 ? 'Net surplus generated' : 'Net expenditure deficit'}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm space-y-1">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Closing Balance</span>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-primary font-mono">
              {formatINR(semester.closingBalance)}
            </div>
            <p className="text-[11px] text-muted-foreground">Current total available treasury</p>
          </div>
        </div>

        {/* Money In vs Money Out Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Money In Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-foreground">Money In (Income)</h3>
              </div>
              <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatINR(semester.totalIn)}
              </span>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              {Object.keys(semester.inCategories).length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">No income transactions recorded.</p>
              ) : (
                <div className="divide-y divide-border/60 text-xs sm:text-sm">
                  {Object.entries(semester.inCategories).map(([cat, val]) => (
                    <div key={cat} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-foreground font-medium truncate">{formatCategory(cat)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium shrink-0">
                        {formatINR(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-foreground">Total Inflow</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatINR(semester.totalIn)}
                </span>
              </div>
            </div>
          </div>

          {/* Money Out Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-foreground">Money Out (Expenses)</h3>
              </div>
              <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                {formatINR(semester.totalOut)}
              </span>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              {Object.keys(semester.outCategories).length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">No expense transactions recorded.</p>
              ) : (
                <div className="divide-y divide-border/60 text-xs sm:text-sm">
                  {Object.entries(semester.outCategories).map(([cat, val]) => (
                    <div key={cat} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-foreground font-medium truncate">{formatCategory(cat)}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-mono font-medium shrink-0">
                        {formatINR(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-foreground">Total Outflow</span>
                <span className="text-rose-600 dark:text-rose-400 font-mono">
                  {formatINR(semester.totalOut)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Per-Event P&L */}
      <section className="space-y-4">
        <div className="border-b border-border pb-2.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary shrink-0" />
            <span>Per-Event Profit & Loss</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Turnout, ticket revenues, refunds, direct expenses, and net yield per event.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Tickets / Cap</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Attendance</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Revenue</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Refunds</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Expenses</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {eventPnL.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No events registered in this period.
                    </td>
                  </tr>
                ) : (
                  eventPnL.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[220px] truncate" title={e.title}>
                        {e.title}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono text-muted-foreground">
                        {e.ticketsSold} / {e.capacity || '—'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground">
                          {e.attendancePercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-emerald-600 dark:text-emerald-400">
                        {formatINR(e.ticketRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-rose-600 dark:text-rose-400">
                        {formatINR(e.refunds)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-rose-600 dark:text-rose-400">
                        {formatINR(e.expenses)}
                      </td>
                      <td className={`px-4 py-3 text-right whitespace-nowrap font-mono font-bold ${
                        e.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatINR(e.profit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 3: Per-Fundraiser P&L */}
      <section className="space-y-4">
        <div className="border-b border-border pb-2.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-primary shrink-0" />
            <span>Per-Fundraiser Profit & Loss</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Fundraising campaign goals, collections, reimbursable costs, and net proceeds.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Fundraiser</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Goal</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Takings</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Expenses</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Profit</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">% of Goal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {frPnL.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No fundraisers recorded in this period.
                    </td>
                  </tr>
                ) : (
                  frPnL.map((f) => {
                    const percentOfGoal = f.goal > 0 ? Math.round((f.profit / f.goal) * 100) : 0;
                    return (
                      <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground max-w-[220px] truncate" title={f.name}>
                          {f.name}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-muted-foreground">
                          {formatINR(f.goal)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-emerald-600 dark:text-emerald-400">
                          {formatINR(f.takings)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-rose-600 dark:text-rose-400">
                          {formatINR(f.expenses)}
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap font-mono font-bold ${
                          f.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {formatINR(f.profit)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            percentOfGoal >= 100 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-muted text-foreground'
                          }`}>
                            {percentOfGoal}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 4: Merch Sales & Stock */}
      <section className="space-y-4">
        <div className="border-b border-border pb-2.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary shrink-0" />
            <span>Merch Sales & Stock Performance</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Inventory on hand, units fulfilled, and gross revenue by variant.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Variant</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Stock On Hand</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Units Sold</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {merch.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No merchandise inventory registered.
                    </td>
                  </tr>
                ) : (
                  merch.map((m) => (
                    <tr key={m.variantId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {m.productName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {m.variantLabel}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                          m.stockOnHand <= 5 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                            : 'bg-muted text-foreground'
                        }`}>
                          {m.stockOnHand}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono font-medium text-foreground">
                        {m.unitsSold}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(m.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Membership Overview */}
      <section className="space-y-4 break-inside-avoid">
        <div className="border-b border-border pb-2.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <span>Membership Overview</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Roster metrics, member acquisition vs renewals, and dues payment methods.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm text-center flex flex-col justify-center items-center">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
              {membership.activeCount}
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Active Members</div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm text-center flex flex-col justify-center items-center">
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-bold font-mono text-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">{membership.newCount} New</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-primary">{membership.renewedCount} Renewed</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Member Composition</div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm text-center flex flex-col justify-center items-center">
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-bold font-mono text-foreground">
              <span className="text-foreground">{membership.onlineCount} Online</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground">{membership.cashCount} Cash</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Payment Methods</div>
          </div>
        </div>
      </section>
    </div>
  );
}
