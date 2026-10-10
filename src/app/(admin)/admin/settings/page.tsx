import { requireAdmin } from '@/server/auth/guards';
import { Settings } from 'lucide-react';

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Settings className="w-8 h-8 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-500 text-sm">Manage global application preferences.</p>
        </div>
      </div>
      <div className="bg-white border rounded-xl shadow-sm p-8 text-center text-gray-500">
        <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Settings configuration is not yet available.</p>
      </div>
    </div>
  );
}
