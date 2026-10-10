import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import NodemailerProvider from 'next-auth/providers/nodemailer';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/server/db';
import { users, accounts, sessions, verificationTokens } from '@/server/db/schema';
import { enqueueEmail } from '@/server/services/email';

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'database' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    NodemailerProvider({
      server: {
        host: process.env.SMTP_HOST ?? 'localhost',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      },
      from: process.env.EMAIL_FROM ?? 'noreply@skyline.test',
      /**
       * Override magic-link email: queue it through email_outbox
       * so it benefits from the same retry / audit pipeline.
       */
      async sendVerificationRequest({ identifier, url }) {
        const html = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>Sign in to Skyline SSA</h2>
            <p>Click the button below to sign in. This link expires in 24 hours.</p>
            <p style="margin:24px 0">
              <a href="${url}"
                 style="background:#0f172a;color:#fff;padding:12px 24px;
                        border-radius:6px;text-decoration:none;font-weight:600">
                Sign in
              </a>
            </p>
            <p style="color:#64748b;font-size:14px">
              If you did not request this, you can safely ignore this email.<br/>
              Link: ${url}
            </p>
          </div>`;
        const text = `Sign in to Skyline SSA\n\nClick this link to sign in:\n${url}\n\nIf you did not request this, you can safely ignore this email.`;

        await enqueueEmail({
          toEmail: identifier,
          subject: 'Sign in to Skyline SSA',
          html,
          text,
          kind: 'transactional',
          refType: 'magic_link',
        });
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in, check profile completeness is handled in middleware/page
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/account`;
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
    error: '/login',
  },
};

