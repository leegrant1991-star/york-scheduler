import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeTallies } from '@/lib/scheduling';

/**
 * Returns everything the public poll page needs: poll metadata, the
 * timeslot list with live tallies, and — if an editToken is supplied and
 * matches a participant on this poll — that participant's own prior
 * answers, so returning visitors see their selections pre-checked.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const poll = await prisma.poll.findUnique({
    where: { slug: params.slug },
    include: {
      timeslots: {
        orderBy: { sortOrder: 'asc' },
        include: { responses: { select: { participantId: true, availability: true } } },
      },
      participants: { select: { id: true, name: true } },
    },
  });

  if (!poll) return NextResponse.json({ error: 'This poll link is no longer valid.' }, { status: 404 });

  const totalParticipants = poll.participants.length;
  const tallies = computeTallies(poll.timeslots, totalParticipants);

  let existingParticipant: { id: string; name: string; answers: Record<string, string> } | null =
    null;

  const editToken = req.nextUrl.searchParams.get('token');
  if (editToken) {
    const participant = await prisma.participant.findUnique({
      where: { editToken },
      include: { responses: true },
    });
    if (participant && participant.pollId === poll.id) {
      existingParticipant = {
        id: participant.id,
        name: participant.name,
        answers: Object.fromEntries(
          participant.responses.map((r) => [r.timeslotId, r.availability])
        ),
      };
    }
  }

  return NextResponse.json({
    poll: {
      title: poll.title,
      description: poll.description,
      status: poll.status,
      timezone: poll.timezone,
      logoUrl: poll.logoUrl,
      requireEmail: poll.requireEmail,
      allowEditAfterSubmit: poll.allowEditAfterSubmit,
      captchaEnabled: poll.captchaEnabled,
    },
    timeslots: poll.timeslots.map((t) => ({ id: t.id, startsAt: t.startsAt, endsAt: t.endsAt, label: t.label })),
    tallies,
    participantCount: totalParticipants,
    existingParticipant,
  });
}
