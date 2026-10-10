import { vi, describe, it, expect, beforeAll } from 'vitest';
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({ body, init, status: init?.status || 200 })
  }
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from '@/server/db';
import { reconcile, getSemesterReport, getPerEventPnL, getPerFundraiserPnL } from '@/server/data/admin/finance';

describe('Phase 9: Finance Dashboard & Reports', () => {
  it('should have zero mismatches in ledger reconciliation', async () => {
    const mismatches = await reconcile(true);
    if (mismatches.length > 0) {
      console.error('Mismatches found:', mismatches);
    }
    expect(mismatches).toHaveLength(0);
  });

  it('should balance semester report correctly (opening + in - out = closing)', async () => {
    const start = new Date('2020-01-01');
    const end = new Date('2030-12-31');
    
    const report = await getSemesterReport(start, end, true);
    
    const calculatedClosing = report.openingBalance + report.totalIn - report.totalOut;
    expect(report.closingBalance).toBe(calculatedClosing);
  });

  it('should match hand-calculated per-event P&L', async () => {
    const pnl = await getPerEventPnL(true);
    expect(Array.isArray(pnl)).toBe(true);
    for (const e of pnl) {
      const calculatedProfit = e.ticketRevenue - e.refunds - e.expenses;
      expect(e.profit).toBe(calculatedProfit);
      if (e.capacity > 0) {
        const calculatedAttendance = Math.round((e.attendeesCount / e.capacity) * 100);
        expect(e.attendancePercent).toBe(calculatedAttendance);
      } else {
        expect(e.attendancePercent).toBe(0);
      }
    }
  });

  it('should match hand-calculated per-fundraiser P&L', async () => {
    const pnl = await getPerFundraiserPnL(true);
    expect(Array.isArray(pnl)).toBe(true);
    for (const f of pnl) {
      const calculatedProfit = f.takings - f.expenses;
      expect(f.profit).toBe(calculatedProfit);
    }
  });
});
