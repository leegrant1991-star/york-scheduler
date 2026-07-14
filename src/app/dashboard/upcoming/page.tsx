import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeTallies, getRecommendedSlots } from '@/lib/scheduling';
import Card from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/buttonClasses';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UpcomingMeetingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');

  const polls = await prisma.poll.findMany({
    where: {
      adminId: admin.adminId,
      status: 'ACTIVE',
      timeslots: { some: { startsAt: { gte: new Date() } } },
    },
    include: {
      timeslots: { include: { responses: true }, orderBy: { startsAt: 'asc' } },
      participants: true,
    },
  });

  const meetings = polls
    .map((poll) => {
      const tallies = computeTallies(poll.timeslots, poll.participants.length);
      const recommended = getRecommendedSlots(tallies)[0];
      const nextSlot = poll.timeslots.find((t) => t.startsAt >= new Date());
      return { poll, recommended, nextSlot };
    })
    .filter((m) => m.nextSlot)
    .sort((a, b) => a.nextSlot!.startsAt.getTime() - b.nextSlot!.startsAt.getTime());

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Upcoming meetings</h1>
        <p className="mt-1 text-sm text-york-muted">
          Active polls with a candidate timeslot still ahead of us, soonest first.
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-york-border-strong p-12 text-center text-york-muted">
          Nothing on the horizon — every active poll&apos;s candidate times have passed.
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(({ poll, recommended, nextSlot }) => (
            <Card key={poll.id} interactive className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link href={`/dashboard/polls/${poll.slug}`} className="font-display text-lg font-bold text-white hover:text-york-gold">
                  {poll.title}
                </Link>
                <p className="mt-1 text-sm text-york-muted">
                  Next candidate time: {nextSlot && new Date(nextSlot.startsAt).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
                {recommended && (
                  <p className="mt-1 text-sm text-york-gold">
                    Recommended: {new Date(recommended.startsAt).toLocaleString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    ({recommended.percentage}% available)
                  </p>
                )}
              </div>
              <Link href={`/dashboard/polls/${poll.slug}`} className={buttonClasses('secondary')}>
                View poll
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
