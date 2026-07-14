import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PollGrid from '@/components/PollGrid';

export const dynamic = 'force-dynamic';

export default async function CompletedPollsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');

  const polls = await prisma.poll.findMany({
    where: { adminId: admin.adminId, status: { in: ['COMPLETED', 'ARCHIVED'] } },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { participants: true, timeslots: true, invitations: true } } },
  });

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Completed polls</h1>
        <p className="mt-1 text-sm text-york-muted">Finished or archived coordination polls.</p>
      </div>
      <PollGrid
        polls={polls.map((p) => ({
          slug: p.slug,
          title: p.title,
          status: p.status,
          cadence: p.cadence,
          participantCount: p._count.participants,
          timeslotCount: p._count.timeslots,
          inviteCount: p._count.invitations,
          updatedAt: p.updatedAt.toISOString(),
        }))}
        emptyMessage="No completed or archived polls yet."
      />
    </div>
  );
}
