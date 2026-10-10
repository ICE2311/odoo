import { requireAdmin } from '@/server/auth/guards';
import { getAdminProducts } from '@/server/data/admin/shop';
import { ShopClient } from './shop-client';

export default async function AdminShopPage() {
  await requireAdmin();
  const products = await getAdminProducts();

  return <ShopClient initialProducts={products as any} />;
}
