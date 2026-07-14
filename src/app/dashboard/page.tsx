import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeTallies, getRecommendedSlots } from '@/lib/scheduling';
import HeroFeaturedPoll from '@/components/HeroFeaturedPoll';
import PollGrid from '@/components/PollGrid';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');

  const activePolls = await prisma.poll.findMany({
    where: { adminId: admin.adminId, status: 'ACTIVE' },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { participants: true, timeslots: true, invitations: true } },
      timeslots: { include: { responses: true } },
      participants: true,
    },
  });

  const [featured, ...rest] = activePolls;

  const featuredTallies = featured ? computeTallies(featured.timeslots, featured.participants.length) : [];
  const recommended = getRecommendedSlots(featuredTallies)[0];

  return (
    <div className="space-y-10 py-8">
      {featured ? (
        <HeroFeaturedPoll
          poll={{
            slug: featured.slug,
            title: featured.title,
            description: featured.description,
            status: featured.status,
            inviteCount: featured._count.invitations,
            responseCount: featured._count.participants,
            recommended: recommended
              ? { startsAt: recommended.startsAt.toISOString(), percentage: recommended.percentage }
              : null,
          }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-york-border-strong p-12 text-center">
          <h1 className="font-display text-2xl font-bold text-white">No active polls yet</h1>
          <p className="mt-2 text-york-muted">Create your first coordination poll to get started.</p>
        </div>
      )}

      <div>
        <h2 className="font-display text-xl font-bold text-white">All active polls</h2>
        <div className="mt-4">
          <PollGrid
            polls={rest.map((p) => ({
              slug: p.slug,
              title: p.title,
              status: p.status,
              cadence: p.cadence,
              participantCount: p._count.participants,
              timeslotCount: p._count.timeslots,
              inviteCount: p._count.invitations,
              updatedAt: p.updatedAt.toISOString(),
            }))}
            emptyMessage={featured ? 'No other active polls.' : 'No active polls yet.'}
          />
        </div>
      </div>
    </div>
  );
}
