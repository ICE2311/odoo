import Link from 'next/link';
import { ArrowRight, Calendar, ShoppingBag, HeartHandshake, Sparkles, Users, Zap } from 'lucide-react';
import { getCaller } from '@/server/auth/guards';

export default async function Home() {
  const caller = await getCaller();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 gradient-subtle opacity-40" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full gradient-primary opacity-10 blur-3xl -z-10" />

        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8 text-center">
            <div className="space-y-4 fade-in">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="gradient-text">The heart of</span>
                <br />
                <span className="text-foreground">student life</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Connect with your community, discover events, shop merch, and make an impact through volunteering.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {caller.kind === 'user' ? (
                <Link
                  href="/account"
                  className="group px-8 py-4 rounded-xl gradient-primary text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group px-8 py-4 rounded-xl gradient-primary text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2"
                  >
                    Join Skyline
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-4 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32 border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Everything you need</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Events */}
            <Link
              href="/events"
              className="group p-8 rounded-xl border border-border bg-card/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Events</h3>
              <p className="text-muted-foreground">Discover and attend amazing events happening on campus</p>
            </Link>

            {/* Shop */}
            <Link
              href="/shop"
              className="group p-8 rounded-xl border border-border bg-card/50 hover:border-accent hover:shadow-lg hover:shadow-accent/20 transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/20 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Merch Shop</h3>
              <p className="text-muted-foreground">Get exclusive Skyline gear and show your pride</p>
            </Link>

            {/* Volunteer */}
            <Link
              href="/volunteer"
              className="group p-8 rounded-xl border border-border bg-card/50 hover:border-secondary hover:shadow-lg hover:shadow-secondary/20 transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Volunteer</h3>
              <p className="text-muted-foreground">Make a difference and help run amazing events</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 md:py-32 bg-card/50 border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Why join Skyline?</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Connect</h3>
                <p className="text-muted-foreground">Meet students and build lasting friendships</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Discover</h3>
                <p className="text-muted-foreground">Explore events and activities you'll love</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Get Involved</h3>
                <p className="text-muted-foreground">Make an impact through volunteering</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Exclusive Perks</h3>
                <p className="text-muted-foreground">Members get exclusive merch and deals</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 border-t border-border">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-4xl font-bold mb-6">Ready to join?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Become part of the Skyline community and start your journey today.
          </p>

          {caller.kind === 'user' ? (
            <Link
              href="/account"
              className="inline-block px-8 py-4 rounded-xl gradient-primary text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-block px-8 py-4 rounded-xl gradient-primary text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
