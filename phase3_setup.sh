#!/bin/bash

# Update schema
cat << 'SCHEMA_EOF' >> src/server/db/schema.ts

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
SCHEMA_EOF

# Add settings defaults to seed script
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/server/db/seed.ts', 'utf8');
code = code.replace('{ key: \\'season_end_date\\', valueJson: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() }', 
'{ key: \\'season_end_month_day\\', valueJson: \\'05-31\\' },\\n    { key: \\'renewal_window_days\\', valueJson: 30 }');
fs.writeFileSync('src/server/db/seed.ts', code);
"
