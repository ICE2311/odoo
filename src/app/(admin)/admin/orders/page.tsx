import { getAdminOrders } from '@/server/data/admin/shop';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { formatPaise, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/empty-state';
import { ShoppingCart, Package } from 'lucide-react';
import { CollectOrderButton } from './collect-order-button';

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
        subtitle={`${orders.length} orders total • ${orders.filter((o: any) => o.status === 'paid').length} ready for pickup`}
      />

      <div className="border border-border bg-card rounded-[var(--radius-md)] overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items & Sizes</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => {
              const customerName = order.user?.name || order.user?.email?.split('@')[0] || 'Member';
              const items = order.items || [];

              return (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm font-bold text-foreground">
                    #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">{customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.user?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 max-w-xs">
                      {items.map((item: any, i: number) => (
                        <div key={item.id || i} className="text-xs text-foreground/90 flex items-center gap-1.5">
                          <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{item.productName}</span>
                          {item.variantLabel && (
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                              {item.variantLabel}
                            </span>
                          )}
                          <span className="text-muted-foreground">× {item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {formatPaise(order.totalPaise)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{formatDate(order.createdAt)}</div>
                    {order.collectedAt && (
                      <div className="text-emerald-600 font-medium text-[11px]">
                        Collected: {formatDate(order.collectedAt)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'paid' && (
                      <CollectOrderButton orderId={order.id} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

