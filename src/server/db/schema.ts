import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  integer,
  jsonb,
  uniqueIndex
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
