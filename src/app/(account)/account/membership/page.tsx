'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MembershipPage() {
  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Skyline Membership</CardTitle>
          <CardDescription>Join the club for exclusive benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Member Benefits:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Discounted event tickets</li>
                <li>Exclusive access to club merch</li>
                <li>Members-only announcements</li>
                <li>Volunteering opportunities</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Become a Member</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

