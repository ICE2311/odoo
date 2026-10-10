# Skyline Student Association (SSA) Platform

> An all-in-one club operating system and member portal built for university student associations, clubs, and campus organizations.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.1-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/Postgres-Neon-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Auth.js v5](https://img.shields.io/badge/Auth.js-v5_Beta-purple?style=flat-square&logo=auth0)](https://authjs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Overview & Key Modules

Skyline SSA is a production-grade web platform providing an integrated suite of tools for student organizations:

### 1. 🏛️ Public Experience & Conversion Funnel
- **Modern Bento Grid Landing Page**: Outcome-driven hero, dual CTAs, interactive product mockups, pain-point cards, and social proof.
- **Events Catalog**: Interactive event listings with dynamic member discounts, tiered pricing, and seat counts.
- **Official Merch Shop**: Campus merchandise catalog with real-time stock counters, size variants, and member pricing.
- **Announcements Feed**: Broadcast club news, fest lineups, and official communications with opt-in email notifications.
- **Instant Onboarding**: Sign in or register via **Google OAuth 2.0**, passwordless **Magic Links (SMTP)**, or email/password.

### 2. 🪪 Student & Member Portal (`/account`)
- **Digital Member Pass**: Dynamic membership status, validity dates, instant renewal, and member perks.
- **Signed Event Tickets Wallet**: Access tickets with high-contrast, cryptographically signed QR codes.
- **Merch Orders & Cart**: Track orders, sizes, fulfillment states, and shopping cart reservations.
- **Volunteer Activities**: View assigned tasks, fundraiser contribution goals, and submit claims.
- **Connected Accounts**: Link or disconnect Google accounts directly from the student profile for 1-click login.
- **Notification Preferences**: Opt-in or mute broadcast announcement emails while retaining critical transactional receipts.

### 3. 🎟️ Events, Ticketing & Door Check-In
- **Dynamic Pricing**: Configurable base pricing and automatic member discounts.
- **Temporary Reservation Holds**: 15-minute checkout holds that automatically restore stock upon expiration.
- **Hardware-Agnostic QR Scanner**: Built-in webcam & camera QR scanner (`html5-qrcode`) for door staff.
- **Door Staff Delegation**: Admins can assign and revoke check-in permissions to volunteers per event.
- **Cryptographic Signatures**: QR codes are HMAC-signed to prevent ticket duplication, forgery, and reuse.

### 4. 👕 Merch Store & Inventory Management
- **Size & Color Variants**: Real-time inventory tracking per variant (S, M, L, XL).
- **Hold Expiration Engine**: Automatic reconciliation that releases unpaid items back to inventory after hold timeouts.
- **Order Collection Dashboard**: On-campus pickup verification and status tracking (`pending`, `paid`, `collected`).

### 5. 🤝 Fundraisers & Volunteer Operations
- **Interactive Fundraiser Boards**: Live progress bars against monetary fundraising targets.
- **Task Delegation**: Assign tasks to volunteers with deadlines and completion checkboxes.
- **Member Expense Reimbursements**: File reimbursement claims with receipt upload links, notes, and approval workflows.

### 6. 💼 Financial Treasury & Governance (`/admin`)
- **Double-Entry Ledger**: Immutable tracking of ticket sales, merch, membership dues, and approved expenses.
- **Automated P&L Reconciliation**: Match payment provider settlements with ledger accounts.
- **Semester Finance Reports**: End-of-term financial statements, cash balance, and CSV ledger export.
- **Role-Based Access Control**: Strict multi-tier access guards (`Visitor`, `User`, `Member`, `Door Staff`, `Admin`).
- **Comprehensive Audit Log**: Traceable before/after JSON audit logs for administrative actions.

---

## 🛠️ Architecture & Tech Stack

```
├── Framework:        Next.js 15 (App Router, Server Actions, Route Handlers)
├── UI & Styling:     React 19, Tailwind CSS v4, Lucide Icons, Radix UI Primitives
├── Database:         PostgreSQL via Neon Serverless (WebSocket Connection Pool)
├── ORM:              Drizzle ORM & Drizzle Kit
├── Authentication:   Auth.js v5 (NextAuth beta) with Google OAuth 2.0, Credentials & Nodemailer
├── Payments:         Razorpay Payment Gateway + Built-in One-Click Payment Simulator
├── Background Tasks: Vercel Cron Jobs & Database Transaction Locks (FOR UPDATE SKIP LOCKED)
└── Testing:          Vitest (Unit & Integration) + Playwright (End-to-End)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later (tested on Node 22/24)
- **PostgreSQL**: Neon Serverless database (or any PostgreSQL 15+ database)
- **npm** or **pnpm**

### Step-by-Step Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/odoo.git
   cd odoo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   *(See [Environment Variables Reference](#-environment-variables-reference) below).*

4. **Initialize Database Schema**:
   Generate and apply the Drizzle database migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Seed Demo Accounts & Settings**:
   Populate the database with pre-configured student accounts and settings:
   ```bash
   npm run db:seed
   ```

6. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Pre-Seeded Demo Accounts

The seed script creates 5 accounts with distinct roles and states:

| Email | Role | Membership State | Default Password |
|---|---|---|---|
| `admin@skyline.test` | **Admin** | Active (valid for 9 months) | `Password123!` |
| `member@skyline.test` | **User** | Active Member (valid for 11 months) | `Password123!` |
| `expiring@skyline.test` | **User** | Active Member (expires in 5 days) | `Password123!` |
| `lapsed@skyline.test` | **User** | Lapsed (expired 1 month ago) | `Password123!` |
| `guest@skyline.test` | **User** | Non-Member Student | `Password123!` |

---

## 🔑 Environment Variables Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Neon pooled WebSocket connection string | `postgres://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | **Yes** | Direct connection string for migrations & seed | `postgres://user:pass@ep-direct.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | **Yes** | Secret encryption key for Auth.js sessions | `openssl rand -base64 33` |
| `AUTH_TRUST_HOST` | **Yes** | Trust proxy host headers (set `true` in production) | `true` |
| `AUTH_URL` / `NEXTAUTH_URL` | **Yes** | Public canonical URL for OAuth callbacks | `https://your-domain.up.railway.app` or `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID | `123456...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth 2.0 Client Secret | `GOCSPX-...` |
| `SMTP_HOST` | Optional | SMTP mail server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | SMTP server port | `587` |
| `SMTP_SECURE` | Optional | Use TLS encryption (`true` for port 465) | `false` |
| `SMTP_USER` | Optional | SMTP username / email address | `skyline.notifications@gmail.com` |
| `SMTP_PASS` | Optional | SMTP password or App Password | `abcd efgh ijkl mnop` |
| `EMAIL_FROM` | Optional | Default sender identity | `"Skyline SSA" <noreply@skyline.test>` |
| `EMAIL_BATCH_SIZE` | Optional | Maximum emails processed per cron run | `50` |
| `RAZORPAY_KEY_ID` | Optional | Razorpay API Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay API Key Secret | `secret_...` |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Webhook verification secret | `whsec_...` |
| `PAYMENT_SIMULATION` | Optional | Set `true` for 1-click simulated checkout | `true` |
| `CRON_SECRET` | Optional | Bearer secret protecting cron endpoints | `cron_secret_...` |
| `APP_URL` | **Yes** | Base application URL for emails & QR codes | `http://localhost:3000` |
| `QR_SIGNING_SECRET` | **Yes** | HMAC signing secret for QR code security | `qr_signing_secret_...` |

---

## ⚡ Essential Commands

```bash
# Development
npm run dev              # Run Next.js with Turbopack on localhost:3000
npm run build            # Run Next.js production build & type validation
npm run start            # Start production server

# Code Quality & Testing
npm run typecheck        # Run TypeScript type validation (tsc --noEmit)
npm run lint             # Run ESLint validation
npm run test             # Run Vitest unit & integration test suites
npm run test:e2e         # Run Playwright end-to-end tests
npm run test:email       # Test SMTP email connection & send test message

# Database Management
npm run db:generate      # Generate Drizzle migration files from schema
npm run db:migrate       # Apply pending database migrations
npm run db:seed          # Seed demo accounts and club default settings
npm run db:reset:test    # Recreate test schema on test branch
```

---

## 🌐 Google OAuth Configuration

When configuring Google OAuth in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. **Authorized JavaScript origins**:
   ```text
   http://localhost:3000
   https://your-production-domain.up.railway.app
   ```
2. **Authorized redirect URIs**:
   ```text
   http://localhost:3000/api/auth/callback/google
   https://your-production-domain.up.railway.app/api/auth/callback/google
   ```

---

## ⏰ Background Automated Cron Jobs

The application includes automated maintenance endpoints defined in [`vercel.json`](file:///Users/icys/Documents/odoo/vercel.json):

| Cron Path | Schedule | Description |
|---|---|---|
| `/api/cron/send-emails` | `* * * * *` (Every minute) | Processes and dispatches queued emails from the `email_outbox` table. |
| `/api/cron/expire-holds` | `*/5 * * * *` (Every 5 mins) | Expires stale unpaid tickets and merchandise holds, restoring stock. |
| `/api/cron/membership-reminders` | `0 9 * * *` (Daily at 9am) | Sends renewal reminder notifications for memberships expiring in 7 days. |
| `/api/cron/membership-lapse` | `0 0 * * *` (Daily at midnight) | Flags expired memberships as lapsed. |
| `/api/cron/reconcile-finance` | `0 2 * * *` (Daily at 2am) | Runs automated reconciliation between payments and the ledger. |

---

## 🔒 Security Best Practices

- **Guarded Data Layer**: All sensitive operations are checked at the data layer using `requireUser()`, `requireMember()`, and `requireAdmin()`.
- **Payment Verification**: Razorpay webhook and client callbacks verify HMAC SHA256 signatures before creating ledger entries.
- **Tamper-Proof QR Codes**: Ticket tokens contain HMAC signatures incorporating ticket ID, event ID, user ID, and issue timestamp.
- **Safe HTML Delivery**: Announcements and emails sanitize text inputs and apply strict Content Security Policies (CSP).

---

## 📄 License

This software is developed for the **Skyline Student Association**. Distributed under the MIT License.
