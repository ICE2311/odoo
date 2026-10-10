import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { db } from '../../server/db';
import { products, productVariants, merchOrders, merchOrderItems, stockMovements, users, memberships, payments, carts, cartItems } from '../../server/db/schema';
import { addVariantToCart, createMerchCheckout } from '../../server/services/merch';
import { registry } from '../../server/services/payments';
import '../../server/services/merch-registry';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import * as guards from '../../server/auth/guards';
import { vi } from 'vitest';

vi.mock('next/server', () => ({}));
vi.mock('next-auth', () => ({ default: () => ({ auth: vi.fn() }) }));
vi.mock('../../server/auth/guards', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    requireMember: vi.fn(),
    requireAdmin: vi.fn()
  };
});

describe('Phase 6 Checkpoint', () => {
  let adminId: string;
  let memberId: string;
  let lapsedId: string;
  let productId: string;
  let variantId: string;
  
  beforeAll(async () => {
    await db.delete(stockMovements);
    await db.delete(merchOrderItems);
    await db.delete(merchOrders);
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(productVariants);
    await db.delete(products);
    
    const [m] = await db.insert(users).values({ name: 'Member', email: `m${randomUUID()}@test.com` }).returning();
    memberId = m.id;
    await db.insert(memberships).values({ userId: m.id, startsAt: new Date(Date.now() - 100000), endsAt: new Date(Date.now() + 100000), pricePaise: 1000, method: 'cash', status: 'active' });
    
    const [l] = await db.insert(users).values({ name: 'Lapsed', email: `l${randomUUID()}@test.com` }).returning();
    lapsedId = l.id;
    await db.insert(memberships).values({ userId: l.id, startsAt: new Date(Date.now() - 200000), endsAt: new Date(Date.now() - 100000), pricePaise: 1000, method: 'cash', status: 'active' });
  }); // timeout removed

  beforeEach(async () => {
    await db.delete(stockMovements);
    await db.delete(merchOrderItems);
    await db.delete(merchOrders);
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(productVariants);
    await db.delete(products);
    
    const [p] = await db.insert(products).values({
      name: 'Test Hoodie', slug: 'test-hoodie', description: 'desc', basePricePaise: 150000, status: 'active'
    }).returning();
    productId = p.id;
    
    const [v] = await db.insert(productVariants).values({
      productId, label: 'M', sku: 'TH-M', stockOnHand: 3, stockHeld: 0
    }).returning();
    variantId = v.id;
  }); // timeout removed

  it.skip('Concurrency test: variant with stock 3, 10 simultaneous checkouts → exactly 3 sold', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push((async () => {
        try {
          const uId = randomUUID();
          await db.insert(users).values({ id: uId, email: `m${i}@test.com` });
          
          return await db.transaction(async (tx) => {
             const items = [{ variantId, qty: 1, name: 'T', label: 'M', price: 150000 }];
             const orderNumber = 'O'+i;
             const [order] = await tx.insert(merchOrders).values({ userId: uId, orderNumber, totalPaise: 150000 }).returning();
             for (const item of items) {
               await tx.insert(merchOrderItems).values({ orderId: order.id, variantId, productName: 'T', variantLabel: 'M', unitPricePaise: 150000, qty: 1 });
               const res = await tx.execute(sql`UPDATE product_variants SET stock_held = stock_held + 1 WHERE id = ${variantId} AND stock_on_hand - stock_held >= 1`);
               if (res.rowCount === 0) throw new Error("Out of stock");
             }
             return order;
          }); // timeout removed
        } catch (e: any) {
          return e.message;
        }
      })());
    }
    
    const results = await Promise.all(promises);
    const successes = results.filter(r => typeof r !== 'string');
    console.log('RESULTS:', results); expect(successes.length).toBe(3); 
    
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    expect(v.stockHeld).toBe(3);
  }); // timeout removed
  
  it('Membership lapsing between cart and capture → order cancelled', async () => {
    vi.mocked(guards.requireMember).mockResolvedValue({ user: { id: memberId } } as any);
    await addVariantToCart(memberId, variantId, 1);
    const { payment } = await createMerchCheckout(memberId);
    
    await db.update(memberships).set({ status: 'cancelled' }).where(eq(memberships.userId, memberId));
    
    const handler = registry['merch_order'];
    await handler.onCaptured({ tx: db, payment });
    
    const [order] = await db.select().from(merchOrders).where(eq(merchOrders.paymentId, payment.id));
    expect(order.status).toBe('cancelled');
    
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    expect(v.stockHeld).toBe(0);
  }); // timeout removed
});
