import { getMyMerchOrders } from '@/server/data/me/orders';
import { Package, Calendar } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';

export default async function MyOrdersPage() {
  const orders = await getMyMerchOrders();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merch Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and view your purchased Skyline merchandise.
          </p>
        </div>
        <Link
          href="/shop"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
        >
          Browse Shop
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-[var(--radius-xl)] border border-border shadow-sm">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No orders yet</h3>
          <p className="text-muted-foreground mb-6">You haven't ordered any merchandise.</p>
          <Link href="/shop" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
            Browse Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const orderNum = order.orderNumber || order.id.slice(0, 8).toUpperCase();
            const totalPaise = order.totalPaise ?? order.totalAmount ?? 0;
            const items = order.items || [];

            return (
              <div
                key={order.id}
                className="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-base">Order #{orderNum}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs uppercase font-semibold text-muted-foreground">Total Paid</div>
                    <div className="text-lg font-bold text-foreground">₹{(totalPaise / 100).toFixed(2)}</div>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Items ({items.reduce((acc: number, i: any) => acc + (i.qty || 1), 0)})
                  </div>
                  <div className="divide-y divide-border/60 rounded-lg bg-muted/30 px-3">
                    {items.map((item: any, idx: number) => (
                      <div key={item.id || idx} className="py-2.5 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.productName || 'Merch Item'}</span>
                          {item.variantLabel && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-secondary/15 text-secondary">
                              Size / Option: {item.variantLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                          <span>Qty: {item.qty}</span>
                          <span className="font-semibold text-foreground">
                            ₹{(((item.unitPricePaise || 0) * (item.qty || 1)) / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
