'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, GraduationCap, Phone, Building2, 
  Megaphone, Bell, CheckCircle2, AlertCircle, RefreshCw, 
  Lock, Shield, Sparkles, Link as LinkIcon, Unlink
} from 'lucide-react';
import { updateProfileAction } from '@/server/actions/profile';
import { prepareGoogleLinkAction, unlinkGoogleAction } from '@/server/actions/auth-link';

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  studentId: string | null;
  college: string | null;
  emailOptIn: boolean;
  createdAt: Date;
  hasPassword?: boolean;
  hasGoogleLinked?: boolean;
}

interface ProfileFormProps {
  profile: ProfileData;
  role?: string;
}

export function ProfileForm({ profile, role = 'user' }: ProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [studentId, setStudentId] = useState(profile.studentId || '');
  const [college, setCollege] = useState(profile.college || '');
  const [emailOptIn, setEmailOptIn] = useState<boolean>(profile.emailOptIn ?? true);

  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Google Linking State
  const [isGoogleLinking, setIsGoogleLinking] = useState(false);
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState<string | null>(null);
  const [googleErrorMsg, setGoogleErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const linkedParam = searchParams.get('linked');
    const errorParam = searchParams.get('error');

    if (linkedParam === '1') {
      setGoogleSuccessMsg('Your Google account has been successfully linked!');
      router.replace('/account/profile');
    } else if (errorParam === 'GoogleAlreadyLinkedToAnotherAccount') {
      setGoogleErrorMsg('This Google account is already linked to another Skyline account. Please use a different Google account.');
      router.replace('/account/profile');
    } else if (errorParam) {
      setGoogleErrorMsg(`Authentication error: ${errorParam}`);
      router.replace('/account/profile');
    }
  }, [searchParams, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    startTransition(async () => {
      try {
        await updateProfileAction({
          name: name.trim(),
          phone: phone.trim() || null,
          studentId: studentId.trim() || null,
          college: college.trim() || null,
          emailOptIn,
        });

        setSuccessMsg('Your profile and email announcement preferences have been updated!');
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to update profile. Please try again.');
      }
    });
  };

  const handleConnectGoogle = async () => {
    setIsGoogleLinking(true);
    setGoogleErrorMsg(null);
    setGoogleSuccessMsg(null);

    try {
      await prepareGoogleLinkAction();
      await signIn('google', { callbackUrl: '/account/profile?linked=1' });
    } catch (err: any) {
      setIsGoogleLinking(false);
      setGoogleErrorMsg(err?.message || 'Failed to initialize Google linking.');
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account from this student profile?')) {
      return;
    }

    setIsGoogleLinking(true);
    setGoogleErrorMsg(null);
    setGoogleSuccessMsg(null);

    try {
      await unlinkGoogleAction();
      setGoogleSuccessMsg('Google account disconnected successfully.');
      router.refresh();
      setTimeout(() => setGoogleSuccessMsg(null), 4000);
    } catch (err: any) {
      setGoogleErrorMsg(err?.message || 'Failed to unlink Google account.');
    } finally {
      setIsGoogleLinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── MAIN PROFILE & PREFERENCES CARD ─── */}
      <Card className="border border-border rounded-3xl shadow-xs overflow-hidden bg-card">
        {/* Profile Card Header */}
        <div className="p-6 sm:p-8 bg-muted/30 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md shadow-primary/20 shrink-0">
                {name ? name.trim()[0].toUpperCase() : 'U'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {name || 'Complete Your Profile'}
                  </h2>
                  {role === 'admin' ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                      <Shield className="w-3 h-3 mr-1" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs font-medium">
                      Student
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {successMsg && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Full Name *
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            {/* Email (Read Only Authentication Identity) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Primary Student Account Email
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Managed via Auth
                </span>
              </label>
              <Input
                type="email"
                disabled
                value={profile.email}
                className="h-11 rounded-xl text-sm bg-muted/50 cursor-not-allowed opacity-80"
              />
              <p className="text-[11px] text-muted-foreground">
                Your registered student email is permanently tied to your university student record.
              </p>
            </div>

            {/* Student ID & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" /> Student ID / Roll No.
                </label>
                <Input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. S2026-8941"
                  className="h-11 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Contact Phone
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-11 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* College / Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> College / Department
              </label>
              <Input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. School of Computer Science & Engineering"
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────────────────
              EMAIL ANNOUNCEMENT PREFERENCES SECTION
          ─────────────────────────────────────────────────────────────────────────── */}
          <div className="pt-6 border-t border-border space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Email Notifications & Announcements
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage how you receive communications from the student council and campus clubs.
                </p>
              </div>
            </div>

            {/* Interactive Toggle Card */}
            <div 
              onClick={() => setEmailOptIn(!emailOptIn)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                emailOptIn
                  ? 'bg-primary/5 border-primary/30 shadow-xs'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  emailOptIn ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      Campus Announcements via Email
                    </span>
                    {emailOptIn ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Subscribed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                        Muted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                    {emailOptIn
                      ? 'You will receive email notifications whenever official announcements, fest lineups, and club bulletins are broadcasted to the student body.'
                      : 'You are opted out of broadcast announcement emails. Essential transactional emails (ticket receipts, passwordless logins, expense payouts) will always be delivered.'}
                  </p>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <div className="flex items-center sm:self-center shrink-0 pl-13 sm:pl-0">
                <div 
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                    emailOptIn ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      emailOptIn ? 'translate-x-6' : 'translate-x-0'
                    }`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Last updated profile syncs across all campus passes.
            </span>
            <Button
              type="submit"
              disabled={isPending}
              className="px-6 h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* ─── CONNECTED ACCOUNTS / GOOGLE INTEGRATION CARD ─── */}
      <Card className="border border-border rounded-3xl shadow-xs overflow-hidden bg-card">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">
                  Connected Accounts & Sign-In Methods
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Connect external identities to sign in with 1-click without entering passwords or waiting for magic links.
              </p>
            </div>
          </div>

          {/* Google feedback alerts */}
          {googleSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{googleSuccessMsg}</span>
            </div>
          )}

          {googleErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-0">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{googleErrorMsg}</span>
            </div>
          )}

          {/* Google Account Row */}
          <div className="p-5 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white border border-border/80 flex items-center justify-center shadow-xs shrink-0 p-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Google Account</span>
                  {profile.hasGoogleLinked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                      Not Linked
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile.hasGoogleLinked
                    ? 'Your Google account is linked. You can sign in using Google on the login page anytime.'
                    : 'Link your Google ID to enable 1-click Google Sign-In with this student account.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pl-15 sm:pl-0">
              {profile.hasGoogleLinked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGoogleLinking}
                  onClick={handleUnlinkGoogle}
                  className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border-border hover:border-destructive/30 transition-colors"
                >
                  {isGoogleLinking ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Disconnect Google
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={isGoogleLinking}
                  onClick={handleConnectGoogle}
                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs transition-all flex items-center gap-2"
                >
                  {isGoogleLinking ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Connect Google ID</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
