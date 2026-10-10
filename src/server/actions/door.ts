'use server';

import { checkInTicket, getDoorStats, getRecentCheckIns } from '@/server/data/door';
import { revalidatePath } from 'next/cache';

export async function checkInTicketAction(
  eventId: string,
  rawInput: string,
  options?: { autoSwitch?: boolean }
) {
  const result = await checkInTicket(eventId, rawInput, options);
  revalidatePath('/admin/events/check-in');
  return result;
}

export async function getDoorStatsAction(eventId: string) {
  return await getDoorStats(eventId);
}

export async function getRecentCheckInsAction(eventId: string) {
  return await getRecentCheckIns(eventId);
}


