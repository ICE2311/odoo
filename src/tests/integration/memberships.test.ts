import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/server/db';
import { users, memberships, membershipReminders, emailOutbox } from '@/server/db/schema';
import { calculateMembershipDates, verifyMemberQrToken, generateMemberQrToken } from '@/server/services/membership';
import { adminRecordCashDues } from '@/server/actions/membership';
import { eq } from 'drizzle-orm';
import { getCaller } from '@/server/auth/guards';

vi.mock('@/server/auth/guards', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    requireAdmin: vi.fn(),
  };
});

vi.mock('@/auth', () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe('Memberships', () => {
  let testUser: any;

  beforeEach(async () => {
    await db.delete(membershipReminders);
    await db.delete(memberships);
    await db.delete(emailOutbox);
    
    [testUser] = await db.insert(users).values({
      email: 'memtest@skyline.test',
      name: 'Mem Test',
      role: 'user'
    }).onConflictDoUpdate({ target: users.email, set: { name: 'Mem Test' } }).returning();
  });

  it('date logic: purchase in October -> ends next 31 May', async () => {
    const octDate = new Date('2026-10-15T10:00:00Z');
    const dates = await calculateMembershipDates(testUser.id, octDate);
    expect(dates.startsAt).toEqual(octDate);
    expect(dates.endsAt.toISOString()).toContain('2027-05-31T');
  });

  it('date logic: renewal extends to following season end', async () => {
    // Current membership ends May 31 2027
    const end = new Date('2027-05-31T23:59:59.999Z');
    await db.insert(memberships).values({
      userId: testUser.id,
      status: 'active',
      startsAt: new Date('2026-10-15T10:00:00Z'),
      endsAt: end,
      pricePaise: 50000,
      method: 'cash'
    });

    // Buy 10 days before expiry (May 21 2027)
    const renewalDate = new Date('2027-05-21T10:00:00Z');
    const dates = await calculateMembershipDates(testUser.id, renewalDate);
    
    expect(dates.startsAt).toEqual(end); // starts exactly when old ends
    expect(dates.endsAt.toISOString()).toContain('2028-05-31T');
  });

  it('date logic: purchase after lapse -> fresh membership', async () => {
    const pastEnd = new Date('2026-05-31T23:59:59.999Z');
    await db.insert(memberships).values({
      userId: testUser.id,
      status: 'active',
      startsAt: new Date('2025-10-15T10:00:00Z'),
      endsAt: pastEnd,
      pricePaise: 50000,
      method: 'cash'
    });

    const now = new Date('2026-10-15T10:00:00Z');
    const dates = await calculateMembershipDates(testUser.id, now);
    expect(dates.startsAt).toEqual(now); // fresh
  });

  it('overlapping active membership impossible', async () => {
    const end = new Date('2027-05-31T23:59:59.999Z');
    await db.insert(memberships).values({
      userId: testUser.id,
      status: 'active',
      startsAt: new Date('2026-10-15T10:00:00Z'),
      endsAt: end,
      pricePaise: 50000,
      method: 'cash'
    });

    // Try to buy way before renewal window (e.g. Nov 2026)
    const now = new Date('2026-11-15T10:00:00Z');
    await expect(calculateMembershipDates(testUser.id, now)).rejects.toThrow('overlapping');
  });

  it('admin records cash dues', async () => {
    const { requireAdmin } = await import('@/server/auth/guards');
    (requireAdmin as any).mockResolvedValue({ user: { id: testUser.id } });

    await adminRecordCashDues(testUser.id, 'cash');
    const [mem] = await db.select().from(memberships).where(eq(memberships.userId, testUser.id));
    expect(mem.method).toBe('cash');
    expect(mem.status).toBe('active');
  });

  it('QR verification works', () => {
    process.env.QR_SIGNING_SECRET = 'test_secret';
    const token = generateMemberQrToken('user_123');
    expect(verifyMemberQrToken(token)).toBe('user_123');
    expect(verifyMemberQrToken(token + 'bad')).toBe(null);
  });
  
  it('reminder cron idempotency', async () => {
    process.env.CRON_SECRET = 'secret';
    
    // active membership expiring in 7 days
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(memberships).values({
      userId: testUser.id,
      status: 'active',
      startsAt: new Date(now.getTime() - 10000),
      endsAt: end,
      pricePaise: 50000,
      method: 'cash'
    });

    const { GET } = await import('@/app/api/cron/membership-reminders/route');
    const req = new Request('http://localhost', { headers: { authorization: 'Bearer secret' } });
    
    const res1 = await GET(req);
    const data1 = await res1.json();
    expect(data1.sent).toBeGreaterThan(0); // 1 or more depending on other data

    // second run
    const res2 = await GET(req);
    const data2 = await res2.json();
    // For this specific testUser, it shouldn't send again. Since the DB is cleared, it will be 0.
    // However seed accounts might be there, but we cleared memberships table in beforeEach!
    expect(data2.sent).toBe(0);
  });
});
