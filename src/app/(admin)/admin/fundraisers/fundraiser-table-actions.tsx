'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { deleteFundraiserAction } from '@/server/actions/fundraisers';
import { useRouter } from 'next/navigation';

interface FundraiserTableActionsProps {
  fundraiserId: string;
  fundraiserName: string;
}

export function FundraiserTableActions({ fundraiserId, fundraiserName }: FundraiserTableActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmMsg = `Are you sure you want to delete "${fundraiserName}"?\n\nThis will also remove all associated volunteer tasks and assignments. This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      const res = await deleteFundraiserAction(fundraiserId);
      alert(res.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete fundraiser');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/fundraisers/${fundraiserId}`}
        className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-1"
      >
        Manage
        <ExternalLink className="w-3 h-3" />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        title="Delete Fundraiser"
        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

