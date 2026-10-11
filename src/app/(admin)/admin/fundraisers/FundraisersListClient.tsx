'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HeartHandshake,
  Plus,
  Search,
  Calendar,
  MapPin,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Trash2,
  Filter,
  X,
  IndianRupee,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { formatPaise } from '@/lib/format';
import { deleteFundraiserAction } from '@/server/actions/fundraisers';

export interface AdminFundraiserItem {
  id: string;
  name: string;
  location?: string | null;
  date: Date | string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  goalPaise: number;
  raisedPaise: number;
  tasksTotal: number;
  tasksDone: number;
  onTrack: 'On track' | 'Behind' | 'At risk';
}

interface FundraisersListClientProps {
  fundraisers: AdminFundraiserItem[];
}

export function FundraisersListClient({ fundraisers }: FundraisersListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalRaised = 0;
    let totalGoal = 0;
    let activeCount = 0;
    let onTrackCount = 0;

    fundraisers.forEach((f) => {
      totalRaised += f.raisedPaise;
      totalGoal += f.goalPaise;
      if (f.status === 'active') activeCount++;
      if (f.onTrack === 'On track') onTrackCount++;
    });

    const overallProgress = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

    return {
      totalRaised,
      totalGoal,
      activeCount,
      totalCount: fundraisers.length,
      onTrackCount,
      overallProgress,
    };
  }, [fundraisers]);

  // Filtered List
  const filteredFundraisers = useMemo(() => {
    return fundraisers.filter((f) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.location && f.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesHealth =
        healthFilter === 'all' ||
        (healthFilter === 'on-track' && f.onTrack === 'On track') ||
        (healthFilter === 'attention' && f.onTrack !== 'On track');

      return matchesSearch && matchesStatus && matchesHealth;
    });
  }, [fundraisers, searchQuery, statusFilter, healthFilter]);

  const handleDelete = async (id: string, name: string) => {
    const confirmMsg = `Are you sure you want to delete "${name}"?\n\nThis will remove all associated volunteer tasks and assignments. Double-entry ledger entries will remain intact.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteFundraiserAction(id);
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete fundraiser');
      } finally {
        setDeletingId(null);
      }
    });
  };

  const statusBadges = {
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            Fundraisers & Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track club fundraising campaigns, volunteer tasks, collections, and financial milestones.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/volunteer"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold shadow-xs transition-colors text-foreground"
          >
            <span>Volunteer Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>
          <Link
            href="/admin/fundraisers/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fundraiser</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Raised</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatPaise(metrics.totalRaised)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {metrics.overallProgress}% of {formatPaise(metrics.totalGoal)} goal
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Campaigns</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {metrics.activeCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Out of {metrics.totalCount} total campaigns
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Goal</span>
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {formatPaise(metrics.totalGoal)}
          </div>
          <p className="text-[11px] text-muted-foreground">Cumulative target</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pace & Health</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {metrics.onTrackCount} / {metrics.totalCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Campaigns on track</p>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by fundraiser name or venue..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Health Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Health Statuses</option>
              <option value="on-track">✓ On Track Only</option>
              <option value="attention">⚠ Needs Attention</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'active', label: 'Active' },
            { id: 'planning', label: 'Planning' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fundraisers List: Desktop Table + Mobile Cards */}
      {filteredFundraisers.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-border bg-card shadow-xs space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div className="text-base sm:text-lg font-semibold text-foreground">
            No fundraisers found
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || healthFilter !== 'all'
              ? 'Try changing your search terms or filter criteria.'
              : 'Get started by creating your first club fundraiser campaign.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || healthFilter !== 'all') ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setHealthFilter('all');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              href="/admin/fundraisers/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Fundraiser
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                    <th className="px-5 py-3.5">Fundraiser & Venue</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Goal vs Raised</th>
                    <th className="px-4 py-3.5 text-center">Tasks</th>
                    <th className="px-4 py-3.5">Health</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredFundraisers.map((f) => {
                    const percent =
                      f.goalPaise > 0 ? Math.min(100, Math.round((f.raisedPaise / f.goalPaise) * 100)) : 0;
                    const eventDate = new Date(f.date);
                    const HealthIcon = healthBadges[f.onTrack]?.icon || Activity;

                    return (
                      <tr key={f.id} className="hover:bg-muted/40 transition-colors">
                        {/* Name & Venue */}
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/fundraisers/${f.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors text-sm"
                          >
                            {f.name}
                          </Link>
                          {f.location && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{f.location}</span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                              statusBadges[f.status] || 'bg-muted text-foreground'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {eventDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Goal vs Raised */}
                        <td className="px-5 py-4 min-w-[180px]">
                          <div className="flex justify-between items-baseline text-xs mb-1">
                            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              {formatPaise(f.raisedPaise)}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              of {formatPaise(f.goalPaise)}
                            </span>
                          </div>
                          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground text-right mt-0.5">
                            {percent}% reached
                          </div>
                        </td>

                        {/* Tasks Done / Total */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-foreground">
                            <Layers className="w-3 h-3 text-muted-foreground" />
                            <span>
                              {f.tasksDone}/{f.tasksTotal}
                            </span>
                          </div>
                        </td>

                        {/* Health */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-bold border ${
                              healthBadges[f.onTrack]?.bg || 'bg-muted text-foreground'
                            }`}
                          >
                            <HealthIcon className="w-3 h-3" />
                            <span>{f.onTrack}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/fundraisers/${f.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                            >
                              Manage
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(f.id, f.name)}
                              disabled={isPending && deletingId === f.id}
                              title="Delete Fundraiser"
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredFundraisers.map((f) => {
              const percent =
                f.goalPaise > 0 ? Math.min(100, Math.round((f.raisedPaise / f.goalPaise) * 100)) : 0;
              const eventDate = new Date(f.date);
              const HealthIcon = healthBadges[f.onTrack]?.icon || Activity;

              return (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/fundraisers/${f.id}`}
                        className="font-bold text-foreground hover:text-primary transition-colors text-sm line-clamp-1"
                      >
                        {f.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {eventDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {f.location && (
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <MapPin className="w-3 h-3" />
                            {f.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border shrink-0 ${
                        statusBadges[f.status] || 'bg-muted text-foreground'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatPaise(f.raisedPaise)}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Goal: {formatPaise(f.goalPaise)}
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full font-bold border ${
                          healthBadges[f.onTrack]?.bg || 'bg-muted text-foreground'
                        }`}
                      >
                        <HealthIcon className="w-3 h-3" />
                        <span>{f.onTrack}</span>
                      </span>

                      <span className="text-[11px] text-muted-foreground">
                        {f.tasksDone}/{f.tasksTotal} tasks
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/fundraisers/${f.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Manage
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id, f.name)}
                        disabled={isPending && deletingId === f.id}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

