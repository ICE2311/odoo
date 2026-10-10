import { getCaller } from '@/server/auth/guards';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Ticket, ShoppingBag, Heart, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function AccountPage() {
  const caller = await getCaller();

  if (caller.kind !== 'user') {
    return null;
  }

  const sections = [
    {
      title: 'Membership',
      description: caller.isMember ? 'You have an active membership' : 'Become a Skyline member',
      icon: Heart,
      href: '/account/membership',
      status: caller.isMember ? 'active' : 'inactive',
    },
    {
      title: 'Tickets',
      description: 'View your event tickets',
      icon: Ticket,
      href: '/account/tickets',
    },
    {
      title: 'Merch Orders',
      description: 'Track your merchandise purchases',
      icon: ShoppingBag,
      href: '/account/orders',
    },
    {
      title: 'Profile',
      description: 'Manage your account information',
      icon: FileText,
      href: '/account/profile',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${caller.user.name || caller.user.email}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group"
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  </div>
                  {section.status && (
                    <div className="pt-2 border-t border-border">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        section.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
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
    </div>
  );
}
