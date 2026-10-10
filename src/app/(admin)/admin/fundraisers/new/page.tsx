'use client';

import { createFundraiserAction } from '@/server/actions/fundraisers';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewFundraiserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const id = await createFundraiserAction({
        name: fd.get('name') as string,
        slug: fd.get('slug') as string,
        description: fd.get('description') as string,
        date: fd.get('date') as string,
        location: fd.get('location') as string,
        goalPaise: Math.round(parseFloat(fd.get('goal') as string) * 100),
      });
      router.push(`/admin/fundraisers/${id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-4">Create Fundraiser</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block mb-1">Name</label><input required name="name" className="border p-2 w-full" /></div>
        <div><label className="block mb-1">Slug</label><input required name="slug" className="border p-2 w-full" /></div>
        <div><label className="block mb-1">Description</label><textarea required name="description" className="border p-2 w-full" /></div>
        <div><label className="block mb-1">Date</label><input required type="datetime-local" name="date" className="border p-2 w-full" /></div>
        <div><label className="block mb-1">Location</label><input required name="location" className="border p-2 w-full" /></div>
        <div><label className="block mb-1">Goal (₹)</label><input required type="number" name="goal" min="0" step="1" className="border p-2 w-full" /></div>
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}

