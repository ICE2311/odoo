import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/server/db';
import { payments, ledgerEntries, webhookEvents, users } from '@/server/db/schema';
import { createCheckout, capturePayment, verifyClientPayment } from '@/server/services/payments';
import { recordEntry, getBalance } from '@/server/services/ledger';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import '@/server/services/test_purchase';

// Mock Razorpay
vi.mock('razorpay', () => {
  return {
    default: class Razorpay {
      orders = {
        create: vi.fn().mockResolvedValue({ id: 'order_mock_123' })
      };
      payments = {
        refund: vi.fn().mockResolvedValue({ id: 'rfnd_mock_123', status: 'processed' })
      };
    }
  };
});

describe('Payments & Ledger', () => {
  let testUser: any;

  beforeEach(async () => {
    await db.delete(ledgerEntries);
    await db.delete(payments);
    await db.delete(webhookEvents);
    
    // ensure test user exists
    [testUser] = await db.insert(users).values({
      email: 'test_payment@skyline.test',
      name: 'Test Payment',
      role: 'user'
    }).onConflictDoUpdate({ target: users.email, set: { name: 'Test Payment' } }).returning();
  });

  it('client cannot change amount (tampering)', async () => {
    const caller = { kind: 'user', user: testUser, isAdmin: false, isMember: false } as any;
    // createCheckout ignores user input for amount, only takes purposeId
    const res = await createCheckout('test_purchase', 'item_1', caller);
    expect(res.amount).toBe(10000); // 10000 paise hardcoded in test_purchase
  });

  it('idempotent capture', async () => {
    const caller = { kind: 'user', user: testUser, isAdmin: false, isMember: false } as any;
    const res = await createCheckout('test_purchase', 'item_1', caller);
    
    await capturePayment('pay_123', res.rzOrderId);
    await capturePayment('pay_123', res.rzOrderId); // Second time
    
    const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, res.rzOrderId));
    expect(payment.status).toBe('captured');

    const entries = await db.select().from(ledgerEntries).where(eq(ledgerEntries.sourceId, payment.id));
    expect(entries.length).toBe(1); // Only 1 ledger entry!
    expect(entries[0].amountPaise).toBe(10000);
  });

  it('signature verification', async () => {
    const secret = process.env.RAZORPAY_KEY_SECRET = 'secret123';
    const rzOrderId = 'order_123';
    const rzPaymentId = 'pay_123';
    
    const validSig = crypto.createHmac('sha256', secret).update(rzOrderId + '|' + rzPaymentId).digest('hex');
    
    await expect(verifyClientPayment(rzOrderId, rzPaymentId, 'invalid')).rejects.toThrow('Invalid signature');
    
    // valid sig won't throw signature error (might throw payment not found, which is fine)
    await expect(verifyClientPayment(rzOrderId, rzPaymentId, validSig)).rejects.toThrow('Payment not found');
  });

  it('webhook replay idempotent', async () => {
    process.env.APP_URL = 'http://localhost:3000';
    // We can test webhook handler by calling POST manually
    const { POST } = await import('@/app/api/webhooks/razorpay/route');
    
    const payload = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_xyz' } } } };
    const body = JSON.stringify(payload);
    process.env.RAZORPAY_WEBHOOK_SECRET = 'hook_secret';
    const sig = crypto.createHmac('sha256', 'hook_secret').update(body).digest('hex');
    
    const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': sig },
      body
    });
    
    let res = await POST(req);
    expect(res.status).toBe(200);
    let data = await res.json();
    expect(data.status).toBe('ok');

    // Replay
    const req2 = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': sig },
      body
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.message).toBe('already processed');
  });
});
