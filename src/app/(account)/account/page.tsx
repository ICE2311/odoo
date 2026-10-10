import { Card } from '@/components/ui/card';
import { getCaller } from '@/server/auth/guards';
import { PageHeader } from '@/components/page-header';
import { Ticket, ShoppingBag, Heart, User, Receipt } from 'lucide-react';
import Link from 'next/link';

export default async function AccountPage() {
  const caller = await getCaller();

  if (caller.kind !== 'user') {
    return null;
  }

  const isMemberOrAdmin = caller.isMember || caller.isAdmin;

  const sections = [
    {
      title: 'Membership',
      description: caller.isMember ? 'Your membership is active' : 'Become a member',
      icon: Heart,
      href: '/account/membership',
      status: caller.isMember ? 'active' : 'inactive',
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Tickets',
      description: 'View your event tickets',
      icon: Ticket,
      href: '/account/tickets',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Merch Orders',
      description: 'Track your purchases',
      icon: ShoppingBag,
      href: '/account/orders',
      color: 'bg-accent/10 text-accent',
    },
    ...(isMemberOrAdmin
      ? [
          {
            title: 'Expenses & Ledger',
            description: 'File claims & track ledger',
            icon: Receipt,
            href: '/account/expenses',
            color: 'bg-amber-500/10 text-amber-600',
          },
        ]
      : []),
    {
      title: 'Profile',
      description: 'Manage your account',
      icon: User,
      href: '/account/profile',
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="space-y-12">
      <PageHeader
        title={`Welcome back, ${caller.user.name || 'Student'}`}
        subtitle="Manage your Skyline experience"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group outline-none">
              <Card className="p-6 h-full border-border bg-card hover:border-primary/30 card-hover cursor-pointer transition-all">
                <div className="flex flex-col gap-4 h-full">
                  <div className={`w-14 h-14 rounded-[var(--radius-lg)] ${section.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">{section.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                  </div>
                  {section.status && (
                    <div className="pt-3 border-t border-border mt-auto">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                        section.status === 'active'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/15 text-warning-foreground'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${section.status === 'active' ? 'bg-success' : 'bg-warning'}`}></span>
                        {section.status === 'active' ? 'Active' : 'Not active'}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Treasury Section */}
      <div className="grid md:grid-cols-2 gap-8 border-t border-border pt-12">
        {/* Ledger & Expense Claim Box for Members */}
        {isMemberOrAdmin ? (
          <div className="md:col-span-2 p-8 sm:p-10 rounded-[var(--radius-xl)] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 relative overflow-hidden group">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 mb-3">
                <Receipt className="w-3.5 h-3.5" /> Treasury Ledger & Claims
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mb-2">Volunteer Expenses & Ledger Deposits</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Incurred out-of-pocket expenses while volunteering, or collected cash takings and donations during campus activities? Submit reimbursement claims or deposit collected funds directly into the club ledger.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/account/expenses/new?type=expense"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <Receipt className="w-4 h-4" /> File Expense Claim
                </Link>
                <Link
                  href="/account/expenses/new?type=income"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  Deposit Collected Funds
                </Link>
                <Link
                  href="/account/expenses"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition-colors"
                >
                  View Ledger & Claims
                </Link>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500 pointer-events-none">
              <Receipt className="w-48 h-48 text-amber-600" />
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 p-8 sm:p-10 rounded-[var(--radius-xl)] bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 relative overflow-hidden group">
            <div className="relative z-10 max-w-xl">
              <h3 className="text-2xl font-bold tracking-tight text-primary mb-2">Want to volunteer or file expenses?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Active club members can organize campus initiatives, volunteer for fundraisers, and file reimbursement claims to the club ledger.
              </p>
              <Link
                href="/account/membership"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
              >
                Join Skyline Membership
              </Link>
            </div>
          </div>
        )}

        <div className="p-10 rounded-[var(--radius-xl)] bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tight text-primary mb-2">Upcoming Events</h3>
            <p className="text-muted-foreground mb-8">Check out what&apos;s happening on campus</p>
            <Link
              href="/events"
              className="inline-block px-6 py-3 rounded-[var(--radius-md)] gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              Browse Events
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <Ticket className="w-48 h-48 text-primary" />
          </div>
        </div>

        <div className="p-10 rounded-[var(--radius-xl)] bg-gradient-to-br from-accent/5 to-transparent border border-accent/10 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tight text-accent mb-2">Shop Merch</h3>
            <p className="text-muted-foreground mb-8">Get exclusive Skyline gear</p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 rounded-[var(--radius-md)] gradient-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              Browse Shop
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <ShoppingBag className="w-48 h-48 text-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}
