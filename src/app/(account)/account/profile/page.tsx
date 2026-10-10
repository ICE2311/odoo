import { getCaller } from '@/server/auth/guards';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { User, Mail, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function ProfilePage() {
  const caller = await getCaller();
  if (caller.kind !== 'user') return null;

  async function updateProfile(formData: FormData) {
    'use server';
    const c = await getCaller();
    if (c.kind !== 'user') return;

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const studentId = formData.get('studentId') as string;

    await db.update(users).set({
      name,
      phone,
      studentId,
    }).where(eq(users.id, c.user.id));

    revalidatePath('/account/profile');
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="p-6 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[var(--radius-md)] bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{caller.user.name || 'Update your name'}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">{caller.user.email}</span>
              </div>
            </div>
          </div>
        </div>

        <form action={updateProfile} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={caller.user.name || ''} 
                  className="w-full pl-9 pr-4 py-2 border border-border bg-input rounded-[var(--radius-md)] text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Student ID</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    name="studentId" 
                    defaultValue={(caller.user as any).studentId || ''} 
                    className="w-full pl-9 pr-4 py-2 border border-border bg-input rounded-[var(--radius-md)] text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                    placeholder="e.g. S123456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  defaultValue={(caller.user as any).phone || ''} 
                  className="w-full px-4 py-2 border border-border bg-input rounded-[var(--radius-md)] text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                  placeholder="+91 xxxxx xxxxx"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <Button type="submit" className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] hover:opacity-90 shadow-sm transition-opacity">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
