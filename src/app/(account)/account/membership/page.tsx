'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function MembershipPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Membership</h1>
      <Card className="border-2 border-blue-100 shadow-sm">
        <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Skyline Premium Member</CardTitle>
              <CardDescription>Join the club for exclusive benefits</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Member Benefits</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Discounted event tickets</li>
            <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Exclusive access to club merch</li>
            <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Members-only announcements</li>
            <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Volunteering opportunities</li>
          </ul>
        </CardContent>
        <CardFooter className="bg-gray-50/50 pt-4 border-t">
          <Button className="w-full sm:w-auto">Renew / Become a Member</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
