import { Card } from '@/components/ui/card';
import { getCaller } from '@/server/auth/guards';
import { PageHeader } from '@/components/page-header';
import { Ticket, ShoppingBag, Heart, User, Settings } from 'lucide-react';
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
      color: 'gradient-primary',
    },
    {
      title: 'Tickets',
      description: 'View your event tickets',
      icon: Ticket,
      href: '/account/tickets',
      color: 'gradient-primary',
    },
    {
      title: 'Merch Orders',
      description: 'Track your purchases',
      icon: ShoppingBag,
      href: '/account/orders',
      color: 'gradient-primary',
    },
    {
      title: 'Profile',
      description: 'Manage your account',
      icon: User,
      href: '/account/profile',
      color: 'gradient-primary',
    },
  ];

  return (
    <div className="space-y-12">
      <PageHeader
        title={`Welcome back, ${caller.user.name || 'Student'}`}
        subtitle="Manage your Skyline experience"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="p-6 h-full border border-border bg-card/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-1 cursor-pointer">
                <div className="flex flex-col gap-4 h-full">
                  <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  </div>
                  {section.status && (
                    <div className="pt-2 border-t border-border mt-auto">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
                        section.status === 'active'
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      }`}>
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
        <div className="p-8 rounded-xl border border-border bg-card/50">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <p className="text-muted-foreground mb-4">Check out what's happening on campus</p>
          <Link
            href="/events"
            className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Browse Events
          </Link>
        </div>

        <div className="p-8 rounded-xl border border-border bg-card/50">
          <h3 className="text-lg font-semibold mb-4">Shop Merch</h3>
          <p className="text-muted-foreground mb-4">Get exclusive Skyline gear</p>
          <Link
            href="/shop"
            className="inline-block px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
