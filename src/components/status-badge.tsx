import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const statusVariants = cva('inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold', {
  variants: {
    status: {
      // Order statuses
      pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      ready_for_pickup: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      collected: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',

      // Membership statuses
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      lapsed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',

      // Expense claim statuses
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',

      // Event statuses
      open: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      sold_out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      archived: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
    },
  },
});

type StatusKey = keyof typeof statusVariants.variants.status;

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

