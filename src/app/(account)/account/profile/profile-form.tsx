'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, GraduationCap, Phone, Building2, 
  Megaphone, Bell, CheckCircle2, AlertCircle, RefreshCw, 
  Lock, Shield, Sparkles
} from 'lucide-react';
import { updateProfileAction } from '@/server/actions/profile';

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  studentId: string | null;
  college: string | null;
  emailOptIn: boolean;
  createdAt: Date;
}

interface ProfileFormProps {
  profile: ProfileData;
  role?: string;
}

export function ProfileForm({ profile, role = 'user' }: ProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [studentId, setStudentId] = useState(profile.studentId || '');
  const [college, setCollege] = useState(profile.college || '');
  const [emailOptIn, setEmailOptIn] = useState<boolean>(profile.emailOptIn ?? true);

  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
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
                  <Mail className="w-3.5 h-3.5 text-primary" /> University Sign-In Email
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
                Your login email is permanently tied to your university student record.
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
    </div>
  );
}

