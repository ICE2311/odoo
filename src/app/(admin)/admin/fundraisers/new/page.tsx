'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  HeartHandshake,
  Calendar,
  MapPin,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { createFundraiserAction } from '@/server/actions/fundraisers';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewFundraiserPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [goalRupees, setGoalRupees] = useState('');
  const [budgetRupees, setBudgetRupees] = useState('');

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !date || !location.trim() || !goalRupees) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const goalVal = parseFloat(goalRupees);
    if (isNaN(goalVal) || goalVal <= 0) {
      setErrorMsg('Please enter a valid target goal amount.');
      return;
    }

    const budgetVal = budgetRupees ? parseFloat(budgetRupees) : undefined;
    if (budgetVal !== undefined && (isNaN(budgetVal) || budgetVal < 0)) {
      setErrorMsg('Please enter a valid budget amount.');
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const id = await createFundraiserAction({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          date,
          location: location.trim(),
          goalPaise: Math.round(goalVal * 100),
          budgetPaise: budgetVal !== undefined ? Math.round(budgetVal * 100) : undefined,
        });
        router.push(`/admin/fundraisers/${id}`);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to create fundraiser');
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/fundraisers"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fundraisers</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            Create New Fundraiser
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Launch a club fundraising campaign, set financial goals, and prepare volunteer assignments.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs sm:text-sm font-medium border border-destructive/20 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Campaign Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Annual Spring Bake Sale"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                URL Slug <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                placeholder="annual-spring-bake-sale"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono shadow-xs"
              />
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
                Target Fundraising Goal (₹) <span className="text-destructive">*</span>
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
                Budget Limit (₹) <span className="text-muted-foreground font-normal">(optional)</span>
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
              Description & Volunteer Instructions <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the mission of this fundraiser, instructions for volunteers, and booth setup requirements..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <Link
              href="/admin/fundraisers"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPending ? 'Creating Fundraiser...' : 'Launch Fundraiser'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
