import { checkRateLimit } from '@/server/utils/rate-limit';
import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/nodemailer';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/server/db';
import { users, accounts, sessions, verificationTokens } from '@/server/db/schema';


export const authConfig: NextAuthConfig = {
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
        },
      },
      from: process.env.EMAIL_FROM || (process.env.SMTP_USER ? `Skyline SSA <${process.env.SMTP_USER}>` : 'noreply@skyline.test'),
      async sendVerificationRequest({ identifier: to, url }) {
        // Rewrite localhost URL if public domain is available
        let finalUrl = url;
        const publicBaseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.APP_URL;
        if (publicBaseUrl && (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1'))) {
          try {
            const parsed = new URL(finalUrl);
            const publicParsed = new URL(publicBaseUrl);
            parsed.protocol = publicParsed.protocol;
            parsed.host = publicParsed.host;
            parsed.port = publicParsed.port;
            finalUrl = parsed.toString();
          } catch {
            // Keep finalUrl
          }
        }

        console.log(`[AUTH MAGIC LINK] Generated sign-in link for ${to}: ${finalUrl}`);

        const { sendEmail } = await import('@/server/services/email');
        try {
          await sendEmail({
            toEmail: to,
            subject: 'Sign in to Skyline Student Association',
            text: `Sign in to Skyline Student Association:\n\n${finalUrl}\n\nThis link is valid for 24 hours. If you did not request this email, you can safely ignore it.`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
                <h2 style="color: #0f172a; margin-top: 0;">Sign in to Skyline SSA</h2>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">Click the button below to sign in to your Skyline Student Association account. This link expires in 24 hours.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${finalUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">Sign In to Skyline SSA</a>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${finalUrl}" style="color: #2563eb; word-break: break-all;">${finalUrl}</a></p>
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">If you did not request this sign-in link, you can safely ignore this email.</p>
              </div>
            `,
          });
        } catch (err: any) {
          console.error(`[AUTH MAGIC LINK ERROR] Failed sending to ${to}:`, err?.message || err);
          console.log(`[AUTH MAGIC LINK FALLBACK URL]: ${finalUrl}`);
          throw new Error(`Failed to send magic link email: ${err?.message || 'SMTP error'}`);
        }
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string)
        });
        
        if (!user || !user.passwordHash) return null;
        
        const isValid = await compare(credentials.password as string, user.passwordHash);
        
        if (isValid) {
          return { id: user.id, name: user.name, email: user.email, image: user.image };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const linkingUserId = cookieStore.get('skyline_link_user_id')?.value;

          if (linkingUserId) {
            // Check if this google account is already linked to another user
            const existing = await db.query.accounts.findFirst({
              where: and(
                eq(accounts.provider, 'google'),
                eq(accounts.providerAccountId, account.providerAccountId)
              ),
            });

            if (existing) {
              cookieStore.delete('skyline_link_user_id');
              if (existing.userId !== linkingUserId) {
                return '/account/profile?error=GoogleAlreadyLinkedToAnotherAccount';
              }
              return '/account/profile?linked=1';
            }

            // Link this google account to the requesting user
            await db.insert(accounts).values({
              userId: linkingUserId,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | undefined,
            });

            cookieStore.delete('skyline_link_user_id');
            user.id = linkingUserId;
            return '/account/profile?linked=1';
          }
        } catch (e) {
          console.error('[AUTH GOOGLE LINK ERROR]', e);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
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
