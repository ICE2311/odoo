'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Target,
  Wallet,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  Edit3,
  Layers,
  IndianRupee,
  Receipt,
  Save,
  TrendingUp,
  Plus,
  X,
  AlertTriangle,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { formatPaise, formatDateTime } from '@/lib/format';
import {
  updateFundraiserAction,
  deleteFundraiserAction,
  addFundraiserTaskAction,
  recordTakingsAction
} from '@/server/actions/fundraisers';
import FundraiserBoardClient from '@/app/(public)/volunteer/fundraisers/[id]/FundraiserBoardClient';

interface AdminFundraiserClientProps {
  data: any;
  currentUser: any;
}

function toDatetimeLocalString(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminFundraiserClient({ data, currentUser }: AdminFundraiserClientProps) {
  const router = useRouter();
  const { fundraiser, tasks = [], volunteers = [], takings = [] } = data;

  const [activeTab, setActiveTab] = useState<'board' | 'financials' | 'edit' | 'volunteers'>('board');

  // Edit form state
  const [name, setName] = useState(fundraiser.name || '');
  const [description, setDescription] = useState(fundraiser.description || '');
  const [date, setDate] = useState(toDatetimeLocalString(fundraiser.date));
  const [location, setLocation] = useState(fundraiser.location || '');
  const [goalRupees, setGoalRupees] = useState((fundraiser.goalPaise / 100).toString());
  const [budgetRupees, setBudgetRupees] = useState(
    fundraiser.budgetPaise ? (fundraiser.budgetPaise / 100).toString() : ''
  );
  const [status, setStatus] = useState<'planning' | 'active' | 'completed' | 'cancelled'>(
    fundraiser.status || 'planning'
  );

  // Unified Modals state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');

  const [showTakingsModal, setShowTakingsModal] = useState(false);
  const [takingAmount, setTakingAmount] = useState('');
  const [takingMethod, setTakingMethod] = useState<'cash' | 'upi_manual'>('cash');
  const [takingNote, setTakingNote] = useState('');

  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Sync state if fundraiser prop updates
  useEffect(() => {
    setName(fundraiser.name || '');
    setDescription(fundraiser.description || '');
    setDate(toDatetimeLocalString(fundraiser.date));
    setLocation(fundraiser.location || '');
    setGoalRupees((fundraiser.goalPaise / 100).toString());
    setBudgetRupees(fundraiser.budgetPaise ? (fundraiser.budgetPaise / 100).toString() : '');
    setStatus(fundraiser.status || 'planning');
  }, [fundraiser]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (showAddTaskModal || showTakingsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddTaskModal, showTakingsModal]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goalRupees || !date || !location.trim()) {
      setStatusMsg({ text: 'Please fill in all required fields.', error: true });
      return;
    }

    const goalPaise = Math.round(parseFloat(goalRupees) * 100);
    const budgetPaise = budgetRupees ? Math.round(parseFloat(budgetRupees) * 100) : undefined;

    setStatusMsg(null);
    startTransition(async () => {
      try {
        await updateFundraiserAction(fundraiser.id, {
          name: name.trim(),
          description: description.trim(),
          date,
          location: location.trim(),
          goalPaise,
          budgetPaise,
          status,
        });
        setStatusMsg({ text: 'Fundraiser updated successfully!' });
        router.refresh();
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to update fundraiser', error: true });
      }
    });
  };

  const handleDelete = async () => {
    const confirmText = `Are you sure you want to delete "${fundraiser.name}"?\n\nThis will permanently remove the fundraiser, its tasks, and volunteer assignments. Double-entry ledger entries will remain intact.`;
    if (!window.confirm(confirmText)) return;

    startTransition(async () => {
      try {
        await deleteFundraiserAction(fundraiser.id);
        router.push('/admin/fundraisers');
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to delete fundraiser', error: true });
      }
    });
  };

  // Create Task Handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    startTransition(async () => {
      try {
        await addFundraiserTaskAction(fundraiser.id, {
          title: taskTitle.trim(),
          notes: taskNotes.trim() || undefined,
          dueAt: taskDueDate || undefined,
          assigneeId: taskAssigneeId || undefined,
        });
        setShowAddTaskModal(false);
        setTaskTitle('');
        setTaskNotes('');
        setTaskDueDate('');
        setTaskAssigneeId('');
        setStatusMsg({ text: 'Task added successfully to the board!' });
        router.refresh();
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to add task', error: true });
      }
    });
  };

  // Record Takings Handler
  const handleRecordTakings = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(takingAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setStatusMsg({ text: 'Please enter a valid takings amount.', error: true });
      return;
    }

    startTransition(async () => {
      try {
        await recordTakingsAction(
          fundraiser.id,
          Math.round(amountVal * 100),
          takingMethod,
          takingNote || `Takings recorded for ${fundraiser.name}`
        );
        setShowTakingsModal(false);
        setTakingAmount('');
        setTakingNote('');
        setStatusMsg({ text: 'Takings successfully recorded to the ledger!' });
        router.refresh();
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to record takings', error: true });
      }
    });
  };

  const statusColors = {
    planning: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  };

  const healthBadges = {
    'On track': {
      bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      icon: CheckCircle2,
    },
    Behind: {
      bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      icon: AlertTriangle,
    },
    'At risk': {
      bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      icon: AlertCircle,
    },
  };

  const progressPercent =
    fundraiser.goalPaise > 0
      ? Math.min(100, Math.round((fundraiser.raisedPaise / fundraiser.goalPaise) * 100))
      : 0;

  const tasksDoneCount = tasks.filter((t: any) => t.status === 'done').length;
  const HealthIcon = healthBadges[fundraiser.onTrack as keyof typeof healthBadges]?.icon || Activity;

  return (
    <div className="space-y-6">
      {/* ─── MASTER HEADER ─── */}
      <div className="space-y-4">
        {/* Breadcrumb row */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/fundraisers"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Fundraisers</span>
          </Link>
          <Link
            href={`/volunteer/fundraisers/${fundraiser.id}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <span>Public Volunteer Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Master Hero Card */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Metadata */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {fundraiser.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                    statusColors[fundraiser.status as keyof typeof statusColors] || 'bg-muted text-foreground'
                  }`}
                >
                  {fundraiser.status}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    healthBadges[fundraiser.onTrack as keyof typeof healthBadges]?.bg || 'bg-muted text-foreground'
                  }`}
                >
                  <HealthIcon className="w-3 h-3" />
                  <span>{fundraiser.onTrack}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {new Date(fundraiser.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {fundraiser.location}
                </span>
                {fundraiser.budgetPaise ? (
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-primary" />
                    Budget: {formatPaise(fundraiser.budgetPaise)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => setShowTakingsModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Record Takings</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddTaskModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Financial Progress Bar & KPI metrics */}
          <div className="pt-3 border-t border-border/70 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-bold font-mono text-base text-emerald-600 dark:text-emerald-400">
                  {formatPaise(fundraiser.raisedPaise)}
                </span>
                <span className="text-muted-foreground font-mono">
                  raised of {formatPaise(fundraiser.goalPaise)} target ({progressPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
                <span>
                  <strong>{fundraiser.daysLeft}</strong> days left
                </span>
                <span>•</span>
                <span>
                  <strong>{tasksDoneCount}/{tasks.length}</strong> tasks completed
                </span>
              </div>
            </div>

            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unified Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-border gap-2 pb-px scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'board'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Task Board</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-muted font-mono font-medium">
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'financials'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Takings & Financials</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-muted font-mono font-medium">
              {takings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'edit'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('volunteers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'volunteers'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Volunteers</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-muted font-mono font-medium">
              {volunteers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Status Alert */}
      {statusMsg && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-between gap-2.5 border shadow-xs animate-in fade-in duration-200 ${
            statusMsg.error
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.error ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="p-1 hover:opacity-75 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── TAB 1: TASK BOARD (hideHeader=true eliminates duplicate cards!) ─── */}
      {activeTab === 'board' && (
        <div className="w-full">
          <FundraiserBoardClient
            data={data}
            currentUser={currentUser}
            hideHeader={true}
            onAddTask={() => setShowAddTaskModal(true)}
            onRecordTakings={() => setShowTakingsModal(true)}
          />
        </div>
      )}

      {/* ─── TAB 2: TAKINGS & FINANCIALS ─── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Goal</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {formatPaise(fundraiser.goalPaise)}
              </div>
              <p className="text-[11px] text-muted-foreground">Campaign target</p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Raised</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatPaise(fundraiser.raisedPaise)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {fundraiser.goalPaise > 0
                  ? `${Math.round((fundraiser.raisedPaise / fundraiser.goalPaise) * 100)}% of target`
                  : 'No target set'}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Expenses</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatPaise(fundraiser.costsPaise || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground">Reimbursed club expenses</p>
            </div>

            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Net Profit</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-primary">
                {formatPaise(fundraiser.profitPaise || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground">Net funds for club treasury</p>
            </div>
          </div>

          {/* Takings Ledger Table */}
          <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden space-y-3">
            <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Recorded Takings Log</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All cash and manual UPI collections posted to this campaign and double-entry ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTakingsModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Takings</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Method</th>
                    <th className="px-4 py-3">Recorded By</th>
                    <th className="px-4 py-3">Note / Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {takings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        No takings recorded yet. Click &quot;Record Takings&quot; to log cash or UPI collections.
                      </td>
                    </tr>
                  ) : (
                    takings.map((t: any) => (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {formatDateTime(t.recordedAt)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatPaise(t.amountPaise)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                              t.method === 'cash'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            {t.method === 'cash' ? 'Cash' : 'UPI'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">
                          {t.recordedByName || 'Volunteer'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={t.note}>
                          {t.note || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: EDIT DETAILS ─── */}
      {activeTab === 'edit' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <span>Campaign Settings & Details</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Update fundraising targets, date and venue, or current lifecycle status.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Fundraiser Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Annual Spring Bake Sale"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Event Date & Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Location / Venue <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Student Center Plaza"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Target Goal Amount (₹) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={goalRupees}
                      onChange={(e) => setGoalRupees(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-8 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Estimated Budget Limit (₹) <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={budgetRupees}
                      onChange={(e) => setBudgetRupees(e.target.value)}
                      placeholder="10000"
                      className="w-full pl-8 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Description & Volunteer Instructions
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the purpose of this fundraiser and instructions for volunteers..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? 'Saving Changes...' : 'Save Fundraiser Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Deleting this fundraiser will permanently remove all tasks and volunteer signups. Ledger entries recorded from this fundraiser will remain intact.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Delete Fundraiser Permanently
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 4: VOLUNTEERS ─── */}
      {activeTab === 'volunteers' && (
        <div className="bg-card border border-border rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Volunteers Team ({volunteers.length})</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Active members who have signed up to support this fundraiser.
            </p>
          </div>

          {volunteers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs sm:text-sm">
              No volunteers have joined this fundraiser yet. Members can join from the Volunteer Portal.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {volunteers.map((v: any) => {
                const assignedTasks = tasks.filter((t: any) => t.assigneeId === v.id);
                return (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 hover:border-primary/30 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {v.name ? v.name.charAt(0).toUpperCase() : 'V'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">{v.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{v.email}</div>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Joined {new Date(v.joinedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      <span className="font-semibold text-foreground">
                        {assignedTasks.length} task{assignedTasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── UNIFIED MODAL: ADD TASK ─── */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full overflow-hidden zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center bg-muted/40">
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Create Volunteer Task</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{fundraiser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Task Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set up ticket booth at entrance"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
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
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Due Date</label>
                <input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              {volunteers && volunteers.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Assign Volunteer (optional)
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
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
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !taskTitle.trim()}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isPending ? 'Creating Task...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── UNIFIED MODAL: RECORD TAKINGS ─── */}
      {showTakingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-base sm:text-lg flex items-center gap-2">
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
