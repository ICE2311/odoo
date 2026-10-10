'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, ArrowRight, CheckCircle2, Users, Calendar, 
  ShoppingBag, ShieldCheck, QrCode, Zap, Star, 
  Check, Smartphone, Megaphone, ArrowUpRight, Award, 
  HelpCircle, ChevronDown, ChevronUp, Ticket, HeartHandshake,
  Layers, Lock, Clock, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LandingPageClientProps {
  caller: {
    kind: 'visitor' | 'user';
    user?: {
      name?: string | null;
      email?: string | null;
    };
    isMember?: boolean;
    isAdmin?: boolean;
  };
}

export function LandingPageClient({ caller }: LandingPageClientProps) {
  const [activeMockupTab, setActiveMockupTab] = useState<'pass' | 'ticket' | 'merch'>('pass');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const isLoggedIn = caller.kind === 'user';
  const ctaLink = isLoggedIn ? '/account' : '/register';
  const ctaText = isLoggedIn ? 'Go to My Account →' : 'Join Skyline Free →';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      
      {/* ───────────────────────────────────────────────────────────────────────────
          1. HERO SECTION
          • Bold, outcome-driven headline under 10 words
          • Clear subheadline explaining core value in 2 sentences
          • Dual CTAs: Primary button with high contrast, secondary action
          • Framed interactive product mockup placed beside main claim
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden border-b border-border/60 bg-radial-[at_top_center] from-primary/10 via-background to-background">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Outcome-Driven Copy */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>The All-In-One Campus Life Platform</span>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <span className="hidden sm:inline font-semibold text-foreground/80">Skyline 2026</span>
              </div>

              {/* Headline (< 10 words, bold & outcome-driven) */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.08]">
                Your Campus Life, Elevated in <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-secondary">One Unified App.</span>
              </h1>

              {/* Subheadline (2 concise sentences) */}
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Skyline gives college students instant access to exclusive events, varsity merch drops, and transparent club initiatives. Skip endless queues, unlock member privileges, and experience campus life without the friction.
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href={ctaLink} className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span>{ctaText}</span>
                  </Button>
                </Link>

                <Link href="/events" className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto h-13 px-7 rounded-2xl border-border bg-card/80 backdrop-blur-xs hover:bg-muted text-foreground font-semibold text-base shadow-xs hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <span>Explore Events & Drops</span>
                  </Button>
                </Link>
              </div>

              {/* Hero Micro-Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-6 pt-2 text-xs text-muted-foreground">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold border-2 border-background text-[10px]">A</div>
                  <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold border-2 border-background text-[10px]">R</div>
                  <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold border-2 border-background text-[10px]">S</div>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold border-2 border-background text-[10px]">+5k</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">4.9/5</span>
                  <span>from 2,400+ students</span>
                </div>
              </div>
            </div>

            {/* Right Column: Framed Interactive Product Visual / Mockup */}
            <div className="lg:col-span-5 relative flex justify-center">
              {/* Outer Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl opacity-75 -z-10" />

              <div className="w-full max-w-md bg-card/90 backdrop-blur-md border border-border/80 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
                {/* Mockup Top Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex bg-muted/70 p-0.5 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={() => setActiveMockupTab('pass')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        activeMockupTab === 'pass' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                      }`}
                    >
                      Member Pass
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('ticket')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        activeMockupTab === 'ticket' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                      }`}
                    >
                      Fast Ticket
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('merch')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        activeMockupTab === 'merch' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                      }`}
                    >
                      Merch Drop
                    </button>
                  </div>
                </div>

                {/* TAB 1: Digital Member Pass */}
                {activeMockupTab === 'pass' && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-primary to-indigo-950 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-36 h-36 bg-secondary/30 rounded-full blur-2xl" />
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[10px] font-bold tracking-widest uppercase opacity-75">
                            Skyline Student Association
                          </div>
                          <div className="text-lg font-black tracking-tight mt-0.5">
                            Digital Member Pass
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider">
                          Active 2026
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
                        <div>
                          <div className="text-[10px] text-white/70">STUDENT NAME</div>
                          <div className="text-sm font-bold tracking-tight">Arjun Mehta</div>
                          <div className="text-[11px] font-mono text-white/70 mt-0.5">ID: SKY-2026-9481</div>
                        </div>
                        
                        {/* Realistic Mock QR */}
                        <div className="w-16 h-16 bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center">
                          <QrCode className="w-full h-full text-slate-900" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-foreground">0.4s Door Check-in</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-foreground">35% Merch Discount</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Fast Ticket */}
                {activeMockupTab === 'ticket' && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-md space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-primary font-semibold text-xs border-primary/30">
                          Upcoming Gala Night
                        </Badge>
                        <span className="text-xs font-mono font-bold text-amber-600">Row A • Seat 14</span>
                      </div>
                      <h4 className="font-extrabold text-foreground text-base">
                        Annual Skyline Music Fest & Mixer
                      </h4>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" /> Friday, 7:00 PM • Campus Amphitheatre
                      </div>
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
                        <span>✓ Ticket Verified & Ready</span>
                        <span className="font-mono font-bold">₹0 Free Entry</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Merch Drop */}
                {activeMockupTab === 'merch' && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-md flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted/80 rounded-xl flex items-center justify-center text-primary text-2xl font-black">
                        👕
                      </div>
                      <div className="space-y-1 flex-1">
                        <Badge variant="outline" className="text-accent text-[10px] border-accent/30 font-bold uppercase">
                          Limited Edition
                        </Badge>
                        <h4 className="font-bold text-sm text-foreground">Skyline Varsity Hoodie</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-foreground">₹899</span>
                          <span className="text-xs text-muted-foreground line-through">₹1,399</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">SAVE 35%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Real-time Status Badge */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-medium text-foreground">Live Campus Network</span>
                  </div>
                  <span className="font-semibold text-primary">5,200+ Active Passes</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          2. SOCIAL PROOF BAR
          • Display trusted university badges, student ratings & metric badges immediately below the fold
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="py-10 bg-muted/40 border-b border-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-3">
              <div className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">5,200+</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                Active Student Members
              </div>
            </div>

            <div className="p-3">
              <div className="text-3xl lg:text-4xl font-black text-primary tracking-tight">45+</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                Sold-Out Campus Events
              </div>
            </div>

            <div className="p-3">
              <div className="text-3xl lg:text-4xl font-black text-emerald-600 tracking-tight">0.4s</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                Average QR Scan Time
              </div>
            </div>

            <div className="p-3">
              <div className="text-3xl lg:text-4xl font-black text-accent tracking-tight">100%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                Audited Treasury Ledger
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center justify-center gap-8 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            <span>Skyline Tech Society</span>
            <span>•</span>
            <span>Cultural Affairs Council</span>
            <span>•</span>
            <span>Athletics & Sports Union</span>
            <span>•</span>
            <span>Entrepreneurship Cell</span>
            <span>•</span>
            <span>Volunteer Guild</span>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          3. PROBLEM SECTION
          • Articulate exact pain points of the target audience with concise cards
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="outline" className="text-rose-600 border-rose-300 font-bold uppercase text-[11px] tracking-wider bg-rose-50">
              The Old Way Is Broken
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Campus Life Shouldn&apos;t Feel Like Juggling Broken Spreadsheets.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Before Skyline, college events and club activities meant chaos across multiple apps, lost receipts, and unverified payments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Pain Point 1 */}
            <div className="p-7 rounded-3xl border border-rose-200/80 bg-rose-500/5 space-y-4 hover:border-rose-300 transition-all card-hover">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl">
                ✕
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Messy WhatsApp Groups & Lost Links
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Important event announcements get buried under 400 spam messages and meme forwards. Half the batch finds out about the party the morning after.
              </p>
            </div>

            {/* Pain Point 2 */}
            <div className="p-7 rounded-3xl border border-rose-200/80 bg-rose-500/5 space-y-4 hover:border-rose-300 transition-all card-hover">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl">
                ✕
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Unverified Screenshots & 45-Min Lines
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Organizers forced to match UPI screenshots on Instagram DMs while crowds wait in huge auditorium queues searching through paper sheets.
              </p>
            </div>

            {/* Pain Point 3 */}
            <div className="p-7 rounded-3xl border border-rose-200/80 bg-rose-500/5 space-y-4 hover:border-rose-300 transition-all card-hover">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl">
                ✕
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Disappearing Receipts & Slow Payouts
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Volunteers paying out of pocket for event supplies and waiting months with zero visibility into whether club funds will ever reimburse them.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          4. SOLUTION / BENTO GRID SECTION
          • Modern, minimal bento-grid layout with glassmorphism aesthetic
          • 4 core features with custom micro-visuals
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-muted/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 font-bold uppercase text-[11px] tracking-wider bg-primary/10">
              The Skyline Solution
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Everything Under One Roof. Built for Speed.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Designed specifically for modern campus ecosystems — from instant door check-ins to verified varsity merch.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1 (Span 2): Digital Member Pass */}
            <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all card-hover relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4 max-w-lg z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  One Universal Pass. Instant 0.4s Door Scans.
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your phone is your campus VIP key. Flash your high-contrast QR pass at festivals, galas, and club workshops. Door staff verify authenticity instantly, even in packed auditoriums with zero network latency.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-3 h-3" /> Works in any browser
                  </span>
                  <span className="badge-pill bg-blue-50 text-blue-700 border border-blue-200">
                    <Check className="w-3 h-3" /> Anti-screenshot rotation
                  </span>
                </div>
              </div>

              {/* Decorative Mock Graphic */}
              <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">✓ Integrated with Door Staff Scanner</span>
                <span className="font-mono text-primary">SCAN_TIME_MS: 380ms</span>
              </div>
            </div>

            {/* Bento Card 2 (Span 1): Varsity Merch Shop */}
            <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xs hover:border-secondary/40 transition-all card-hover flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">
                  Exclusive Merch Drops
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Cop limited edition heavyweight hoodies, tees, and campus memorabilia with transparent member pricing and direct order tracking.
                </p>
              </div>

              <div className="mt-8 p-3 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Varsity Hoodie '26</span>
                <span className="font-bold text-emerald-600">Save 35%</span>
              </div>
            </div>

            {/* Bento Card 3 (Span 1): Transparent Ledger */}
            <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xs hover:border-amber-500/40 transition-all card-hover flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-xs">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">
                  Double-Entry Treasury
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every rupee accounted for. Volunteers submit receipts with proof and receive direct UPI reimbursement payouts backed by an open ledger.
                </p>
              </div>

              <div className="mt-8 p-3 rounded-2xl bg-muted/60 border border-border/80 text-xs space-y-1">
                <div className="flex justify-between font-mono font-medium">
                  <span className="text-emerald-600">+ ₹15,000 Gala Ticket Takings</span>
                </div>
                <div className="flex justify-between font-mono font-medium">
                  <span className="text-rose-600">- ₹1,400 Sound Equipment</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4 (Span 2): Campus Events & Volunteer Boards */}
            <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xs hover:border-accent/40 transition-all card-hover relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4 max-w-lg z-10">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Vibrant Campus Events & Fundraisers
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Discover verified concerts, tech hackathons, and charity drives. Join volunteer task boards, contribute to real causes, and earn verified recognition credentials on your student profile.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200">
                    <Check className="w-3 h-3" /> Real-time capacity counter
                  </span>
                  <span className="badge-pill bg-amber-50 text-amber-700 border border-amber-200">
                    <Check className="w-3 h-3" /> Volunteer task assignments
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">30+ Planned Events for the Academic Season</span>
                <Link href="/events" className="text-primary font-bold hover:underline flex items-center gap-1">
                  View Schedule <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          5. HOW IT WORKS (3 SIMPLE STEPS)
          • Demystify the onboarding or usage process in 3 simple steps
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="outline" className="text-secondary border-secondary/30 font-bold uppercase text-[11px] tracking-wider bg-secondary/10">
              Simple Onboarding
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Ready in 30 Seconds. Here&apos;s How It Works.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              No paper forms, no waiting for approvals, and no passwords to remember.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 relative card-hover">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center shadow-md shadow-primary/20">
                01
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Sign In with Email
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Log in instantly via magic link or Google OAuth using your verified university email. Your profile initializes automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 relative card-hover">
              <div className="w-12 h-12 rounded-2xl bg-secondary text-secondary-foreground font-black text-xl flex items-center justify-center shadow-md shadow-secondary/20">
                02
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Claim Your Digital Pass
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Activate your digital student pass to unlock member-only prices on tickets, subsidized varsity merch, and voting privileges.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 relative card-hover">
              <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground font-black text-xl flex items-center justify-center shadow-md shadow-accent/20">
                03
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Flash QR & Enjoy Campus
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Scan in at the door in under a second, track your merch orders, and volunteer for campus initiatives with total peace of mind.
              </p>
            </div>

          </div>

          <div className="text-center pt-4">
            <Link href={ctaLink}>
              <Button size="lg" className="rounded-2xl px-8 font-bold bg-primary text-primary-foreground shadow-lg hover:shadow-primary/30">
                Start Exploring Now →
              </Button>
            </Link>
          </div>

        </div>
      </section>


      {/* ───────────────────────────────────────────────────────────────────────────
          7. FAQ ACCORDION (CRO Objection Handling)
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about joining and using Skyline.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How do I get my Digital Member Pass?',
                a: 'Simply sign in using your email address. You will receive a magic login link or one-click Google verification. Your digital pass with your unique QR code is generated instantly in your student account.',
              },
              {
                q: 'Can non-members still attend campus events and buy merch?',
                a: 'Yes! Public events and merchandise drops are open to all students. However, verified Skyline members enjoy subsidized ticket rates (often ₹0 or 50% off), early access drops, and voting privileges.',
              },
              {
                q: 'How does the door staff QR check-in work?',
                a: 'When arriving at an event, open your phone to your Member Pass or Ticket in your browser. Door staff scan it with their camera in under 0.4 seconds. It works even with poor cellular network connections.',
              },
              {
                q: 'How do volunteer reimbursements work?',
                a: 'If you incur out-of-pocket costs for an approved club activity, navigate to My Account > Expenses & Ledger > File Expense Claim. Upload your bill or receipt link and enter your UPI ID. Once approved, payout is disbursed directly to your UPI.',
              },
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-border/80 rounded-2xl overflow-hidden bg-card transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-foreground flex items-center justify-between gap-4 text-sm sm:text-base hover:bg-muted/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          8. FINAL HIGH-CONVERTING CTA BLOCK
          • Friction-removing subtext (No credit card required)
          • Final conversion button with strong outcome
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-radial-[at_center] from-primary/15 via-background to-background relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-indigo-950 via-primary to-indigo-900 text-white shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-secondary" /> Elevate Your Student Life
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to Experience Campus Life the Way It Was Meant to Be?
            </h2>

            <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Join thousands of Skyline students already getting exclusive access to campus events, merch drops, and leadership opportunities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href={ctaLink}>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-white hover:bg-white/90 text-primary font-bold text-base shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  {ctaText}
                </Button>
              </Link>

              <Link href="/events">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto h-13 px-7 rounded-2xl border-white/30 text-white bg-white/10 hover:bg-white/20 font-semibold text-base backdrop-blur-xs hover:-translate-y-0.5 transition-all"
                >
                  Browse Events
                </Button>
              </Link>
            </div>

            {/* Friction removers */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Free to join
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Instant digital pass
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Verified student network
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card needed
              </span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

