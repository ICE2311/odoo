'use client';

import { useState, useTransition } from 'react';
import {
  recordTakingsAction,
  assignTaskAction,
  addFundraiserTaskAction,
} from '@/server/actions/fundraisers';
import { Plus, CheckCircle2, AlertCircle, IndianRupee, Users } from 'lucide-react';
import { formatPaise } from '@/lib/format';

export default function AdminFundraiserExtras({
  fundraiser,
  volunteers,
  tasks,
}: {
  fundraiser: any;
  volunteers: any[];
  tasks: any[];
}) {
  const [takingAmount, setTakingAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'upi_manual'>('cash');
  const [note, setNote] = useState('');

  // Quick add task state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAssignee, setQuickAssignee] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');

  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleTakings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takingAmount) return;
    setStatusMsg(null);

    startTransition(async () => {
      try {
        await recordTakingsAction(
          fundraiser.id,
          Math.round(parseFloat(takingAmount) * 100),
          method,
          note
        );
        setTakingAmount('');
        setNote('');
        setStatusMsg({ text: 'Income recorded successfully!' });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to record takings', error: true });
      }
    });
  };

  const handleAssign = async (taskId: string, userId: string) => {
    if (!userId) return;
    setStatusMsg(null);

    startTransition(async () => {
      try {
        await assignTaskAction(taskId, userId);
        setStatusMsg({ text: 'Task assigned.' });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to assign task', error: true });
      }
    });
  };

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setStatusMsg(null);

    startTransition(async () => {
      try {
        await addFundraiserTaskAction(fundraiser.id, {
          title: quickTitle.trim(),
          assigneeId: quickAssignee || undefined,
          dueAt: quickDueDate || undefined,
        });
        setQuickTitle('');
        setQuickAssignee('');
        setQuickDueDate('');
        setStatusMsg({ text: `Task "${quickTitle}" created!` });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to add task', error: true });
      }
    });
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div
          className={`p-3 rounded-[var(--radius-md)] text-xs font-semibold flex items-center gap-2 ${
            statusMsg.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-success/10 text-success border border-success/20'
          }`}
        >
          {statusMsg.error ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Quick Add Task */}
      <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-3">
        <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Create Task
        </h2>
        <form onSubmit={handleQuickAddTask} className="space-y-2.5">
          <input
            type="text"
            placeholder="Task title..."
            required
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="border rounded-[var(--radius-md)] px-3 py-1.5 w-full text-xs bg-card outline-none focus:ring-1 focus:ring-primary"
          />

          <select
            value={quickAssignee}
            onChange={(e) => setQuickAssignee(e.target.value)}
            className="border rounded-[var(--radius-md)] px-2.5 py-1.5 w-full text-xs bg-card outline-none"
          >
            <option value="">Leave Unassigned (Open)</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id}>
                Assign: {v.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={quickDueDate}
            onChange={(e) => setQuickDueDate(e.target.value)}
            className="border rounded-[var(--radius-md)] px-2.5 py-1.5 w-full text-xs bg-card outline-none"
          />

          <button
            type="submit"
            disabled={isPending || !quickTitle.trim()}
            className="bg-primary text-primary-foreground font-semibold py-2 w-full rounded-[var(--radius-md)] text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isPending ? 'Creating...' : '+ Add Task to Board'}
          </button>
        </form>
      </div>

      {/* Record Takings */}
      <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-3">
        <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-success" /> Record Takings
        </h2>
        <form onSubmit={handleTakings} className="space-y-2.5">
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Amount in Rupees (₹)"
            value={takingAmount}
            onChange={(e) => setTakingAmount(e.target.value)}
            className="border rounded-[var(--radius-md)] px-3 py-1.5 w-full text-xs bg-card outline-none focus:ring-1 focus:ring-primary font-semibold"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="border rounded-[var(--radius-md)] px-2.5 py-1.5 w-full text-xs bg-card outline-none"
          >
            <option value="cash">Cash Collection</option>
            <option value="upi_manual">UPI Manual Transfer</option>
          </select>
          <input
            type="text"
            placeholder="Note (e.g. Bake sale day 1 cash box)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border rounded-[var(--radius-md)] px-3 py-1.5 w-full text-xs bg-card outline-none"
          />
          <button
            type="submit"
            disabled={isPending || !takingAmount}
            className="bg-success text-white font-semibold py-2 w-full rounded-[var(--radius-md)] text-xs hover:bg-success/90 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isPending ? 'Recording...' : 'Record Takings'}
          </button>
        </form>
      </div>

      {/* Assign Unassigned Tasks */}
      <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-3">
        <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Assign Open Tasks
        </h2>
        {tasks.filter((t) => !t.assigneeId).length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No unassigned tasks.</p>
        ) : (
          <div className="space-y-2">
            {tasks
              .filter((t) => !t.assigneeId)
              .map((t) => (
                <div key={t.id} className="text-xs border-b border-border pb-2 space-y-1">
                  <div className="font-semibold text-foreground">{t.title}</div>
                  <select
                    onChange={(e) => handleAssign(t.id, e.target.value)}
                    className="border rounded-[var(--radius-md)] p-1 w-full text-xs bg-card"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Assign to Volunteer...
                    </option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.email})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Volunteers List */}
      <div className="bg-card border rounded-[var(--radius-xl)] p-5 shadow-xs space-y-3">
        <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Volunteers ({volunteers.length})
        </h2>
        <ul className="text-xs space-y-1.5 divide-y divide-border">
          {volunteers.map((v) => (
            <li key={v.id} className="pt-1.5 flex justify-between items-center text-foreground">
              <span className="font-medium">{v.name}</span>
              <span className="text-[10px] text-muted-foreground">{v.email}</span>
            </li>
          ))}
          {volunteers.length === 0 && (
            <li className="text-muted-foreground italic">No volunteers joined yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
