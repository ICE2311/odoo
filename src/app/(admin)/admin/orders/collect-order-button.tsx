'use client';

import { useState } from 'react';
import { markOrderCollected } from '@/server/actions/admin-shop';
import { Check, Loader2 } from 'lucide-react';

export function CollectOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handleCollect = async () => {
    if (!confirm('Mark this merch order as collected by the member?')) return;
    setLoading(true);
    try {
      await markOrderCollected(orderId);
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCollect}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      Mark Collected
    </button>
  );
}

