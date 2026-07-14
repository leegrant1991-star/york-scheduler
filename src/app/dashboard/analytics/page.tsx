import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeTallies } from '@/lib/scheduling';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');

  const polls = await prisma.poll.findMany({
    where: { adminId: admin.adminId },
    include: {
      timeslots: { include: { responses: true } },
      participants: { include: { responses: true } },
      invitations: true,
    },
  });

  const totalPolls = polls.length;

  const uniquePeople = new Set<string>();
  let totalResponseRows = 0;
  let totalInvitations = 0;
  let totalRespondents = 0;
  const percentages: number[] = [];
  const completionTimesMs: number[] = [];
  const participantActivity = new Map<string, number>();

  for (const poll of polls) {
    totalInvitations += poll.invitations.length;
    totalRespondents += poll.participants.length;

    const tallies = computeTallies(poll.timeslots, poll.participants.length);
    for (const t of tallies) percentages.push(t.percentage);

    let lastResponseAt: Date | null = null;
    for (const p of poll.participants) {
      const key = (p.email || p.name).toLowerCase();
      uniquePeople.add(key);
      participantActivity.set(key, (participantActivity.get(key) ?? 0) + p.responses.length);
      totalResponseRows += p.responses.length;
      for (const r of p.responses) {
        if (!lastResponseAt || r.createdAt > lastResponseAt) lastResponseAt = r.createdAt;
      }
    }
    if (lastResponseAt) {
      completionTimesMs.push(lastResponseAt.getTime() - poll.createdAt.getTime());
    }
  }

  const responseRate = totalInvitations > 0 ? Math.round((totalRespondents / totalInvitations) * 100) : null;
  const attendanceRate =
    percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : null;
  const avgCompletionMs =
    completionTimesMs.length > 0
      ? completionTimesMs.reduce((a, b) => a + b, 0) / completionTimesMs.length
      : null;

  const topParticipants = [...participantActivity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-york-muted">
          Aggregate participation across every poll you&apos;ve run.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Total polls" value={String(totalPolls)} />
        <Metric label="Total participants" value={String(uniquePeople.size)} />
        <Metric label="Response rate" value={responseRate !== null ? `${responseRate}%` : '—'} />
        <Metric label="Attendance rate" value={attendanceRate !== null ? `${attendanceRate}%` : '—'} />
        <Metric label="Avg. completion time" value={formatDuration(avgCompletionMs)} />
        <Metric label="Total responses logged" value={String(totalResponseRows)} />
      </div>

      <div>
        <h2 className="font-display text-lg font-bold text-white">Most active participants</h2>
        {topParticipants.length === 0 ? (
          <p className="mt-3 text-sm text-york-muted">No responses yet.</p>
        ) : (
          <Card className="mt-4 !p-0">
            <ul className="divide-y divide-york-border">
              {topParticipants.map(([key, count], i) => (
                <li key={key} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-white">
                    <span className="mr-2 text-york-muted">#{i + 1}</span>
                    {key}
                  </span>
                  <span className="text-sm font-semibold text-york-gold">{count} responses</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-york-muted">{label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold text-york-gold">{value}</div>
    </Card>
  );
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(ms / (1000 * 60))} min`;
  if (hours < 48) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
}
