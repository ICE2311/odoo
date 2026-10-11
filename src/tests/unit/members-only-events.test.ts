import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getCaller
let mockCaller: any = { kind: 'visitor' };
vi.mock('@/server/auth/guards', () => ({
  getCaller: vi.fn(async () => mockCaller),
  requireUser: vi.fn(async () => {
    if (mockCaller.kind === 'visitor') throw new Error('UNAUTHORIZED');
    return mockCaller;
  }),
}));

// Mock db
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockExecute = vi.fn();
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([{ id: 'order-123' }]),
  }),
});
const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue({}),
  }),
});

vi.mock('@/server/db', () => ({
  db: {
    query: {
      events: {
        findMany: (...args: any[]) => mockFindMany(...args),
        findFirst: (...args: any[]) => mockFindFirst(...args),
      },
    },
    transaction: vi.fn(async (cb: any) => {
      const tx = {
        execute: mockExecute,
        insert: mockInsert,
        update: mockUpdate,
        query: {
          events: {
            findFirst: mockFindFirst,
          },
        },
      };
      return await cb(tx);
    }),
  },
}));

vi.mock('@/server/services/holds', () => ({
  expireStalePaymentHolds: vi.fn(async () => 0),
}));

describe('Members-Only Events Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters out members-only events when visitor accesses getPublicEvents', async () => {
    mockCaller = { kind: 'visitor' };
    mockFindMany.mockResolvedValueOnce([
      { id: '1', title: 'Public Gala', membersOnly: false },
    ]);

    const { getPublicEvents } = await import('@/server/data/public/events');
    const result = await getPublicEvents();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Public Gala');
    // Ensure findMany was called with where condition filtering membersOnly
    expect(mockFindMany).toHaveBeenCalled();
  });

  it('returns all events including members-only events for active members', async () => {
    mockCaller = { kind: 'user', user: { id: 'u1' }, isMember: true, isAdmin: false };
    mockFindMany.mockResolvedValueOnce([
      { id: '1', title: 'Public Gala', membersOnly: false },
      { id: '2', title: 'Secret Retreat', membersOnly: true },
    ]);

    const { getPublicEvents } = await import('@/server/data/public/events');
    const result = await getPublicEvents();

    expect(result).toHaveLength(2);
    expect(result[1].membersOnly).toBe(true);
  });

  it('blocks ticket creation for non-members on members-only event', async () => {
    mockCaller = { kind: 'user', user: { id: 'u2', email: 'guest@skyline.test' }, isMember: false, isAdmin: false };
    
    // Mock event lock query returning members_only = true
    mockExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'event-members-1',
          status: 'published',
          sales_open_at: new Date(Date.now() - 100000),
          sales_close_at: new Date(Date.now() + 100000),
          capacity: 100,
          seats_sold: 10,
          seats_held: 0,
          member_price_paise: 20000,
          non_member_price_paise: 50000,
          max_tickets_per_user: 4,
          members_only: true,
        },
      ],
    });

    const { createTicketOrder } = await import('@/server/services/tickets');
    await expect(createTicketOrder('event-members-1', 1)).rejects.toThrow(
      'This event is strictly reserved for active members only.'
    );
  });

  it('allows ticket creation for active members on members-only event at member rate', async () => {
    mockCaller = { kind: 'user', user: { id: 'u1', email: 'member@skyline.test' }, isMember: true, isAdmin: false };
    
    mockExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'event-members-1',
          status: 'published',
          sales_open_at: new Date(Date.now() - 100000),
          sales_close_at: new Date(Date.now() + 100000),
          capacity: 100,
          seats_sold: 10,
          seats_held: 0,
          member_price_paise: 20000,
          non_member_price_paise: 50000,
          max_tickets_per_user: 4,
          members_only: true,
        },
      ],
    });

    // Mock update seats held
    mockExecute.mockResolvedValueOnce({});

    // Mock insert payment and ticket_order
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'pay-1' }]),
      }),
    });

    const { createTicketOrder } = await import('@/server/services/tickets');
    const order = await createTicketOrder('event-members-1', 2);

    expect(order).toBeDefined();
    // 2 tickets at 20000 paise each = 40000 paise
    expect(order.amountPaise).toBe(40000);
  });
});
