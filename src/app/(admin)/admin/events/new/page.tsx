import { requireAdmin } from '@/server/auth/guards';
import { EventForm } from '../event-form';

export default async function NewEventPage() {
  await requireAdmin();

  return <EventForm />;
}

