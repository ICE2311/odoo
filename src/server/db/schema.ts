import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  date
} from 'drizzle-orm/pg-core';

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  phone: text('phone'),
  studentId: text('student_id'),
  college: text('college'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  passwordHash: text('password_hash'),
  emailOptIn: boolean('email_opt_in').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Auth.js required tables ─────────────────────────────────────────────────
export const accounts = pgTable('accounts', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

// ─── Settings ────────────────────────────────────────────────────────────────
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  valueJson: jsonb('value_json').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  beforeJson: jsonb('before_json'),
  afterJson: jsonb('after_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Memberships ──────────────────────────────────────────────────────────────
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  status: text('status', {
    enum: ['pending', 'active', 'cancelled', 'refunded'],
  })
    .notNull()
    .default('pending'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  pricePaise: integer('price_paise').notNull(),
  method: text('method').notNull(),
  paymentId: uuid('payment_id'),
  recordedBy: uuid('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Event Door Staff ─────────────────────────────────────────────────────────
// eventId references events table added in Phase 2
export const eventDoorStaff = pgTable('event_door_staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  grantedBy: uuid('granted_by')
    .notNull()
    .references(() => users.id),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => {
  return {
    uniqueStaff: uniqueIndex('unique_event_staff').on(t.eventId, t.userId),
  };
});

// ─── Email Outbox ─────────────────────────────────────────────────────────────
export const emailOutbox = pgTable('email_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  html: text('html').notNull(),
  text: text('text').notNull(),
  kind: text('kind', { enum: ['transactional', 'announcement'] }).notNull(),
  refType: text('ref_type'),
  refId: text('ref_id'),
  status: text('status', { enum: ['queued', 'sent', 'failed'] })
    .notNull()
    .default('queued'),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  sendAfter: timestamp('send_after', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});


// ─── Phase 2: Payments & Ledger ───────────────────────────────────────────────

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  purpose: text('purpose', { enum: ['membership', 'ticket_order', 'merch_order', 'test_purchase'] }).notNull(),
  purposeId: text('purpose_id').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status', { enum: ['created', 'captured', 'failed', 'refunded', 'partially_refunded'] }).notNull().default('created'),
  razorpayOrderId: text('razorpay_order_id').unique(),
  razorpayPaymentId: text('razorpay_payment_id').unique(),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  amountPaise: integer('amount_paise').notNull(),
  razorpayRefundId: text('razorpay_refund_id').unique().notNull(),
  reason: text('reason').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  direction: text('direction', { enum: ['in', 'out'] }).notNull(),
  amountPaise: integer('amount_paise').notNull(),
  category: text('category', { enum: ['membership_dues', 'ticket_sales', 'merch_sales', 'fundraiser_income', 'expense_reimbursement', 'refund', 'manual_income', 'manual_expense', 'test_income'] }).notNull(),
  method: text('method', { enum: ['razorpay', 'cash', 'upi_manual', 'bank'] }).notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id').notNull(),
  eventId: uuid('event_id'),
  fundraiserId: uuid('fundraiser_id'),
  description: text('description'),
  recordedBy: uuid('recorded_by').references(() => users.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => {
  return {
    uniqueSrc: uniqueIndex('unique_ledger_source').on(t.sourceType, t.sourceId, t.category, t.direction),
  };
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  eventId: text('event_id').unique().notNull(),
  type: text('type').notNull(),
  payloadJson: jsonb('payload_json').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Phase 3: Memberships ───────────────────────────────────────────────

export const membershipReminders = pgTable('membership_reminders', {
  membershipId: uuid('membership_id').notNull().references(() => memberships.id),
  daysBefore: integer('days_before').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => {
  return {
    uniqueReminder: uniqueIndex('unique_membership_reminder').on(t.membershipId, t.daysBefore),
  };
});

// ─── Phase 4: Events & Tickets ───────────────────────────────────────────────

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  bannerUrl: text('banner_url'),
  venue: text('venue').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  capacity: integer('capacity').notNull(),
  memberPricePaise: integer('member_price_paise').notNull(),
  nonMemberPricePaise: integer('non_member_price_paise').notNull(),
  salesOpenAt: timestamp('sales_open_at', { withTimezone: true }).notNull(),
  salesCloseAt: timestamp('sales_close_at', { withTimezone: true }).notNull(),
  maxTicketsPerUser: integer('max_tickets_per_user').notNull().default(4),
  status: text('status', { enum: ['draft', 'published', 'cancelled', 'completed'] }).notNull().default('draft'),
  seatsSold: integer('seats_sold').notNull().default(0),
  seatsHeld: integer('seats_held').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ticketOrders = pgTable('ticket_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  eventId: uuid('event_id').notNull().references(() => events.id),
  qty: integer('qty').notNull(),
  totalPaise: integer('total_paise').notNull(),
  status: text('status', { enum: ['pending', 'paid', 'cancelled', 'refunded'] }).notNull().default('pending'),
  paymentId: uuid('payment_id').references(() => payments.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => ticketOrders.id),
  eventId: uuid('event_id').notNull().references(() => events.id),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
  holderName: text('holder_name').notNull(),
  priceType: text('price_type', { enum: ['member', 'non_member', 'comp'] }).notNull(),
  pricePaise: integer('price_paise').notNull(),
  code: text('code').notNull().unique(),
  status: text('status', { enum: ['valid', 'refunded', 'void'] }).notNull().default('valid'),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedInBy: uuid('checked_in_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Phase 5: Announcements ─────────────────────────────────────────────────────────

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  bodyMarkdown: text('body_markdown').notNull(),
  category: text('category', { enum: ['meeting', 'deadline', 'event', 'change_of_plan', 'general'] }).notNull().default('general'),
  audience: text('audience', { enum: ['public', 'members'] }).notNull(),
  channels: text('channels').array().notNull(), // PostgreSQL text[] is not straightforward if it's text array but let's see. Wait, drizzle string array requires text('col').array(). Wait! Let's check how drizzle handles arrays.
  pinned: boolean('pinned').notNull().default(false),
  status: text('status', { enum: ['draft', 'scheduled', 'published', 'archived'] }).notNull().default('draft'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const announcementRevisions = pgTable('announcement_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  announcementId: uuid('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  bodyMarkdown: text('body_markdown').notNull(),
  editedBy: uuid('edited_by').notNull().references(() => users.id),
  editedAt: timestamp('edited_at', { withTimezone: true }).notNull().defaultNow(),
});

export const announcementDeliveries = pgTable('announcement_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  announcementId: uuid('announcement_id').notNull().unique().references(() => announcements.id, { onDelete: 'cascade' }),
  recipientsCount: integer('recipients_count').notNull().default(0),
  sentCount: integer('sent_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

// ─── Phase 6: Merch Shop ───────────────────────────────────────────────

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  imageUrls: text('image_urls').array(),
  basePricePaise: integer('base_price_paise').notNull(),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  maxPerUser: integer('max_per_user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id),
  label: text('label').notNull(), // e.g. 'S', 'M', 'L', 'XL'
  sku: text('sku').notNull(),
  stockOnHand: integer('stock_on_hand').notNull().default(0),
  stockHeld: integer('stock_held').notNull().default(0),
  priceOverridePaise: integer('price_override_paise'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  cartId: uuid('cart_id').notNull().references(() => carts.id),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  qty: integer('qty').notNull(),
}, (t) => ({
  pk: uniqueIndex('unique_cart_variant').on(t.cartId, t.variantId),
}));

export const merchOrders = pgTable('merch_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id),
  totalPaise: integer('total_paise').notNull(),
  status: text('status', { enum: ['pending_payment', 'paid', 'ready_for_pickup', 'collected', 'cancelled', 'refunded'] }).notNull().default('pending_payment'),
  paymentId: uuid('payment_id').references(() => payments.id),
  collectedAt: timestamp('collected_at', { withTimezone: true }),
  collectedBy: uuid('collected_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const merchOrderItems = pgTable('merch_order_items', {
  orderId: uuid('order_id').notNull().references(() => merchOrders.id),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  productName: text('product_name').notNull(),
  variantLabel: text('variant_label').notNull(),
  unitPricePaise: integer('unit_price_paise').notNull(),
  qty: integer('qty').notNull(),
}, (t) => ({
  pk: uniqueIndex('unique_order_variant').on(t.orderId, t.variantId),
}));

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  delta: integer('delta').notNull(),
  reason: text('reason', { enum: ['restock', 'sale', 'refund', 'adjustment'] }).notNull(),
  refId: text('ref_id'),
  by: uuid('by').references(() => users.id),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Phase 7: Fundraisers & Volunteer Tasks ────────────────────────────────

export const fundraisers = pgTable('fundraisers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  location: text('location').notNull(),
  goalPaise: integer('goal_paise').notNull(),
  budgetPaise: integer('budget_paise'),
  status: text('status', { enum: ['planning', 'active', 'completed', 'cancelled'] }).notNull().default('planning'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fundraiserVolunteers = pgTable('fundraiser_volunteers', {
  fundraiserId: uuid('fundraiser_id').notNull().references(() => fundraisers.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => {
  return {
    uniqueVolunteer: uniqueIndex('unique_fundraiser_volunteer').on(t.fundraiserId, t.userId),
  };
});

export const fundraiserTasks = pgTable('fundraiser_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  fundraiserId: uuid('fundraiser_id').notNull().references(() => fundraisers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  notes: text('notes'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  dueAt: timestamp('due_at', { withTimezone: true }),
  status: text('status', { enum: ['todo', 'doing', 'done', 'blocked'] }).notNull().default('todo'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fundraiserTakings = pgTable('fundraiser_takings', {
  id: uuid('id').primaryKey().defaultRandom(),
  fundraiserId: uuid('fundraiser_id').notNull().references(() => fundraisers.id, { onDelete: 'cascade' }),
  amountPaise: integer('amount_paise').notNull(),
  method: text('method', { enum: ['cash', 'upi_manual'] }).notNull(),
  note: text('note'),
  recordedBy: uuid('recorded_by').notNull().references(() => users.id),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Phase 8: Expense Claims ────────────────────────────────────────────────
export const expenseClaims = pgTable('expense_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  claimantId: uuid('claimant_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  spentOn: date('spent_on').notNull(),
  eventId: uuid('event_id').references(() => events.id),
  fundraiserId: uuid('fundraiser_id').references(() => fundraisers.id),
  receiptUrls: text('receipt_urls').array().notNull(),
  status: text('status', { enum: ['submitted', 'approved', 'rejected', 'paid', 'withdrawn'] }).notNull().default('submitted'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  paidBy: uuid('paid_by').references(() => users.id),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  payoutMethod: text('payout_method', { enum: ['upi', 'bank', 'cash'] }),
  payoutRef: text('payout_ref'),
  payeeUpiId: text('payee_upi_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});


import { relations } from 'drizzle-orm';

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  ownerUser: one(users, {
    fields: [tickets.ownerUserId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  tickets: many(tickets),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  recordedByData: one(users, {
    fields: [ledgerEntries.recordedBy],
    references: [users.id],
  }),
}));

export const merchOrdersRelations = relations(merchOrders, ({ many }) => ({
  items: many(merchOrderItems),
}));

export const merchOrderItemsRelations = relations(merchOrderItems, ({ one }) => ({
  order: one(merchOrders, {
    fields: [merchOrderItems.orderId],
    references: [merchOrders.id],
  }),
  variant: one(productVariants, {
    fields: [merchOrderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const fundraiserTasksRelations = relations(fundraiserTasks, ({ one }) => ({
  assignee: one(users, {
    fields: [fundraiserTasks.assigneeId],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  revisions: many(announcementRevisions),
  delivery: one(announcementDeliveries, {
    fields: [announcements.id],
    references: [announcementDeliveries.announcementId],
  }),
}));

export const announcementRevisionsRelations = relations(announcementRevisions, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementRevisions.announcementId],
    references: [announcements.id],
  }),
  editor: one(users, {
    fields: [announcementRevisions.editedBy],
    references: [users.id],
  }),
}));

export const announcementDeliveriesRelations = relations(announcementDeliveries, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementDeliveries.announcementId],
    references: [announcements.id],
  }),
}));

export const eventDoorStaffRelations = relations(eventDoorStaff, ({ one }) => ({
  user: one(users, {
    fields: [eventDoorStaff.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventDoorStaff.eventId],
    references: [events.id],
  }),
  grantedByUser: one(users, {
    fields: [eventDoorStaff.grantedBy],
    references: [users.id],
  }),
}));

