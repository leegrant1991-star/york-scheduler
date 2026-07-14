import { prisma } from '@/lib/db';
import { computeTallies, type TimeslotTally } from '@/lib/scheduling';

export async function loadPollResultsForExport(slug: string, adminId: string) {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      timeslots: {
        orderBy: { sortOrder: 'asc' },
        include: { responses: { select: { participantId: true, availability: true } } },
      },
      participants: {
        include: { responses: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!poll || poll.adminId !== adminId) return null;

  const tallies: TimeslotTally[] = computeTallies(poll.timeslots, poll.participants.length);

  const participantRows = poll.participants.map((p) => ({
    name: p.name,
    answers: new Map(p.responses.map((r) => [r.timeslotId, r.availability])),
  }));

  return { poll, tallies, participantRows };
}
