import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Card from '@/components/ui/Card';
import TeamManagement from '@/components/TeamManagement';

export const dynamic = 'force-dynamic';

export default async function AdministrationPage() {
  const session = await getCurrentAdmin();
  if (!session) redirect('/login');

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  const pollCount = await prisma.poll.count({ where: { adminId: session.adminId } });
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

  return (
    <div className="max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Administration</h1>
        <p className="mt-1 text-sm text-york-muted">Account and platform settings.</p>
      </div>

      <Card>
        <h2 className="font-display text-base font-bold text-white">Your account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Name" value={admin?.name ?? '—'} />
          <Row label="Email" value={admin?.email ?? session.email} />
          <Row label="Polls created" value={String(pollCount)} />
          <Row label="Account created" value={admin ? new Date(admin.createdAt).toLocaleDateString() : '—'} />
        </dl>
      </Card>

      <Card>
        <TeamManagement initialAdmins={admins.map((admin) => ({ ...admin, createdAt: admin.createdAt.toISOString() }))} currentAdminId={session.adminId} />
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-york-border pb-2 last:border-0 last:pb-0">
      <dt className="text-york-muted">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}
