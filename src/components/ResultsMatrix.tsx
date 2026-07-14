interface Tally {
  timeslotId: string;
  startsAt: string;
  endsAt: string;
  label: string | null;
  yes: number;
  maybe: number;
  no: number;
  percentage: number;
  rank: number;
  isRecommended: boolean;
}

interface ParticipantRow {
  id: string;
  name: string;
  email: string | null;
  answers: Record<string, string>;
}

/**
 * The scheduling matrix — the visual centerpiece of the platform.
 * See YORK_DESIGN_SYSTEM.md §9 and the "Availability matrix" brief:
 * available = gold fill, unavailable = transparent, most-popular column
 * gets a gold glow, and the recommended column gets the animated
 * pulsing gold border (`.york-recommended` in globals.css).
 */
export default function ResultsMatrix({
  tallies,
  participants,
}: {
  tallies: Tally[];
  participants: ParticipantRow[];
}) {
  if (tallies.length === 0) {
    return <p className="text-sm text-york-muted">This poll has no timeslots yet.</p>;
  }

  const mostPopularId = tallies.reduce<string | null>((best, t) => {
    if (!best) return t.timeslotId;
    const bestTally = tallies.find((x) => x.timeslotId === best)!;
    return t.yes > bestTally.yes ? t.timeslotId : best;
  }, null);

  return (
    <div className="matrix-scroll rounded-lg border border-york-border bg-york-card">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky-col z-10 bg-york-light px-4 py-3 text-left font-semibold text-white">
              Participant
            </th>
            {tallies.map((t) => (
              <th
                key={t.timeslotId}
                className={`border-l border-york-border bg-york-light px-3 py-3 text-left align-top font-semibold ${
                  t.timeslotId === mostPopularId ? 'york-glow relative' : ''
                } ${t.isRecommended ? 'york-recommended relative border-2' : ''}`}
              >
                <div className="whitespace-nowrap text-white">
                  {new Date(t.startsAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="whitespace-nowrap text-xs font-normal text-york-muted">
                  {new Date(t.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </div>
                {t.label && <div className="text-xs font-normal text-york-muted">{t.label}</div>}
                {t.isRecommended && (
                  <span className="mt-1 inline-block rounded border border-york-gold px-1.5 py-0.5 text-[10px] font-bold uppercase text-york-gold">
                    Recommended
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-york-border">
          {participants.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-york-card-hover">
              <td className="sticky-col z-0 bg-york-card px-4 py-2.5 font-medium text-white">{p.name}</td>
              {tallies.map((t) => {
                const answer = p.answers[t.timeslotId] ?? 'NO';
                return (
                  <td key={t.timeslotId} className="border-l border-york-border px-3 py-2.5 text-center">
                    <Cell answer={answer} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-york-border bg-york-light font-semibold">
            <td className="sticky-col bg-york-light px-4 py-2.5 text-white">Available</td>
            {tallies.map((t) => (
              <td key={t.timeslotId} className="border-l border-york-border px-3 py-2.5 text-center text-white">
                {t.yes}
                <span className="ml-1 text-xs font-normal text-york-muted">({t.percentage}%)</span>
              </td>
            ))}
          </tr>
          <tr className="bg-york-light">
            <td className="sticky-col bg-york-light px-4 py-2.5 text-york-muted">Rank</td>
            {tallies.map((t) => (
              <td key={t.timeslotId} className="border-l border-york-border px-3 py-2.5 text-center text-york-muted">
                #{t.rank}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Cell({ answer }: { answer: string }) {
  if (answer === 'YES') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-york-gold text-sm font-bold text-york-navy">
        ✓
      </span>
    );
  }
  if (answer === 'MAYBE') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-york-gold/50 bg-york-gold-muted text-sm font-bold text-york-gold">
        ~
      </span>
    );
  }
  return <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-transparent text-york-muted">·</span>;
}
