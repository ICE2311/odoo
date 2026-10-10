import Link from 'next/link';
import { ArrowRight, Calendar, ShoppingBag, HeartHandshake } from 'lucide-react';
import { getCaller } from '@/server/auth/guards';

export default async function Home() {
  const caller = await getCaller();

  return (
    <div className="flex flex-col items-center justify-center space-y-24 py-12">
      <section className="text-center space-y-6 max-w-3xl px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
          The heart of student life.
        </h1>
        <p className="text-xl text-gray-600">
          Skyline Student Association is your gateway to events, exclusive merchandise, and volunteering opportunities on campus.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {caller.kind === 'user' ? (
            <Link href="/account" className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                Join Skyline <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="bg-gray-100 text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors">
                Log In
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 max-w-5xl px-4 w-full">
        <Link href="/events" className="group border p-8 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Events</h2>
          <p className="text-gray-600">Discover and book tickets for upcoming galas, meetups, and workshops.</p>
        </Link>
        <Link href="/shop" className="group border p-8 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Merch Shop</h2>
          <p className="text-gray-600">Grab official Skyline gear. Active members get exclusive access.</p>
        </Link>
        <Link href="/volunteer" className="group border p-8 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Volunteer</h2>
          <p className="text-gray-600">Join fundraisers, help run events, and submit expense claims easily.</p>
        </Link>
      </section>
    </div>
  );
}
