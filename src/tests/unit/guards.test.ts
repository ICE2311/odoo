import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockSession: any = null;
let mockUserRecord: any = null;
let mockActiveMembership: any = null;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => mockSession),
}));

vi.mock('@/server/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(async () => mockUserRecord),
      },
      memberships: {
        findFirst: vi.fn(async () => mockActiveMembership),
      },
      eventDoorStaff: {
        findFirst: vi.fn(async () => null),
      },
    },
  },
}));

// Import guards after mocks are configured
import { getCaller, requireUser, requireMember, requireAdmin, requireFinanceAccess } from '@/server/auth/guards';

describe('Auth Guards & Role Matrix (including Treasurer)', () => {
  beforeEach(() => {
    mockSession = null;
    mockUserRecord = null;
    mockActiveMembership = null;
  });

  it('identifies visitor when no session exists', async () => {
    mockSession = null;
    const caller = await getCaller();
    expect(caller.kind).toBe('visitor');
    await expect(requireUser()).rejects.toThrow('UNAUTHORIZED');
    await expect(requireAdmin()).rejects.toThrow('UNAUTHORIZED');
    await expect(requireFinanceAccess()).rejects.toThrow('UNAUTHORIZED');
  });

  it('correctly sets flags for regular user', async () => {
    mockSession = { user: { id: 'user-1' } };
    mockUserRecord = { id: 'user-1', name: 'User', email: 'user@skyline.test', role: 'user' };

    const caller = await getCaller();
    expect(caller.kind).toBe('user');
    expect(caller.isAdmin).toBe(false);
    expect(caller.isTreasurer).toBe(false);

    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN: Admin access required');
    await expect(requireFinanceAccess()).rejects.toThrow('FORBIDDEN: Admin or Treasurer access required');
  });

  it('allows admin full admin and finance access', async () => {
    mockSession = { user: { id: 'admin-1' } };
    mockUserRecord = { id: 'admin-1', name: 'Admin', email: 'admin@skyline.test', role: 'admin' };

    const caller = await getCaller();
    expect(caller.kind).toBe('user');
    expect(caller.isAdmin).toBe(true);
    expect(caller.isTreasurer).toBe(false);

    const adminCaller = await requireAdmin();
    expect(adminCaller.user.role).toBe('admin');

    const finCaller = await requireFinanceAccess();
    expect(finCaller.user.role).toBe('admin');
  });

  it('allows treasurer finance access while blocking admin-only access', async () => {
    mockSession = { user: { id: 'treasurer-1' } };
    mockUserRecord = { id: 'treasurer-1', name: 'Treasurer', email: 'treasurer@skyline.test', role: 'treasurer' };

    const caller = await getCaller();
    expect(caller.kind).toBe('user');
    expect(caller.isAdmin).toBe(false);
    expect(caller.isTreasurer).toBe(true);

    // Treasurer must pass requireFinanceAccess
    const finCaller = await requireFinanceAccess();
    expect(finCaller.user.role).toBe('treasurer');
    expect(finCaller.isTreasurer).toBe(true);

    // Treasurer must be strictly forbidden from admin-only routes
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN: Admin access required');
  });
});
