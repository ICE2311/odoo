import { describe, it, expect, vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));
import { isPaymentExpired } from '@/server/services/holds';

describe('Payment Hold Expiration Logic', () => {
  it('correctly identifies an expired payment when past the hold window', () => {
    // 20 minutes ago (past 15 min default threshold)
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
    expect(isPaymentExpired({ createdAt: twentyMinsAgo }, 15)).toBe(true);
  });

  it('correctly keeps payment active within the hold window', () => {
    // 5 minutes ago (within 15 min default threshold)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(isPaymentExpired({ createdAt: fiveMinsAgo }, 15)).toBe(false);
  });

  it('respects custom hold_minutes durations', () => {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    // Expired if threshold is 5 mins
    expect(isPaymentExpired({ createdAt: tenMinsAgo }, 5)).toBe(true);
    // Not expired if threshold is 30 mins
    expect(isPaymentExpired({ createdAt: tenMinsAgo }, 30)).toBe(false);
  });
});
