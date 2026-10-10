'use client';

import { useState } from 'react';
import { recordTakingsAction, assignTaskAction } from '@/server/actions/fundraisers';

export default function AdminFundraiserExtras({ fundraiser, volunteers, tasks }: { fundraiser: any, volunteers: any[], tasks: any[] }) {
  const [takingAmount, setTakingAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'upi_manual'>('cash');
  const [note, setNote] = useState('');
  
  const handleTakings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takingAmount) return;
    await recordTakingsAction(fundraiser.id, Math.round(parseFloat(takingAmount) * 100), method, note);
    setTakingAmount('');
    setNote('');
  };

  const handleAssign = async (taskId: string, userId: string) => {
    if (!userId) return;
    await assignTaskAction(taskId, userId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="font-bold mb-4">Record Takings</h2>
        <form onSubmit={handleTakings} className="space-y-2">
          <input 
            type="number" 
            placeholder="Amount (₹)" 
            value={takingAmount} 
            onChange={e => setTakingAmount(e.target.value)} 
            className="border p-2 w-full"
          />
          <select value={method} onChange={e => setMethod(e.target.value as any)} className="border p-2 w-full">
            <option value="cash">Cash</option>
            <option value="upi_manual">UPI Manual</option>
          </select>
          <input 
            type="text" 
            placeholder="Note (optional)" 
            value={note} 
            onChange={e => setNote(e.target.value)} 
            className="border p-2 w-full"
          />
          <button className="bg-green-600 text-white p-2 w-full rounded">Record Income</button>
        </form>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="font-bold mb-4">Assign Tasks</h2>
        {tasks.filter(t => !t.assigneeId).length === 0 ? (
          <p className="text-sm text-gray-500">No unassigned tasks.</p>
        ) : (
          <div className="space-y-2">
            {tasks.filter(t => !t.assigneeId).map(t => (
              <div key={t.id} className="text-sm border-b pb-2">
                <div className="font-semibold">{t.title}</div>
                <select 
                  onChange={e => handleAssign(t.id, e.target.value)}
                  className="mt-1 border p-1 w-full text-xs"
                  defaultValue=""
                >
                  <option value="" disabled>Select Volunteer...</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.email})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Volunteers ({volunteers.length})</h2>
        <ul className="text-sm space-y-1">
          {volunteers.map(v => (
            <li key={v.id}>{v.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

