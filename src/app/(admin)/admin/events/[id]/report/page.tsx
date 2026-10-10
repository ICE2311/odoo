import { requireAdmin } from '@/server/auth/guards';
import { getAdminEvent, getEventReport } from '@/server/data/admin/events';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  IndianRupee,
  TrendingUp,
  Receipt,
  RotateCcw,
  QrCode,
  Award,
} from 'lucide-react';
import { formatPaise } from '@/lib/format';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventReportPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const event = await getAdminEvent(id);
  if (!event) notFound();

  const report = await getEventReport(id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Financial & Attendance Report: {event.title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Held at {event.venue} on {new Date(event.startsAt).toLocaleDateString()} • Status:{' '}
            <span className="font-semibold uppercase">{event.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/${event.id}`}
            className="px-3 py-1.5 border rounded-[var(--radius-md)] text-xs font-semibold hover:bg-muted text-foreground transition-colors"
          >
            Edit Event
          </Link>
          <Link
            href={`/admin/events/${event.id}/door-staff`}
            className="px-3 py-1.5 bg-primary/10 text-primary rounded-[var(--radius-md)] text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            Door Staff
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Net Profit</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {formatPaise(report.netRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Gross minus refunds & costs</p>
        </div>

        <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tickets Sold</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {report.ticketsSold.total}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              / {event.capacity}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {Math.round((report.ticketsSold.total / event.capacity) * 100)}% capacity filled
          </p>
        </div>

        <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Attendance</span>
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {Math.round(report.attendancePercent)}%
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {report.checkedIn} checked in • {report.noShows} no-shows
          </p>
        </div>

        <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Linked Expenses</span>
            <Receipt className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {formatPaise(report.expenses)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Reimbursed event costs</p>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-bold text-foreground">Revenue & Expense Breakdown</h2>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Gross Ticket Revenue</span>
            <span className="font-semibold text-foreground">{formatPaise(report.grossRevenue)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Refunds Issued</span>
            <span className="font-semibold text-destructive">
              - {formatPaise(report.refunds)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Direct Event Costs (Reimbursements)</span>
            <span className="font-semibold text-destructive">
              - {formatPaise(report.expenses)}
            </span>
          </div>
          <div className="flex justify-between py-3 font-bold text-base bg-muted/30 px-3 rounded-[var(--radius-md)]">
            <span>Net Event Balance</span>
            <span className={report.netRevenue >= 0 ? 'text-success' : 'text-destructive'}>
              {formatPaise(report.netRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Distribution Breakdown */}
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-bold text-foreground">Ticket Distribution</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/40 rounded-[var(--radius-lg)]">
            <div className="text-xs font-semibold text-muted-foreground uppercase">
              Member Tickets
            </div>
            <div className="text-2xl font-bold text-primary mt-1">
              {report.ticketsSold.member}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              @ {formatPaise(event.memberPricePaise)}
            </div>
          </div>

          <div className="p-4 bg-muted/40 rounded-[var(--radius-lg)]">
            <div className="text-xs font-semibold text-muted-foreground uppercase">
              Non-Member Tickets
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {report.ticketsSold.nonMember}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              @ {formatPaise(event.nonMemberPricePaise)}
            </div>
          </div>

          <div className="p-4 bg-muted/40 rounded-[var(--radius-lg)]">
            <div className="text-xs font-semibold text-muted-foreground uppercase">
              Comp / Guest Tickets
            </div>
            <div className="text-2xl font-bold text-muted-foreground mt-1">
              {report.ticketsSold.comp}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Free admission</div>
          </div>
        </div>
      </div>
    </div>
  );
}

