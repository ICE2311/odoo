import { Card } from '@/components/ui/card';
import { getCaller } from '@/server/auth/guards';
import { PageHeader } from '@/components/page-header';
import { Ticket, ShoppingBag, Heart, User } from 'lucide-react';
import Link from 'next/link';

export default async function AccountPage() {
  const caller = await getCaller();

  if (caller.kind !== 'user') {
    return null;
  }

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <h3 className="text-xl font-bold text-foreground tracking-tight">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  </div>
                  {section.status && (
                    <div className="pt-4 border-t border-border mt-auto">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
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

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-8 border-t border-border pt-12">
        <div className="p-10 rounded-[var(--radius-xl)] bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tight text-primary mb-2">Upcoming Events</h3>
            <p className="text-muted-foreground mb-8">Check out what's happening on campus</p>
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
