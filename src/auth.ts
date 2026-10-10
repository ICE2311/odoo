import NextAuth from 'next-auth';
import { authConfig } from '@/server/auth/config';
import NodemailerProvider from 'next-auth/providers/nodemailer';
import CredentialsProvider from 'next-auth/providers/credentials';
import { enqueueEmail } from '@/server/services/email';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...(authConfig.providers || []),
    CredentialsProvider({
      name: 'Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const userResult = await db.select().from(users).where(eq(users.email, credentials.email as string));
        if (userResult.length === 0) return null;
        const user = userResult[0];
        
        if (!user.passwordHash) return null; // No password set
        
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;
        
        return user;
      },
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
      async sendVerificationRequest({ identifier, url }) {
        const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Sign in to Skyline SSA</h2><p>Click the button below to sign in. This link expires in 24 hours.</p><p style="margin:24px 0"><a href="${url}" style="background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Sign in</a></p><p style="color:#64748b;font-size:14px">If you did not request this, you can safely ignore this email.<br/>Link: ${url}</p></div>`;
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
});
