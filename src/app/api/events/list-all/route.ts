import { NextResponse } from 'next/server';
import { getCheckInEvents } from '@/server/data/door';
import { requireUser } from '@/server/auth/guards';

export async function GET() {
  try {
    await requireUser();
    const list = await getCheckInEvents();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

