import Link from 'next/link';
import { Users, Calendar, Heart, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero py-24 lg:py-32 overflow-hidden border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 z-10">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              The heart of <br />
              <span className="gradient-text">student life.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Join the Skyline Student Association. Get exclusive access to events, premium merch, and volunteer opportunities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform">
                Join Skyline →
              </Link>
              <Link href="/events" className="bg-white border border-border px-8 py-3 rounded-full font-semibold text-foreground hover:bg-muted transition-colors">
                Explore Events
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:flex justify-center relative">
            <div className="w-96 h-96 bg-white rounded-full border-4 border-primary/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
               <div className="absolute top-10 left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
               <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl"></div>
               <Sparkles className="w-32 h-32 text-primary opacity-80" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto bg-primary/10 text-primary rounded-[var(--radius-md)]-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-foreground">500+</h3>
            <p className="text-muted-foreground font-medium">Active Members</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto bg-secondary/10 text-secondary rounded-[var(--radius-md)]-2xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-foreground">30+</h3>
            <p className="text-muted-foreground font-medium">Events / Year</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto bg-accent/10 text-accent rounded-[var(--radius-md)]-2xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-foreground">12</h3>
            <p className="text-muted-foreground font-medium">Fundraisers</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">One platform for your entire student experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/events" className="group bg-white p-8 rounded-[var(--radius-md)]-3xl border border-border shadow-sm card-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-[var(--radius-md)]-2xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Events</h3>
              <p className="text-muted-foreground mb-6">Get tickets to the best parties, galas, and mixers on campus.</p>
              <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">Explore <ArrowRight className="w-4 h-4 ml-1" /></div>
            </Link>

            <Link href="/shop" className="group bg-white p-8 rounded-[var(--radius-md)]-3xl border border-border shadow-sm card-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-[var(--radius-md)]-2xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Merch Shop</h3>
              <p className="text-muted-foreground mb-6">Cop the latest Skyline hoodies, tees, and exclusive gear.</p>
              <div className="flex items-center text-secondary font-semibold group-hover:gap-2 transition-all">Shop Now <ArrowRight className="w-4 h-4 ml-1" /></div>
            </Link>

            <Link href="/volunteer" className="group bg-white p-8 rounded-[var(--radius-md)]-3xl border border-border shadow-sm card-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-14 h-14 bg-accent/10 text-accent rounded-[var(--radius-md)]-2xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Volunteer</h3>
              <p className="text-muted-foreground mb-6">Give back to the community and track your volunteer hours.</p>
              <div className="flex items-center text-accent font-semibold group-hover:gap-2 transition-all">Get Involved <ArrowRight className="w-4 h-4 ml-1" /></div>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="gradient-accent py-20 text-center text-white">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <h2 className="text-4xl font-bold">Ready to jump in?</h2>
          <p className="text-white/90 text-lg">Join hundreds of students making the most of their campus life.</p>
          <Link href="/register" className="inline-block bg-white text-accent font-bold px-8 py-3 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform">
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
