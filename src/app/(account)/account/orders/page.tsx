import { getMyMerchOrders } from '@/server/data/me/orders';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { formatPaise, formatDate } from '@/lib/format';
import { ShoppingBag } from 'lucide-react';

export default async function MyOrdersPage() {
  const orders = await getMyMerchOrders();

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="My Merch Orders"
          subtitle="Track your merchandise purchases"
        />
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Orders you place will appear here with tracking information."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Merch Orders"
        subtitle={`${orders.length} order${orders.length !== 1 ? 's' : ''}`}
      />

      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-border bg-card rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="font-mono text-sm font-semibold text-muted-foreground">
                  Order {order.orderNumber}
                </div>
                <h3 className="text-lg font-semibold mt-1">
                  {formatPaise(order.totalPaise)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Line items */}
            <div className="space-y-3 py-4 border-y border-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">{item.variantLabel} × {item.qty}</p>
                  </div>
                  <p className="font-semibold">{formatPaise(item.unitPricePaise * item.qty)}</p>
                </div>
              ))}
            </div>

            {/* Status info */}
            <div className="mt-4 space-y-2 text-sm">
              {order.status === 'ready_for_pickup' && (
                <p className="text-green-600 font-medium">✓ Ready for pickup</p>
              )}
              {order.status === 'collected' && (
                <p className="text-muted-foreground">
                  Collected on {formatDate(order.collectedAt!)}
                </p>
              )}
              {order.status === 'pending_payment' && (
                <p className="text-yellow-600 font-medium">Payment pending</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
