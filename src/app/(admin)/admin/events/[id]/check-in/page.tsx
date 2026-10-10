import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventCheckInRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/events/check-in?eventId=${id}`);
}

