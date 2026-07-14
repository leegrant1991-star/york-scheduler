import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PollGrid from '@/components/PollGrid';

export const dynamic = 'force-dynamic';

const CADENCE_LABEL: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
};

export default async function TemplatesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');

  const recurringPolls = await prisma.poll.findMany({
    where: { adminId: admin.adminId, cadence: { in: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] } },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { participants: true, timeslots: true, invitations: true } } },
  });

  const grouped = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'].map((cadence) => ({
    cadence,
    polls: recurringPolls.filter((p) => p.cadence === cadence),
  }));

  return (
    <div className="space-y-10 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Recurrence templates</h1>
        <p className="mt-1 text-sm text-york-muted">
          Any recurring poll can be used as a template — duplicate it to set up the next occurrence,
          with timeslots shifted forward automatically by its cadence.
        </p>
      </div>

      {grouped.every((g) => g.polls.length === 0) ? (
        <div className="rounded-xl border border-dashed border-york-border-strong p-12 text-center text-york-muted">
          No recurring polls yet. Set a cadence other than &quot;One-off&quot; when creating a poll to see it here.
        </div>
      ) : (
        grouped
          .filter((g) => g.polls.length > 0)
          .map((g) => (
            <div key={g.cadence}>
              <h2 className="font-display text-lg font-bold text-white">{CADENCE_LABEL[g.cadence]}</h2>
              <div className="mt-4">
                <PollGrid
                  polls={g.polls.map((p) => ({
                    slug: p.slug,
                    title: p.title,
                    status: p.status,
                    cadence: p.cadence,
                    participantCount: p._count.participants,
                    timeslotCount: p._count.timeslots,
                    inviteCount: p._count.invitations,
                    updatedAt: p.updatedAt.toISOString(),
                  }))}
                />
              </div>
            </div>
          ))
      )}
    </div>
  );
}
