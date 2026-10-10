import { getAdminProducts } from '@/server/data/admin/shop';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { formatPaise, formatDate } from '@/lib/format';

export default async function AdminShopPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Merch Shop Management"
        subtitle={`${products.length} products`}
      />

      <div className="border border-border bg-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stockOnHand, 0);
              const totalHeld = product.variants.reduce((sum, v) => sum + v.stockHeld, 0);
              const available = totalStock - totalHeld;

              return (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium max-w-xs truncate">{product.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="font-semibold">{formatPaise(product.basePricePaise)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="space-y-1">
                      {product.variants.map((v) => {
                        const vAvailable = v.stockOnHand - v.stockHeld;
                        return (
                          <div key={v.id} className="flex items-center gap-2 text-xs">
                            <span className="font-medium">{v.label}</span>
                            <span className={vAvailable > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                              {vAvailable}/{v.stockOnHand}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{available}/{totalStock}</span>
                    <span className="text-sm text-muted-foreground ml-2">({totalHeld} held)</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(product.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
