'use server';

import { db } from '../db';
import { products, productVariants, stockMovements, merchOrders } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '../auth/guards';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const publicUrl = z.string().trim().max(2048).url().refine(u => u.startsWith('https:'), "Must be https");

export async function createOrUpdateProduct(data: any) {
  const admin = await requireAdmin();
  
  if (data.id) {
    await db.update(products).set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePricePaise: data.basePricePaise,
      imageUrls: data.imageUrls,
      status: data.status,
      maxPerUser: data.maxPerUser
    }).where(eq(products.id, data.id));
  } else {
    const [p] = await db.insert(products).values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePricePaise: data.basePricePaise,
      imageUrls: data.imageUrls,
      status: data.status,
      maxPerUser: data.maxPerUser
    }).returning();
    data.id = p.id;
  }
  
  revalidatePath('/shop');
  revalidatePath('/admin/shop');
  return { success: true, productId: data.id };
}

export async function adjustStock(variantId: string, delta: number, reason: 'restock' | 'adjustment') {
  const admin = await requireAdmin();
  
  await db.transaction(async (tx) => {
    await tx.execute(sql`UPDATE product_variants SET stock_on_hand = stock_on_hand + ${delta} WHERE id = ${variantId}`);
    await tx.insert(stockMovements).values({
      variantId,
      delta,
      reason,
      by: admin.user.id
    });
  });
  
  revalidatePath('/admin/shop');
}

export async function markOrderCollected(orderId: string) {
  const admin = await requireAdmin();
  const [order] = await db.select().from(merchOrders).where(eq(merchOrders.id, orderId));
  if (!order) throw new Error("Order not found");
  if (order.status === 'collected') throw new Error("already collected at " + order.collectedAt?.toISOString());
  
  await db.update(merchOrders).set({
    status: 'collected',
    collectedAt: new Date(),
    collectedBy: admin.user.id
  }).where(eq(merchOrders.id, orderId));
  
  revalidatePath('/admin/orders');
  return { success: true };
}
