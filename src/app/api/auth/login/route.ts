import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, setSessionCookie, normalizeEmail } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(clientKeyFromRequest(req, 'login'), {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password format.' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = normalizeEmail(email);
  const admin = await prisma.admin.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  // Constant-shape response regardless of which check fails, to avoid
  // leaking which emails exist.
 if (!admin || !admin.passwordHash || !(await verifyPassword(password, admin.passwordHash))) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  await setSessionCookie({ adminId: admin.id, email: admin.email });
  return NextResponse.json({ ok: true });
}
