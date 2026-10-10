import { requireAdmin } from '@/server/auth/guards';
import { Settings } from 'lucide-react';

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Settings className="w-8 h-8 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage global application preferences.</p>
        </div>
      </div>
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-sm p-8 text-center text-muted-foreground">
        <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p>Settings configuration is not yet available.</p>
      </div>
    </div>
  );
}
