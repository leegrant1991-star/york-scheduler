import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

/**
 * Revokes a teammate's access. This does NOT hard-delete the Admin row —
 * Poll.admin is an onDelete: Cascade relation, so deleting the row would
 * also delete every poll they created. Instead we clear their password and
 * mark them REVOKED, which blocks login (see /api/auth/login) while
 * leaving their polls untouched.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (params.id === session.adminId) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  }

  const target = await prisma.admin.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const totalActive = await prisma.admin.count({ where: { status: 'ACTIVE' } });
  if (target.status === 'ACTIVE' && totalActive <= 1) {
    return NextResponse.json({ error: 'At least one active admin must remain.' }, { status: 400 });
  }

  await prisma.admin.update({
    where: { id: params.id },
    data: { status: 'REVOKED', passwordHash: null, inviteToken: null, inviteTokenExpiresAt: null },
  });
  return NextResponse.json({ ok: true });
}
