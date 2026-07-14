import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { inviteAdminSchema } from '@/lib/validation';
import { sendEmail, adminInviteEmail } from '@/lib/mailer';

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      createdAt: true,
      inviteTokenExpiresAt: true,
      invitedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ admins, currentAdminId: session.adminId });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = inviteAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing && existing.status !== 'REVOKED') {
    return NextResponse.json(
      { error: 'Someone with that email already has an account or a pending invite.' },
      { status: 409 }
    );
  }

  const inviter = await prisma.admin.findUnique({ where: { id: session.adminId } });
  const inviteToken = randomBytes(24).toString('hex');

  const admin = existing
    ? await prisma.admin.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          status: 'PENDING',
          passwordHash: null,
          inviteToken,
          inviteTokenExpiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
          invitedById: session.adminId,
        },
      })
    : await prisma.admin.create({
        data: {
          email,
          name: parsed.data.name,
          status: 'PENDING',
          inviteToken,
          inviteTokenExpiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
          invitedById: session.adminId,
        },
      });

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const acceptUrl = `${appUrl}/accept-invite/${inviteToken}`;

  let emailSent = true;
  try {
    const { subject, html } = adminInviteEmail(inviter?.name ?? inviter?.email ?? 'A teammate', acceptUrl);
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    console.error('[admin-invite] failed to send email', err);
    emailSent = false;
  }

  return NextResponse.json(
    { admin: { id: admin.id, email: admin.email, name: admin.name }, acceptUrl, emailSent },
    { status: 201 }
  );
}
