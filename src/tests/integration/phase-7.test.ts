
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({ body, init, status: init?.status || 200 })
  }
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}));
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({ user: { id: 'test' } }))
}));

import { db } from '@/server/db';
import { users, memberships, membershipReminders, fundraisers, fundraiserTasks, fundraiserVolunteers, fundraiserTakings, emailOutbox, auditLog, ledgerEntries } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { computeOnTrackStatus } from '@/server/data/fundraisers/utils';
import { GET as membershipLapseCron } from '@/app/api/cron/membership-lapse/route';
import { addFundraiserTaskAction, assignTaskAction, createFundraiserAction, recordTakingsAction, updateTaskStatusAction, claimTaskAction, joinFundraiserAction } from '@/server/actions/fundraisers';
import { getFundraiserBoard } from '@/server/data/fundraisers';
import { getCaller } from '@/server/auth/guards';

vi.mock('@/server/auth/guards', async (importOriginal) => {
  const actual = await importOriginal<any>();
  let mockUser: any = null;
  return {
    ...actual,
    getCaller: vi.fn(async () => {
      if (!mockUser) return { kind: 'visitor' };
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, mockUser.id)
      });
      const m = await db.query.memberships.findFirst({
        where: eq(memberships.userId, mockUser.id)
      });
      const now = new Date();
      const isMember = m && m.status === 'active' && m.startsAt <= now && m.endsAt > now;
      
      return {
        kind: 'user',
        user: user!,
        isAdmin: user!.role === 'admin',
        isMember
      };
    }),
    requireUser: vi.fn(async () => {
      const c = await getCaller();
      if (c.kind === 'visitor') throw new Error('UNAUTHORIZED');
      return c;
    }),
    requireMember: vi.fn(async () => {
      const c = await getCaller();
      if (c.kind === 'visitor' || !c.isMember) throw new Error('FORBIDDEN');
      return c;
    }),
    requireAdmin: vi.fn(async () => {
      const c = await getCaller();
      if (c.kind === 'visitor' || !c.isAdmin) throw new Error('FORBIDDEN');
      return c;
    }),
    setMockUser: (u: any) => { mockUser = u; }
  };
});

describe('Phase 7 - Fundraisers', () => {
  let adminId: string;
  let memberId: string;

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);

    const [a] = await db.insert(users).values({
      email: 'admin@skyline.test',
      role: 'admin',
      name: 'Admin'
    }).returning();
    adminId = a.id;

    const [m] = await db.insert(users).values({
      email: 'member@skyline.test',
      role: 'user',
      name: 'Member'
    }).returning();
    memberId = m.id;

    const now = new Date();
    await db.insert(memberships).values([
      {
        userId: adminId,
        status: 'active',
        startsAt: new Date(now.getTime() - 100000),
        endsAt: new Date(now.getTime() + 10000000),
        pricePaise: 50000,
        method: 'cash'
      },
      {
        userId: memberId,
        status: 'active',
        startsAt: new Date(now.getTime() - 100000),
        endsAt: new Date(now.getTime() + 10000000),
        pricePaise: 50000,
        method: 'cash'
      }
    ]);
  });

  describe('On-track badge unit tests', () => {
    it('returns At risk if tasks overdue', () => {
      expect(computeOnTrackStatus(new Date(), 1000, 500, 2, 1, true)).toBe('At risk');
    });

    it('returns At risk if days_left <= 2 and done% < 70', () => {
      const now = new Date();
      const fDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day left
      expect(computeOnTrackStatus(fDate, 1000, 0, 10, 5, false, now)).toBe('At risk');
    });

    it('returns Behind if past fundraiser date and raised < 50% goal', () => {
      const now = new Date();
      const fDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day past
      expect(computeOnTrackStatus(fDate, 1000, 400, 10, 10, false, now)).toBe('Behind');
    });

    it('returns On track otherwise', () => {
      const now = new Date();
      const fDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days left
      expect(computeOnTrackStatus(fDate, 1000, 100, 10, 5, false, now)).toBe('On track');
    });
  });

  describe('Lapse hook and workflow', () => {
    it('unassigns tasks and logs email when member lapses', async () => {
      const { setMockUser } = await import('@/server/auth/guards') as any;
      
      // Admin creates fundraiser
      setMockUser({ id: adminId });
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + 5);
      
      const fId = await createFundraiserAction({
        name: 'Bake Sale',
        slug: 'bake-sale',
        description: 'Cookies and cakes',
        date: fDate.toISOString(),
        location: 'Quad',
        goalPaise: 1000000,
      });

      // Member joins and claims task
      setMockUser({ id: memberId });
      await joinFundraiserAction(fId);
      
      // Admin adds task
      setMockUser({ id: adminId });
      await addFundraiserTaskAction(fId, { title: 'Bake cookies' });
      
      const fData = await getFundraiserBoard(fId);
      const taskId = fData.tasks[0].id;
      
      // Member claims task
      setMockUser({ id: memberId });
      await claimTaskAction(taskId);

      // Verify claimed
      let task = await db.query.fundraiserTasks.findFirst({ where: eq(fundraiserTasks.id, taskId) });
      expect(task?.assigneeId).toBe(memberId);

      // Expire membership manually
      await db.update(memberships)
        .set({ endsAt: new Date(Date.now() - 1000) }) // expired
        .where(eq(memberships.userId, memberId));

      // Run lapse cron
      process.env.CRON_SECRET = 'test-secret';
      const req = new Request('http://localhost/api/cron/membership-lapse', {
        headers: { 'authorization': 'Bearer test-secret' }
      });
      await membershipLapseCron(req);

      // Verify unassigned
      task = await db.query.fundraiserTasks.findFirst({ where: eq(fundraiserTasks.id, taskId) });
      expect(task?.assigneeId).toBeNull();

      // Verify admin notified
      const emails = await db.query.emailOutbox.findMany();
      expect(emails.some(e => e.toEmail === 'admin@skyline.test' && e.subject.includes('Volunteer removed'))).toBe(true);
    });
  });
});
