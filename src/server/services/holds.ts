import { db } from '@/server/db';
import { 
  payments, settings, ticketOrders, merchOrders, 
  events, productVariants, merchOrderItems 
} from '@/server/db/schema';
import { lte, eq, and, sql } from 'drizzle-orm';
import { registry } from './payment-registry';

// Ensure purpose handlers are loaded
import './membership';
import './merch-registry';
import './ticket-registry';
import './test_purchase';

/**
 * Retrieves the configured hold duration in minutes from the settings table.
 * Defaults to 15 minutes as per PROJECT_SPEC §1e.
 */
export async function getHoldMinutes(): Promise<number> {
  try {
    const setting = await db.query.settings.findFirst({
      where: eq(settings.key, 'hold_minutes'),
    });
    if (setting && typeof setting.valueJson === 'number' && setting.valueJson > 0) {
      return setting.valueJson;
    }
  } catch (err) {
    // If settings table not available or offline, fallback to 15
  }
  return 15;
}

/**
 * Checks whether a given payment has exceeded the hold duration.
 */
export function isPaymentExpired(payment: { createdAt: Date | string }, holdMinutes: number = 15): boolean {
  const createdTime = new Date(payment.createdAt).getTime();
  const expireThreshold = Date.now() - holdMinutes * 60 * 1000;
  return createdTime <= expireThreshold;
}

/**
 * Automatically expires stale pending payments and releases held inventory/tickets
 * back into available public stock.
 *
 * 1. Finds all payments with status = 'created' older than hold_minutes.
 * 2. Marks payment as failed with failureReason = 'expired'.
 * 3. Triggers registry[purpose].onFailed which:
 *    - For ticket_order: Cancels ticket_orders and decrements events.seats_held (restoring available seats).
 *    - For merch_order: Cancels merch_orders and decrements product_variants.stock_held (restoring available stock).
 *    - For membership: Cancels pending membership.
 * 4. Also safely cancels any abandoned ticketOrders (pending) or merchOrders (pending_payment)
 *    created before the cutoff to ensure zero inventory leakage.
 *
 * @returns Count of expired payments and restored orders.
 */
export async function expireStalePaymentHolds(): Promise<{
  expiredPaymentsCount: number;
  expiredTicketOrdersCount: number;
  expiredMerchOrdersCount: number;
}> {
  const holdMinutes = await getHoldMinutes();
  const expireBefore = new Date(Date.now() - holdMinutes * 60 * 1000);

  let expiredPaymentsCount = 0;
  let expiredTicketOrdersCount = 0;
  let expiredMerchOrdersCount = 0;

  try {
    // 1. Process expired payments
    const expiredPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'created'),
          lte(payments.createdAt, expireBefore)
        )
      );

    for (const payment of expiredPayments) {
      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({
            status: 'failed',
            failureReason: 'Hold expired',
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        const handler = registry[payment.purpose];
        if (handler) {
          await handler.onFailed({ tx, payment: { ...payment, status: 'failed' } });
        }
      });
      expiredPaymentsCount++;
    }

    // 2. Safety check: Catch any pending ticket_orders created before cutoff that were abandoned
    const staleTicketOrders = await db
      .select()
      .from(ticketOrders)
      .where(
        and(
          eq(ticketOrders.status, 'pending'),
          lte(ticketOrders.createdAt, expireBefore)
        )
      );

    for (const order of staleTicketOrders) {
      await db.transaction(async (tx) => {
        await tx
          .update(ticketOrders)
          .set({ status: 'cancelled' })
          .where(eq(ticketOrders.id, order.id));

        await tx.execute(
          sql`UPDATE events SET seats_held = GREATEST(0, seats_held - ${order.qty}) WHERE id = ${order.eventId}`
        );
      });
      expiredTicketOrdersCount++;
    }

    // 3. Safety check: Catch any pending_payment merch_orders created before cutoff that were abandoned
    const staleMerchOrders = await db
      .select()
      .from(merchOrders)
      .where(
        and(
          eq(merchOrders.status, 'pending_payment'),
          lte(merchOrders.createdAt, expireBefore)
        )
      );

    for (const order of staleMerchOrders) {
      await db.transaction(async (tx) => {
        await tx
          .update(merchOrders)
          .set({ status: 'cancelled' })
          .where(eq(merchOrders.id, order.id));

        const items = await tx
          .select()
          .from(merchOrderItems)
          .where(eq(merchOrderItems.orderId, order.id));

        for (const item of items) {
          await tx.execute(
            sql`UPDATE product_variants SET stock_held = GREATEST(0, stock_held - ${item.qty}) WHERE id = ${item.variantId}`
          );
        }
      });
      expiredMerchOrdersCount++;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Notice: Hold check skipped (DB connection pending):', (err as any)?.message);
    }
  }

  return {
    expiredPaymentsCount,
    expiredTicketOrdersCount,
    expiredMerchOrdersCount,
  };
}
