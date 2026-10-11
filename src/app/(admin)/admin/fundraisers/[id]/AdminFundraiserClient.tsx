'use client';

import React, { useState, useTransition } from 'react';
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
  Sparkles
} from 'lucide-react';
import { formatPaise, formatDateTime } from '@/lib/format';
import { updateFundraiserAction, deleteFundraiserAction } from '@/server/actions/fundraisers';
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

  const [activeTab, setActiveTab] = useState<'board' | 'edit' | 'financials' | 'volunteers'>('board');

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

  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goalRupees || !date) {
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
    const confirmText = `Are you sure you want to delete "${fundraiser.name}"?\n\nThis will permanently remove the fundraiser, its tasks, and volunteer assignments. This cannot be undone.`;
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

  const statusColors = {
    planning: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="space-y-4">
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
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="space-y-1">
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
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(fundraiser.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {fundraiser.location}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Goal: {formatPaise(fundraiser.goalPaise)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => setActiveTab('edit')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex overflow-x-auto border-b border-border gap-2 pb-px scrollbar-none">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'board'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Task Board</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-mono font-medium">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'edit'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Fundraiser</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'financials'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Takings & Financials</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-mono font-medium">
              {takings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('volunteers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'volunteers'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Volunteers</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-mono font-medium">
              {volunteers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 border shadow-sm ${
            statusMsg.error
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
          }`}
        >
          {statusMsg.error ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ─── TAB 1: FULL-WIDTH TASK BOARD ─── */}
      {activeTab === 'board' && (
        <div className="w-full">
          <FundraiserBoardClient data={data} currentUser={currentUser} />
        </div>
      )}

      {/* ─── TAB 2: EDIT FUNDRAISER DETAILS ─── */}
      {activeTab === 'edit' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-card border rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <span>Fundraiser Details</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Update campaign targets, dates, venue, or status.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Fundraiser Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Annual Spring Bake Sale"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
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
                    Event Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Location / Venue <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Student Center Plaza"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Target Goal Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-muted-foreground text-sm font-semibold">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={goalRupees}
                      onChange={(e) => setGoalRupees(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full pl-8 pr-3.5 py-2 text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Estimated Budget Limit (₹) <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-muted-foreground text-sm font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={budgetRupees}
                      onChange={(e) => setBudgetRupees(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full pl-8 pr-3.5 py-2 text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono shadow-xs"
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? 'Saving Changes...' : 'Save Fundraiser Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
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
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
            >
              Delete Fundraiser Permanently
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 3: TAKINGS & FINANCIALS ─── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Goal</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {formatPaise(fundraiser.goalPaise)}
              </div>
              <p className="text-[11px] text-muted-foreground">Fundraising target</p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Raised</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatPaise(fundraiser.raisedPaise)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {fundraiser.goalPaise > 0
                  ? `${Math.round((fundraiser.raisedPaise / fundraiser.goalPaise) * 100)}% of target`
                  : 'No goal set'}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direct Expenses</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatPaise(fundraiser.costsPaise || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground">Reimbursed club expenses</p>
            </div>

            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm space-y-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Net Profit</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-primary">
                {formatPaise(fundraiser.profitPaise || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground">Net funds for club treasury</p>
            </div>
          </div>

          {/* Takings Ledger Table */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden space-y-3">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Recorded Takings Log</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  All cash and manual UPI collections posted to this campaign.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('board')}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Record New in Task Board
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Date & Time</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold text-center">Method</th>
                    <th className="px-4 py-3 font-semibold">Recorded By</th>
                    <th className="px-4 py-3 font-semibold">Note / Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {takings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No takings recorded yet. Use &quot;Record Takings&quot; in the Task Board to log cash or UPI income.
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
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
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

      {/* ─── TAB 4: VOLUNTEERS ─── */}
      {activeTab === 'volunteers' && (
        <div className="bg-card border rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
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
            <div className="py-8 text-center text-muted-foreground text-xs sm:text-sm">
              No volunteers have joined this fundraiser yet. Members can join from the Volunteer Portal.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {volunteers.map((v: any) => {
                const assignedTasks = tasks.filter((t: any) => t.assigneeId === v.id);
                return (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 hover:border-primary/30 transition-all"
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
                    <div className="pt-1 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Joined {new Date(v.joinedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      <span className="font-semibold text-foreground">{assignedTasks.length} task{assignedTasks.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

