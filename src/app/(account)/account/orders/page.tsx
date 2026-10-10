import { getMyMerchOrders } from '@/server/data/me/orders';
import { Package, Calendar } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';

export default async function MyOrdersPage() {
  const orders = await getMyMerchOrders();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Merch Orders</h1>
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
        <div className="bg-card border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Order ID</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Items</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Total</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-muted/80 even:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        #{order.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {order.items.reduce((acc: number, i: any) => acc + i.quantity, 0)} items
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      ₹{(order.totalAmount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
