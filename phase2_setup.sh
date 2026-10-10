#!/bin/bash

# Update schema
cat << 'SCHEMA_EOF' >> src/server/db/schema.ts

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
SCHEMA_EOF

# Add dependencies for razorpay and crypto
npm install razorpay
npm install -D @types/razorpay
