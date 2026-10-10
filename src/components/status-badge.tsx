import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const statusVariants = cva('inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold', {
  variants: {
    status: {
      // Order statuses
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-success/10 text-success',
      ready_for_pickup: 'bg-primary/10 text-primary',
      collected: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-muted text-muted-foreground',
      refunded: 'bg-warning/10 text-warning-foreground',

      // Membership statuses
      active: 'bg-success/10 text-success',
      lapsed: 'bg-destructive/10 text-destructive',
      pending: 'bg-yellow-100 text-yellow-800',

      // Expense claim statuses
      submitted: 'bg-primary/10 text-primary',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-destructive/10 text-destructive',
      withdrawn: 'bg-muted text-muted-foreground',

      // Event statuses
      open: 'bg-success/10 text-success',
      sold_out: 'bg-destructive/10 text-destructive',
      draft: 'bg-muted text-muted-foreground',
      archived: 'bg-slate-100 text-slate-800',
    },
  },
});

type StatusKey = NonNullable<VariantProps<typeof statusVariants>['status']>;

interface StatusBadgeProps {
  status: StatusKey;
  label?: string;
  dot?: boolean;
}

const statusLabels: Record<StatusKey, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  ready_for_pickup: 'Ready for Pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  active: 'Active',
  lapsed: 'Lapsed',
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  open: 'Open',
  sold_out: 'Sold Out',
  draft: 'Draft',
  archived: 'Archived',
};

export function StatusBadge({ status, label, dot }: StatusBadgeProps) {
  return (
    <span className={cn(statusVariants({ status }))}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label || statusLabels[status]}
    </span>
  );
}
