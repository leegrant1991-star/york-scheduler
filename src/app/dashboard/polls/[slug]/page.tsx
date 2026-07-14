import { redirect, notFound } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeTallies } from '@/lib/scheduling';
import PollDetailClient from '@/components/PollDetailClient';

export const dynamic = 'force-dynamic';

export default async function PollDetailPage({ params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');

  const poll = await prisma.poll.findUnique({
    where: { slug: params.slug },
    include: {
      timeslots: {
        orderBy: { sortOrder: 'asc' },
        include: { responses: { select: { participantId: true, availability: true } } },
      },
      participants: { include: { responses: true }, orderBy: { createdAt: 'asc' } },
      invitations: true,
    },
  });

  if (!poll || poll.adminId !== admin.adminId) notFound();

  const tallies = computeTallies(poll.timeslots, poll.participants.length);

  return (
    <PollDetailClient
      poll={{
        slug: poll.slug,
        title: poll.title,
        description: poll.description,
        status: poll.status,
        cadence: poll.cadence,
      }}
      timeslots={poll.timeslots.map((t) => ({ id: t.id, startsAt: t.startsAt.toISOString(), endsAt: t.endsAt.toISOString(), label: t.label }))}
      tallies={tallies.map((t) => ({ ...t, startsAt: t.startsAt.toISOString(), endsAt: t.endsAt.toISOString() }))}
      participants={poll.participants.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        answers: Object.fromEntries(p.responses.map((r) => [r.timeslotId, r.availability])),
      }))}
      invitations={poll.invitations.map((i) => ({ name: i.name, email: i.email, status: i.status }))}
    />
  );
}
