import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ProfilePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Profile"
        subtitle="Manage your account settings"
      />

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Email
          </label>
          <input
            type="email"
            disabled
            className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Full Name
          </label>
          <input
            type="text"
            disabled
            className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Link href="/api/auth/signout">
            <Button variant="destructive">Sign Out</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
