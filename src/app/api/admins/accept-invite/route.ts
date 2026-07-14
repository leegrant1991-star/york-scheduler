import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { acceptInviteSchema } from '@/lib/validation';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(clientKeyFromRequest(req, 'accept-invite'), {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { token, name, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { inviteToken: token } });

  if (
    !admin ||
    admin.status !== 'PENDING' ||
    !admin.inviteTokenExpiresAt ||
    admin.inviteTokenExpiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: 'This invite link is invalid or has expired. Ask a teammate to send a new one.' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const activated = await prisma.admin.update({
    where: { id: admin.id },
    data: {
      name,
      passwordHash,
      status: 'ACTIVE',
      inviteToken: null,
      inviteTokenExpiresAt: null,
    },
  });

  await setSessionCookie({ adminId: activated.id, email: activated.email });
  return NextResponse.json({ ok: true });
}

/** Lets the accept-invite page show who's being invited before they submit. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const admin = await prisma.admin.findUnique({ where: { inviteToken: token } });
  if (
    !admin ||
    admin.status !== 'PENDING' ||
    !admin.inviteTokenExpiresAt ||
    admin.inviteTokenExpiresAt < new Date()
  ) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, email: admin.email });
}
