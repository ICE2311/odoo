'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  claimTaskAction,
  updateTaskStatusAction,
  addFundraiserTaskAction,
  deleteFundraiserTaskAction,
  recordTakingsAction,
} from '@/server/actions/fundraisers';
import {
  Plus,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  X,
  Trash2,
  HandHeart,
  TrendingUp,
  Calendar,
  Layers,
  IndianRupee,
  Check,
  AlertTriangle
} from 'lucide-react';
import { formatPaise } from '@/lib/format';

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: 'todo' | 'doing' | 'done' | 'blocked';
  dueAt: Date | string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeImage?: string | null;
}

interface FundraiserBoardClientProps {
  data: any;
  currentUser: any;
  hideHeader?: boolean;
  onAddTask?: () => void;
  onRecordTakings?: () => void;
}

export default function FundraiserBoardClient({
  data,
  currentUser,
  hideHeader = false,
  onAddTask,
  onRecordTakings,
}: FundraiserBoardClientProps) {
  const { fundraiser, tasks: initialTasks = [], volunteers = [] } = data;

  const [tasksList, setTasksList] = useState<Task[]>(initialTasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  // Takings recording state
  const [showTakingsModal, setShowTakingsModal] = useState(false);
  const [takingAmount, setTakingAmount] = useState('');
  const [takingMethod, setTakingMethod] = useState<'cash' | 'upi_manual'>('cash');
  const [takingNote, setTakingNote] = useState('');

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync tasks when initialTasks prop updates
  useEffect(() => {
    setTasksList(initialTasks);
  }, [initialTasks]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (showAddModal || showTakingsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal, showTakingsModal]);

  const handleRecordTakings = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(takingAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await recordTakingsAction(
          fundraiser.id,
          Math.round(amountVal * 100),
          takingMethod,
          takingNote || `Fundraiser takings collected by ${currentUser.name || currentUser.email}`
        );
        setShowTakingsModal(false);
        setTakingAmount('');
        setTakingNote('');
        // Update local raised amount
        fundraiser.raisedPaise = (fundraiser.raisedPaise || 0) + Math.round(amountVal * 100);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to record takings');
      }
    });
  };

  const columns: Array<{
    id: 'todo' | 'doing' | 'blocked' | 'done';
    title: string;
    borderTop: string;
    dotColor: string;
    badgeBg: string;
  }> = [
    {
      id: 'todo',
      title: 'To Do',
      borderTop: 'border-t-primary',
      dotColor: 'bg-primary',
      badgeBg: 'bg-primary/10 text-primary',
    },
    {
      id: 'doing',
      title: 'In Progress',
      borderTop: 'border-t-amber-500',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'blocked',
      title: 'Blocked',
      borderTop: 'border-t-destructive',
      dotColor: 'bg-destructive',
      badgeBg: 'bg-destructive/10 text-destructive',
    },
    {
      id: 'done',
      title: 'Completed',
      borderTop: 'border-t-emerald-500',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
  ];

  const handleClaim = (taskId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await claimTaskAction(taskId);
        setTasksList((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  assigneeId: currentUser.id,
                  assigneeName: currentUser.name || currentUser.email,
                }
              : t
          )
        );
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to claim task');
      }
    });
  };

  const handleStatusUpdate = (taskId: string, newStatus: 'todo' | 'doing' | 'done' | 'blocked') => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await updateTaskStatusAction(taskId, newStatus);
        setTasksList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to update status');
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await deleteFundraiserTaskAction(taskId);
        setTasksList((prev) => prev.filter((t) => t.id !== taskId));
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete task');
      }
    });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await addFundraiserTaskAction(fundraiser.id, {
          title: newTaskTitle.trim(),
          notes: newTaskNotes.trim() || undefined,
          dueAt: newTaskDueDate || undefined,
          assigneeId: newTaskAssigneeId || undefined,
        });

        const created = res.task;
        const assignee = volunteers?.find((v: any) => v.id === newTaskAssigneeId);

        setTasksList((prev) => [
          ...prev,
          {
            id: created.id,
            title: created.title,
            notes: created.notes,
            status: 'todo',
            dueAt: created.dueAt,
            assigneeId: created.assigneeId,
            assigneeName: assignee?.name || (created.assigneeId === currentUser.id ? currentUser.name : null),
          },
        ]);

        setShowAddModal(false);
        setNewTaskTitle('');
        setNewTaskNotes('');
        setNewTaskDueDate('');
        setNewTaskAssigneeId('');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to create task');
      }
    });
  };

  const tasksDoneCount = tasksList.filter((t) => t.status === 'done').length;
  const progressPercent =
    fundraiser.goalPaise > 0
      ? Math.round((fundraiser.raisedPaise / fundraiser.goalPaise) * 100)
      : 0;

  const triggerAddTask = () => {
    if (onAddTask) {
      onAddTask();
    } else {
      setShowAddModal(true);
    }
  };

  const triggerRecordTakings = () => {
    if (onRecordTakings) {
      onRecordTakings();
    } else {
      setShowTakingsModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Progress & Metrics Card (only shown if not hidden) */}
      {!hideHeader && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <HandHeart className="w-6 h-6 text-primary" /> {fundraiser.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Goal: <strong>{formatPaise(fundraiser.goalPaise)}</strong> • Raised:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatPaise(fundraiser.raisedPaise)}
                </strong>{' '}
                ({progressPercent}%)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-center px-3 py-1.5 bg-muted rounded-xl border border-border">
                <div className="text-xs font-bold text-foreground">
                  {tasksDoneCount}/{tasksList.length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Tasks Done</div>
              </div>

              <div className="text-center px-3 py-1.5 bg-muted rounded-xl border border-border">
                <div className="text-xs font-bold text-foreground">{fundraiser.daysLeft}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Days Left</div>
              </div>

              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  fundraiser.onTrack === 'On track'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : fundraiser.onTrack === 'Behind'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-destructive/10 text-destructive border-destructive/30'
                }`}
              >
                {fundraiser.onTrack}
              </span>

              <button
                onClick={triggerRecordTakings}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Record Takings</span>
              </button>

              <button
                onClick={triggerAddTask}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = tasksList.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`bg-card/70 border border-border rounded-2xl p-3.5 flex flex-col min-h-[350px] shadow-xs border-t-4 ${col.borderTop}`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-border/60">
                <span className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  {col.title}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Quick Add Button in To Do column */}
              {col.id === 'todo' && (
                <button
                  type="button"
                  onClick={triggerAddTask}
                  className="w-full mb-3 py-2 px-3 border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-primary/50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              )}

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1">
                {colTasks.map((t) => {
                  const isOverdue =
                    t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'done';
                  const canManage =
                    currentUser.isAdmin || t.assigneeId === currentUser.id;

                  return (
                    <div
                      key={t.id}
                      className="bg-card border border-border rounded-xl p-3.5 shadow-xs space-y-2.5 hover:border-primary/40 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="font-semibold text-foreground text-xs leading-snug">
                          {t.title}
                        </div>
                        {currentUser.isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            className="text-muted-foreground hover:text-destructive p-0.5 rounded-md hover:bg-destructive/10 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {t.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                          {t.notes}
                        </p>
                      )}

                      <div className="space-y-1.5 pt-1 text-[11px]">
                        {/* Due date */}
                        {t.dueAt && (
                          <div
                            className={`flex items-center gap-1.5 ${
                              isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'
                            }`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {isOverdue ? 'Overdue: ' : 'Due: '}
                              {new Date(t.dueAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Assignee */}
                        <div className="text-muted-foreground flex items-center gap-1.5">
                          <User className="w-3 h-3 shrink-0" />
                          {t.assigneeId ? (
                            <span className="font-medium text-foreground truncate">
                              {t.assigneeName || 'Assigned'}
                              {t.assigneeId === currentUser.id ? ' (You)' : ''}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
                        {!t.assigneeId && (
                          <button
                            type="button"
                            onClick={() => handleClaim(t.id)}
                            disabled={isPending}
                            className="w-full py-1 text-center bg-primary/10 text-primary font-semibold rounded-lg text-[11px] hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            Claim Task
                          </button>
                        )}

                        {canManage && (
                          <select
                            value={t.status}
                            onChange={(e) =>
                              handleStatusUpdate(t.id, e.target.value as any)
                            }
                            className="w-full text-[11px] font-medium border border-border rounded-lg py-1 px-2 bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="todo">Status: To Do</option>
                            <option value="doing">Status: In Progress</option>
                            <option value="blocked">Status: Blocked</option>
                            <option value="done">Status: Completed ✓</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-xs italic">
                    No tasks in {col.title.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD TASK MODAL (for standalone volunteer page or fallback) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full overflow-hidden zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center bg-muted/40">
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Create Volunteer Task
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{fundraiser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Task Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set up ticket booth at entrance"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Instructions / Notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add details, tools needed, or instructions for volunteers..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Due Date</label>
                <input
                  type="datetime-local"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              {currentUser.isAdmin && volunteers && volunteers.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Assign Volunteer (optional)
                  </label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  >
                    <option value="">Leave Unassigned (Open for Claiming)</option>
                    {volunteers.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newTaskTitle.trim()}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isPending ? 'Creating...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Takings Modal (for standalone volunteer page or fallback) */}
      {showTakingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <span>Record Takings to Ledger</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTakingsModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTakings} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Amount Collected (₹) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="500.00"
                    value={takingAmount}
                    onChange={(e) => setTakingAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 border border-border rounded-xl text-xs sm:text-sm font-semibold bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Payment Method <span className="text-destructive">*</span>
                </label>
                <select
                  value={takingMethod}
                  onChange={(e) => setTakingMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="cash">Cash Collection (Cash Box / In-Hand)</option>
                  <option value="upi_manual">UPI Manual Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bake sale day 1 cash box, donation stall table 2"
                  value={takingNote}
                  onChange={(e) => setTakingNote(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  This transaction will be appended to the official double-entry ledger.
                </p>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTakingsModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !takingAmount}
                  className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isPending ? 'Recording Entry...' : 'Save to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
