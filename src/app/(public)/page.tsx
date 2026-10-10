import { getCaller } from '@/server/auth/guards';
import { LandingPageClient } from './landing-client';

export default async function HomePage() {
  const caller = await getCaller().catch(() => ({ kind: 'visitor' as const }));

  return <LandingPageClient caller={caller} />;
}
