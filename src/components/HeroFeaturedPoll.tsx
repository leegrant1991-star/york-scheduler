import Link from 'next/link';
import Card from './ui/Card';
import { buttonClasses } from './ui/buttonClasses';
import StatusBadge from './StatusBadge';

interface HeroPollProps {
  slug: string;
  title: string;
  description: string | null;
  status: string;
  inviteCount: number;
  responseCount: number;
  recommended: { startsAt: string; percentage: number } | null;
}

export default function HeroFeaturedPoll({ poll }: { poll: HeroPollProps }) {
  return (
    <Card featured className="bg-york-grid-surface overflow-hidden">
      <div className="pl-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-york-gold px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-york-navy">
            Featured
          </span>
          <StatusBadge status={poll.status} />
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          {poll.title}
        </h1>
        {poll.description && (
          <p className="mt-3 max-w-2xl text-base text-york-gray sm:text-lg">{poll.description}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-8">
          <Stat label="Invitees" value={String(poll.inviteCount || poll.responseCount)} />
          <Stat label="Responses received" value={String(poll.responseCount)} />
          <Stat
            label="Recommended time"
            value={
              poll.recommended
                ? new Date(poll.recommended.startsAt).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—'
            }
            highlight
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/poll/${poll.slug}`} className={buttonClasses('primary')} target="_blank">
            Open poll
          </Link>
          <Link href={`/dashboard/polls/${poll.slug}`} className={buttonClasses('secondary')}>
            View results
          </Link>
          <Link href={`/dashboard/polls/${poll.slug}`} className={buttonClasses('tertiary')}>
            Edit poll
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-york-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${highlight ? 'text-york-gold' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
