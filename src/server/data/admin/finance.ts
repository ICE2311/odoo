import { db } from '@/server/db';
import { ledgerEntries, memberships, ticketOrders, merchOrders, expenseClaims, payments, events, tickets, fundraisers, products, productVariants, merchOrderItems, stockMovements, users, settings } from '@/server/db/schema';
import { and, eq, gte, lte, sql, desc, count, asc, inArray } from 'drizzle-orm';
import { requireAdmin } from '@/server/auth/guards';

export async function getFinanceDashboardData(periodStart?: Date, periodEnd?: Date) {
  await requireAdmin();
  
  const dateConditions = [];
  if (periodStart) dateConditions.push(gte(ledgerEntries.occurredAt, periodStart));
  if (periodEnd) dateConditions.push(lte(ledgerEntries.occurredAt, periodEnd));
  const whereClause = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  const balanceResult = await db.select({
    balance: sql<number>`SUM(CASE WHEN ${ledgerEntries.direction} = 'in' THEN ${ledgerEntries.amountPaise} ELSE -${ledgerEntries.amountPaise} END)`
  }).from(ledgerEntries);
  const totalBalance = Number(balanceResult[0]?.balance || 0);

  const inOutResult = await db.select({
    direction: ledgerEntries.direction,
    total: sql<number>`SUM(${ledgerEntries.amountPaise})`
  }).from(ledgerEntries)
    .where(whereClause)
    .groupBy(ledgerEntries.direction);
    
  let periodIn = 0;
  let periodOut = 0;
  for (const row of inOutResult) {
    if (row.direction === 'in') periodIn = Number(row.total);
    if (row.direction === 'out') periodOut = Number(row.total);
  }
  const periodNet = periodIn - periodOut;

  const byCategoryResult = await db.select({
    category: ledgerEntries.category,
    direction: ledgerEntries.direction,
    total: sql<number>`SUM(${ledgerEntries.amountPaise})`
  }).from(ledgerEntries)
    .where(whereClause)
    .groupBy(ledgerEntries.category, ledgerEntries.direction);

  const inByCategory = byCategoryResult.filter(r => r.direction === 'in').map(r => ({ category: r.category, total: Number(r.total) }));
  const outByCategory = byCategoryResult.filter(r => r.direction === 'out').map(r => ({ category: r.category, total: Number(r.total) }));

  const monthlyResult = await db.select({
    month: sql<string>`TO_CHAR(${ledgerEntries.occurredAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')`,
    direction: ledgerEntries.direction,
    total: sql<number>`SUM(${ledgerEntries.amountPaise})`
  }).from(ledgerEntries)
    .where(whereClause)
    .groupBy(sql`TO_CHAR(${ledgerEntries.occurredAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')`, ledgerEntries.direction)
    .orderBy(sql`TO_CHAR(${ledgerEntries.occurredAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')`);

  const monthlyTrendMap = new Map<string, { month: string, in: number, out: number }>();
  for (const row of monthlyResult) {
    const month = row.month;
    if (!monthlyTrendMap.has(month)) monthlyTrendMap.set(month, { month, in: 0, out: 0 });
    const item = monthlyTrendMap.get(month)!;
    if (row.direction === 'in') item.in = Number(row.total);
    if (row.direction === 'out') item.out = Number(row.total);
  }
  const monthlyTrend = Array.from(monthlyTrendMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalBalance,
    periodIn,
    periodOut,
    periodNet,
    inByCategory,
    outByCategory,
    monthlyTrend
  };
}

export async function getLedger(page = 1, pageSize = 20, filters?: { start?: Date, end?: Date, category?: string }) {
  await requireAdmin();
  
  const conditions = [];
  if (filters?.start) conditions.push(gte(ledgerEntries.occurredAt, filters.start));
  if (filters?.end) conditions.push(lte(ledgerEntries.occurredAt, filters.end));
  if (filters?.category && filters.category !== 'all') conditions.push(eq(ledgerEntries.category, filters.category as any));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalCountResult = await db.select({ count: count() }).from(ledgerEntries).where(whereClause);
  const totalCount = totalCountResult[0].count;

  const entries = await db.query.ledgerEntries.findMany({
    where: whereClause,
    orderBy: [desc(ledgerEntries.occurredAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      recordedByData: { columns: { id: true, name: true, email: true } },
    }
  });

  return {
    entries,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}

export async function reconcile(skipAuth = false) {
  if (!skipAuth) await requireAdmin();
  await requireAdmin();
  const mismatches: string[] = [];

  const membersResult = await db.select({ total: sql<number>`COALESCE(SUM(${memberships.pricePaise}), 0)` }).from(memberships).where(eq(memberships.status, 'active'));
  const duesResult = await db.select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.amountPaise}), 0)` }).from(ledgerEntries).where(and(eq(ledgerEntries.category, 'membership_dues'), eq(ledgerEntries.direction, 'in')));
  if (Number(membersResult[0].total) !== Number(duesResult[0].total)) {
    mismatches.push(`Memberships active total (₹${Number(membersResult[0].total) / 100}) does not match ledger membership_dues (₹${Number(duesResult[0].total) / 100})`);
  }

  const ticketsResult = await db.select({ total: sql<number>`COALESCE(SUM(${ticketOrders.totalPaise}), 0)` }).from(ticketOrders).where(eq(ticketOrders.status, 'paid'));
  const tSalesResult = await db.select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.amountPaise}), 0)` }).from(ledgerEntries).where(and(eq(ledgerEntries.category, 'ticket_sales'), eq(ledgerEntries.direction, 'in')));
  if (Number(ticketsResult[0].total) !== Number(tSalesResult[0].total)) {
    mismatches.push(`Paid ticket orders total (₹${Number(ticketsResult[0].total) / 100}) does not match ledger ticket_sales (₹${Number(tSalesResult[0].total) / 100})`);
  }

  const merchResult = await db.select({ total: sql<number>`COALESCE(SUM(${merchOrders.totalPaise}), 0)` }).from(merchOrders).where(inArray(merchOrders.status, ['paid', 'ready_for_pickup', 'collected']));
  const mSalesResult = await db.select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.amountPaise}), 0)` }).from(ledgerEntries).where(and(eq(ledgerEntries.category, 'merch_sales'), eq(ledgerEntries.direction, 'in')));
  if (Number(merchResult[0].total) !== Number(mSalesResult[0].total)) {
    mismatches.push(`Paid merch orders total (₹${Number(merchResult[0].total) / 100}) does not match ledger merch_sales (₹${Number(mSalesResult[0].total) / 100})`);
  }

  const claimsResult = await db.select({ total: sql<number>`COALESCE(SUM(${expenseClaims.amountPaise}), 0)` }).from(expenseClaims).where(eq(expenseClaims.status, 'paid'));
  const reimbResult = await db.select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.amountPaise}), 0)` }).from(ledgerEntries).where(and(eq(ledgerEntries.category, 'expense_reimbursement'), eq(ledgerEntries.direction, 'out')));
  if (Number(claimsResult[0].total) !== Number(reimbResult[0].total)) {
    mismatches.push(`Paid expense claims total (₹${Number(claimsResult[0].total) / 100}) does not match ledger expense_reimbursement (₹${Number(reimbResult[0].total) / 100})`);
  }

  const paymentsResult = await db.select({ total: sql<number>`COALESCE(SUM(${payments.amountPaise}), 0)` }).from(payments).where(eq(payments.status, 'captured'));
  const rzpLedgerResult = await db.select({ 
    totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerEntries.direction} = 'in' THEN ${ledgerEntries.amountPaise} ELSE 0 END), 0)`,
  }).from(ledgerEntries).where(eq(ledgerEntries.method, 'razorpay'));
  if (Number(paymentsResult[0].total) !== Number(rzpLedgerResult[0].totalIn)) {
    mismatches.push(`Captured Razorpay payments total (₹${Number(paymentsResult[0].total) / 100}) does not match ledger Razorpay IN (₹${Number(rzpLedgerResult[0].totalIn) / 100})`);
  }

  return mismatches;
}

export async function getSemesterReport(start?: Date, end?: Date, skipAuth = false) {
  if (!skipAuth) await requireAdmin();
  await requireAdmin();
  let openingBalance = 0;
  if (start) {
    const obResult = await db.select({
      balance: sql<number>`SUM(CASE WHEN ${ledgerEntries.direction} = 'in' THEN ${ledgerEntries.amountPaise} ELSE -${ledgerEntries.amountPaise} END)`
    }).from(ledgerEntries).where(sql`${ledgerEntries.occurredAt} < ${start}`);
    openingBalance = Number(obResult[0]?.balance || 0);
  }

  const dateConditions = [];
  if (start) dateConditions.push(gte(ledgerEntries.occurredAt, start));
  if (end) dateConditions.push(lte(ledgerEntries.occurredAt, end));
  const whereClause = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  const categoriesResult = await db.select({
    category: ledgerEntries.category,
    direction: ledgerEntries.direction,
    total: sql<number>`SUM(${ledgerEntries.amountPaise})`
  }).from(ledgerEntries).where(whereClause).groupBy(ledgerEntries.category, ledgerEntries.direction);

  let totalIn = 0;
  let totalOut = 0;
  const inCategories: Record<string, number> = {};
  const outCategories: Record<string, number> = {};

  for (const r of categoriesResult) {
    const total = Number(r.total);
    if (r.direction === 'in') {
      totalIn += total;
      inCategories[r.category] = total;
    } else {
      totalOut += total;
      outCategories[r.category] = total;
    }
  }

  const closingBalance = openingBalance + totalIn - totalOut;
  return { openingBalance, inCategories, outCategories, totalIn, totalOut, closingBalance };
}

export async function getPerEventPnL(skipAuth = false) {
  if (!skipAuth) await requireAdmin();
  await requireAdmin();
  const eventsList = await db.select({
    id: events.id,
    title: events.title,
    capacity: events.capacity,
    ticketRevenue: sql<number>`COALESCE((SELECT SUM(amount_paise) FROM ledger_entries WHERE category='ticket_sales' AND direction='in' AND event_id = events.id), 0)`,
    refunds: sql<number>`COALESCE((SELECT SUM(amount_paise) FROM ledger_entries WHERE category='refund' AND direction='out' AND event_id = events.id), 0)`,
    expenses: sql<number>`COALESCE((SELECT SUM(amount_paise) FROM ledger_entries WHERE category='expense_reimbursement' AND direction='out' AND event_id = events.id), 0)`,
    attendeesCount: sql<number>`COALESCE((SELECT COUNT(*) FROM tickets WHERE event_id = events.id AND checked_in_at IS NOT NULL), 0)`,
    ticketsSold: sql<number>`COALESCE((SELECT COUNT(*) FROM tickets WHERE event_id = events.id), 0)`
  }).from(events).orderBy(desc(events.startsAt));

  return eventsList.map(e => ({
    ...e,
    profit: Number(e.ticketRevenue) - Number(e.refunds) - Number(e.expenses),
    attendancePercent: e.capacity > 0 ? Math.round((Number(e.attendeesCount) / e.capacity) * 100) : 0,
  }));
}

export async function getPerFundraiserPnL(skipAuth = false) {
  if (!skipAuth) await requireAdmin();
  await requireAdmin();
  const fundraisersList = await db.select({
    id: fundraisers.id,
    name: fundraisers.name,
    goal: fundraisers.goalPaise,
    takings: sql<number>`COALESCE((SELECT SUM(amount_paise) FROM ledger_entries WHERE category='fundraiser_income' AND direction='in' AND fundraiser_id = fundraisers.id), 0)`,
    expenses: sql<number>`COALESCE((SELECT SUM(amount_paise) FROM ledger_entries WHERE category='expense_reimbursement' AND direction='out' AND fundraiser_id = fundraisers.id), 0)`
  }).from(fundraisers).orderBy(desc(fundraisers.createdAt));

  return fundraisersList.map(f => ({
    ...f,
    profit: Number(f.takings) - Number(f.expenses)
  }));
}

export async function getMerchReport() {
  await requireAdmin();
  const merchData = await db.select({
    productId: products.id,
    productName: products.name,
    variantId: productVariants.id,
    variantLabel: productVariants.label,
    stockOnHand: productVariants.stockOnHand,
    unitsSold: sql<number>`COALESCE((SELECT SUM(qty) FROM merch_order_items JOIN merch_orders ON merch_orders.id = merch_order_items.order_id WHERE variant_id = product_variants.id AND merch_orders.status IN ('paid', 'ready_for_pickup', 'collected')), 0)`,
    revenue: sql<number>`COALESCE((SELECT SUM(unit_price_paise * qty) FROM merch_order_items JOIN merch_orders ON merch_orders.id = merch_order_items.order_id WHERE variant_id = product_variants.id AND merch_orders.status IN ('paid', 'ready_for_pickup', 'collected')), 0)`
  }).from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .orderBy(products.name, productVariants.label);

  return merchData.map(d => ({
    ...d,
    unitsSold: Number(d.unitsSold),
    revenue: Number(d.revenue)
  }));
}

export async function getMembershipReport() {
  await requireAdmin();
  const totalActiveResult = await db.select({ count: count() }).from(memberships).where(eq(memberships.status, 'active'));
  
  const duesMethods = await db.select({
    method: ledgerEntries.method,
    count: count()
  }).from(ledgerEntries)
    .where(and(eq(ledgerEntries.category, 'membership_dues'), eq(ledgerEntries.direction, 'in')))
    .groupBy(ledgerEntries.method);

  let cashCount = 0;
  let onlineCount = 0;
  for (const row of duesMethods) {
    if (row.method === 'razorpay') onlineCount += row.count;
    else if (row.method === 'cash') cashCount += row.count;
  }

  const renewalQuery = sql`
    SELECT 
      SUM(CASE WHEN m.rn > 1 THEN 1 ELSE 0 END) as renewed,
      SUM(CASE WHEN m.rn = 1 THEN 1 ELSE 0 END) as new_members
    FROM (
      SELECT user_id, row_number() OVER (PARTITION BY user_id ORDER BY starts_at ASC) as rn
      FROM memberships
      WHERE status = 'active'
    ) m
  `;
  const renewalData = await db.execute(renewalQuery);
  const renewedCount = Number(renewalData.rows[0]?.renewed || 0);
  const newCount = Number(renewalData.rows[0]?.new_members || 0);

  return {
    activeCount: totalActiveResult[0].count,
    cashCount,
    onlineCount,
    renewedCount,
    newCount
  };
}

export async function getOverviewDashboardData() {
  await requireAdmin();

  const balanceResult = await db.select({
    balance: sql<number>`SUM(CASE WHEN ${ledgerEntries.direction} = 'in' THEN ${ledgerEntries.amountPaise} ELSE -${ledgerEntries.amountPaise} END)`
  }).from(ledgerEntries);
  const balance = Number(balanceResult[0]?.balance || 0);

  const activeMembers = await db.select({ count: count() }).from(memberships).where(eq(memberships.status, 'active'));

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const expiring = await db.select({ count: count() }).from(memberships)
    .where(and(eq(memberships.status, 'active'), lte(memberships.endsAt, in30Days)));

  const upcomingEvents = await db.select({
    id: events.id,
    title: events.title,
    capacity: events.capacity,
    sold: sql<number>`(SELECT COUNT(*) FROM tickets WHERE event_id = events.id)`
  }).from(events).where(gte(events.endsAt, new Date())).orderBy(asc(events.startsAt)).limit(5);

  const pendingClaimsResult = await db.select({
    count: count(),
    total: sql<number>`SUM(${expenseClaims.amountPaise})`
  }).from(expenseClaims).where(eq(expenseClaims.status, 'submitted'));
  const pendingClaims = { count: pendingClaimsResult[0].count, total: Number(pendingClaimsResult[0].total || 0) };

  const lowStockThreshold = Number((await db.select().from(settings).where(eq(settings.key, 'low_stock_threshold')))[0]?.valueJson || 5);
  const lowStock = await db.select({
    id: productVariants.id,
    productName: products.name,
    label: productVariants.label,
    stock: productVariants.stockOnHand
  }).from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(lte(productVariants.stockOnHand, lowStockThreshold), eq(products.status, 'active')));

  const atRiskFundraisers = sql`
    SELECT f.id, f.name,
      COALESCE((SELECT SUM(amount_paise) FROM ledger_entries WHERE category='fundraiser_income' AND direction='in' AND fundraiser_id = f.id), 0) as takings,
      COALESCE((SELECT SUM(amount_paise) FROM ledger_entries WHERE category='expense_reimbursement' AND direction='out' AND fundraiser_id = f.id), 0) as expenses
    FROM fundraisers f
    WHERE f.status = 'active'
  `;
  const activeFRs = (await db.execute(atRiskFundraisers)).rows as any[];
  const atRiskList = activeFRs.filter(f => Number(f.expenses) > Number(f.takings));

  const announcementsList = await sql`
    SELECT id, title, created_at, status 
    FROM announcements 
    ORDER BY created_at DESC LIMIT 3
  `;

  return {
    balance,
    activeMembers: activeMembers[0].count,
    expiringMembers: expiring[0].count,
    upcomingEvents: upcomingEvents.map(e => ({ ...e, sold: Number(e.sold) })),
    pendingClaims,
    lowStock,
    atRiskFundraisers: atRiskList,
    announcements: (await db.execute(announcementsList)).rows as any[]
  };
}
