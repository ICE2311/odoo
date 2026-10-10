import { getAdminOrders } from '@/server/data/admin/shop';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { formatPaise, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/empty-state';
import { ShoppingCart } from 'lucide-react';

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Merch Orders"
          subtitle="Track and manage merchandise orders"
        />
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Orders will appear here as members make purchases."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Merch Orders"
        subtitle={`${orders.length} orders • ${orders.filter((o) => o.status === 'pending_payment').length} pending payment`}
      />

      <div className="border border-border bg-card rounded-[var(--radius-md)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Collected At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-sm font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="font-semibold">{formatPaise(order.totalPaise)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.collectedAt ? formatDate(order.collectedAt) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
