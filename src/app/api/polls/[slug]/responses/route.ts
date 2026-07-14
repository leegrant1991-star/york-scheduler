import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { submitResponseSchema } from '@/lib/validation';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rate-limit';
import { verifyCaptcha } from '@/lib/captcha';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const rl = checkRateLimit(clientKeyFromRequest(req, 'submit-response'), {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions from this connection. Please wait a few minutes.' },
      { status: 429 }
    );
  }

  const poll = await prisma.poll.findUnique({
    where: { slug: params.slug },
    include: { timeslots: true, participants: true },
  });
  if (!poll) return NextResponse.json({ error: 'This poll link is no longer valid.' }, { status: 404 });
  if (poll.status === 'ARCHIVED' || poll.status === 'COMPLETED') {
    return NextResponse.json({ error: 'This poll is no longer accepting responses.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (poll.captchaEnabled) {
    const ok = await verifyCaptcha(input.captchaToken);
    if (!ok) {
      return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
    }
  }

  if (poll.requireEmail && !input.email) {
    return NextResponse.json({ error: 'An email address is required for this poll.' }, { status: 400 });
  }

  const validTimeslotIds = new Set(poll.timeslots.map((t) => t.id));
  for (const answer of input.answers) {
    if (!validTimeslotIds.has(answer.timeslotId)) {
      return NextResponse.json({ error: 'One of the submitted timeslots is invalid.' }, { status: 400 });
    }
  }

  // Resolve which participant this submission belongs to: prefer the
  // edit token (returning visitor), otherwise match by name, otherwise
  // create a new participant.
  let participant = input.editToken
    ? await prisma.participant.findFirst({
        where: { editToken: input.editToken, pollId: poll.id },
      })
    : null;

  if (!participant) {
    const existingByName = await prisma.participant.findUnique({
      where: { pollId_name: { pollId: poll.id, name: input.name } },
    });
    if (existingByName) {
      if (!poll.allowEditAfterSubmit) {
        return NextResponse.json(
          { error: 'Someone already submitted a response under that name. Use the link you were sent to update it, or enter a different name.' },
          { status: 409 }
        );
      }
      participant = existingByName;
    }
  }

  const isNewParticipant = !participant;

  participant = participant
    ? await prisma.participant.update({
        where: { id: participant.id },
        data: { email: input.email || participant.email, role: input.role },
      })
    : await prisma.participant.create({
        data: {
          pollId: poll.id,
          name: input.name,
          email: input.email || undefined,
          role: input.role,
        },
      });

  await prisma.$transaction(
    input.answers.map((a) =>
      prisma.response.upsert({
        where: { participantId_timeslotId: { participantId: participant!.id, timeslotId: a.timeslotId } },
        create: { participantId: participant!.id, timeslotId: a.timeslotId, availability: a.availability },
        update: { availability: a.availability },
      })
    )
  );

  if (isNewParticipant) {
    await prisma.invitation.updateMany({
      where: { pollId: poll.id, email: input.email || '__none__' },
      data: { status: 'RESPONDED' },
    });
  }

  if (poll.notifyOnResponse) {
    void notifyAdminOfResponse(poll.id, participant.name).catch((err) =>
      console.error('[notify] failed', err)
    );
  }

  return NextResponse.json({
    ok: true,
    editToken: participant.editToken,
  });
}

async function notifyAdminOfResponse(pollId: string, participantName: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { admin: true, participants: true, invitations: true },
  });
  if (!poll) return;

  const respondedCount = poll.participants.length;
  const expectedCount = poll.invitations.length;
  const allResponded = expectedCount > 0 && respondedCount >= expectedCount;

  if (allResponded && poll.notifyOnComplete) {
    await sendEmail({
      to: poll.admin.email,
      subject: `All invitees have responded — ${poll.title}`,
      html: `<p>Everyone invited to <strong>${escapeHtml(poll.title)}</strong> has submitted their availability. Head to the dashboard to see the recommended time.</p>`,
    });
    return;
  }

  await sendEmail({
    to: poll.admin.email,
    subject: `New response — ${poll.title}`,
    html: `<p><strong>${escapeHtml(participantName)}</strong> just submitted availability for <strong>${escapeHtml(poll.title)}</strong>.</p>`,
  });
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
