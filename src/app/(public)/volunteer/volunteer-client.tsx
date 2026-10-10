'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  HandHeart,
  Calendar,
  CheckCircle2,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  X,
  UserCheck,
  Check,
  Sparkles,
  Receipt,
} from 'lucide-react';
import {
  joinFundraiserAction,
  addFundraiserTaskAction,
  updateTaskStatusAction,
} from '@/server/actions/fundraisers';

interface FundraiserItem {
  id: string;
  name: string;
  date: string;
  location: string;
  goalPaise: number;
  raisedPaise: number;
  status: string;
  isJoined: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  dueAt: string | null;
  status: 'todo' | 'doing' | 'done' | 'blocked';
  fundraiserId: string;
  fundraiserName: string;
}

export function VolunteerClient({
  initialFundraisers,
  initialMyTasks,
  currentUserId,
}: {
  initialFundraisers: FundraiserItem[];
  initialMyTasks: TaskItem[];
  currentUserId: string;
}) {
  const [fundraisers, setFundraisers] = useState<FundraiserItem[]>(initialFundraisers);
  const [myTasks, setMyTasks] = useState<TaskItem[]>(initialMyTasks);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedFundraiserId, setSelectedFundraiserId] = useState(
    initialFundraisers[0]?.id || ''
  );
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assignToMe, setAssignToMe] = useState(true);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const handleJoin = (fId: string) => {
    startTransition(async () => {
      try {
        await joinFundraiserAction(fId);
        setFundraisers((prev) =>
          prev.map((f) => (f.id === fId ? { ...f, isJoined: true } : f))
        );
        setFeedback({ text: 'You joined the volunteer team!' });
      } catch (err: any) {
        setFeedback({ text: err.message || 'Failed to join fundraiser', error: true });
      }
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundraiserId || !taskTitle.trim()) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await addFundraiserTaskAction(selectedFundraiserId, {
          title: taskTitle.trim(),
          notes: taskNotes.trim() || undefined,
          dueAt: taskDueDate || undefined,
          assigneeId: assignToMe ? currentUserId : undefined,
        });

        const targetF = fundraisers.find((f) => f.id === selectedFundraiserId);

        // If assigned to me, add to myTasks list immediately
        if (assignToMe && res.task) {
          setMyTasks((prev) => [
            {
              id: res.task.id,
              title: res.task.title,
              dueAt: res.task.dueAt ? new Date(res.task.dueAt).toISOString() : null,
              status: 'todo',
              fundraiserId: selectedFundraiserId,
              fundraiserName: targetF?.name || 'Fundraiser',
            },
            ...prev,
          ]);
        }

        // Mark fundraiser as joined if not already
        setFundraisers((prev) =>
          prev.map((f) =>
            f.id === selectedFundraiserId ? { ...f, isJoined: true } : f
          )
        );

        setShowTaskModal(false);
        setTaskTitle('');
        setTaskNotes('');
        setTaskDueDate('');
        setFeedback({ text: `Task "${taskTitle}" added successfully!` });
      } catch (err: any) {
        setFeedback({ text: err.message || 'Failed to add task', error: true });
      }
    });
  };

  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'doing' | 'done' | 'blocked') => {
    startTransition(async () => {
      try {
        await updateTaskStatusAction(taskId, newStatus);
        setMyTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      } catch (err: any) {
        setFeedback({ text: err.message || 'Failed to update task status', error: true });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <HandHeart className="w-8 h-8 text-primary" /> Volunteer Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign up for fundraisers, manage your volunteer assignments, or create new tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-card hover:bg-muted text-foreground font-semibold rounded-[var(--radius-md)] text-sm transition-colors shadow-xs"
          >
            <Receipt className="w-4 h-4 text-amber-500" /> Submit Expense / Ledger Claim
          </Link>
          {fundraisers.length > 0 && (
            <button
              onClick={() => {
                setFeedback(null);
                setShowTaskModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-sm hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Volunteer Task
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-[var(--radius-md)] text-xs font-semibold flex items-center gap-2 ${
            feedback.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-success/10 text-success border border-success/20'
          }`}
        >
          {feedback.error ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: Fundraisers & Tasks */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Fundraisers (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Active Fundraisers
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {fundraisers.length} upcoming initiative{fundraisers.length === 1 ? '' : 's'}
            </span>
          </div>

          {fundraisers.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-[var(--radius-xl)] shadow-xs space-y-3">
              <HandHeart className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
              <p className="text-foreground font-semibold">No active fundraisers at the moment</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Check back soon or ask an administrator to schedule a new club fundraiser initiative.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {fundraisers.map((f) => (
                <div
                  key={f.id}
                  className="border border-border p-5 rounded-[var(--radius-xl)] bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-lg text-foreground leading-snug">{f.name}</h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        {f.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{new Date(f.date).toLocaleDateString()}</span>
                      </div>
                      {f.location && (
                        <div className="flex items-center gap-2">
                          <span className="truncate">📍 {f.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center gap-2">
                    {f.isJoined ? (
                      <Link
                        href={`/volunteer/fundraisers/${f.id}`}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-primary/10 text-primary font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Open Task Board <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleJoin(f.id)}
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 transition-opacity disabled:opacity-50 shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Join as Volunteer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: My Assigned Tasks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" /> My Tasks
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {myTasks.length} task{myTasks.length === 1 ? '' : 's'}
            </span>
          </div>

          {myTasks.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-[var(--radius-xl)] shadow-xs p-6 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto opacity-30" />
              <p className="text-foreground font-semibold text-sm">No pending tasks</p>
              <p className="text-xs text-muted-foreground">
                You have no volunteer tasks assigned. Join a fundraiser or click &quot;Add Volunteer Task&quot; above to volunteer for an item.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((t) => {
                const isOverdue =
                  t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'done';
                return (
                  <div
                    key={t.id}
                    className="border border-border p-4 rounded-[var(--radius-xl)] bg-card shadow-xs space-y-3 hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-foreground text-sm leading-snug">
                        {t.title}
                      </div>
                      <div className="text-[11px] font-medium text-primary mt-0.5">
                        {t.fundraiserName}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      {/* Due date */}
                      <span
                        className={`text-[11px] flex items-center gap-1 ${
                          isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {t.dueAt
                          ? new Date(t.dueAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'No due date'}
                      </span>

                      {/* Status selector */}
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleStatusChange(t.id, e.target.value as any)
                        }
                        className={`text-[11px] font-semibold px-2 py-1 rounded-[var(--radius-md)] border outline-none cursor-pointer ${
                          t.status === 'done'
                            ? 'bg-success/10 text-success border-success/30'
                            : t.status === 'doing'
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : t.status === 'blocked'
                            ? 'bg-destructive/10 text-destructive border-destructive/30'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <option value="todo">To Do</option>
                        <option value="doing">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Completed ✓</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADD VOLUNTEER TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-[var(--radius-xl)] shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-muted">
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Add Volunteer Task
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a task for a fundraiser initiative.
                </p>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Fundraiser Initiative *
                </label>
                <select
                  value={selectedFundraiserId}
                  onChange={(e) => setSelectedFundraiserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                >
                  {fundraisers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({new Date(f.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set up banner and audio system"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Instructions / Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific details, contact info, or locations..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Due Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="assignToMe"
                  checked={assignToMe}
                  onChange={(e) => setAssignToMe(e.target.checked)}
                  className="rounded-xs border-border"
                />
                <label htmlFor="assignToMe" className="text-xs text-foreground font-medium cursor-pointer">
                  Assign this task to myself immediately
                </label>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border rounded-[var(--radius-md)] text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !taskTitle.trim()}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 disabled:opacity-50 shadow-xs"
                >
                  {isPending ? 'Adding Task...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

