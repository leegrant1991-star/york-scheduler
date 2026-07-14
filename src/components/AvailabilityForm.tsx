'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Button from './ui/Button';
import { Field, inputClass } from './ui/Field';
import Card from './ui/Card';

type Availability = 'YES' | 'MAYBE' | 'NO';

interface Timeslot {
  id: string;
  startsAt: string;
  endsAt: string;
  label: string | null;
}

interface PublicPollData {
  poll: {
    title: string;
    description: string | null;
    status: string;
    requireEmail: boolean;
    allowEditAfterSubmit: boolean;
  };
  timeslots: Timeslot[];
  tallies: any[];
  participantCount: number;
  existingParticipant: { id: string; name: string; answers: Record<string, Availability> } | null;
}

const OPTIONS: { value: Availability; label: string }[] = [
  { value: 'YES', label: 'Yes' },
  { value: 'MAYBE', label: 'Maybe' },
  { value: 'NO', label: 'No' },
];

export default function AvailabilityForm({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicPollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, Availability>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const storageKey = `sitesync:token:${slug}`;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    fetch(`/api/polls/${slug}/public${token ? `?token=${token}` : ''}`)
      .then((res) => res.json())
      .then((json: PublicPollData) => {
        setData(json);
        if (json.existingParticipant) {
          setName(json.existingParticipant.name);
          setAnswers(json.existingParticipant.answers);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function setAnswer(timeslotId: string, value: Availability) {
    setAnswers((prev) => ({ ...prev, [timeslotId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setError(null);

    if (!name.trim()) {
      setError('Enter your name so people know it was you.');
      return;
    }
    if (data.poll.requireEmail && !email.trim()) {
      setError('This poll requires an email address.');
      return;
    }

    const filled = data.timeslots.map((t) => ({
      timeslotId: t.id,
      availability: answers[t.id] ?? 'NO',
    }));

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      const res = await fetch(`/api/polls/${slug}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          editToken: token || undefined,
          answers: filled,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Could not submit your response.');
        return;
      }
      if (typeof window !== 'undefined' && json.editToken) {
        window.localStorage.setItem(storageKey, json.editToken);
      }
      setSubmitted(true);
      const refreshed = await fetch(`/api/polls/${slug}/public?token=${json.editToken}`).then((r) => r.json());
      setData(refreshed);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-york-muted">Loading poll…</p>;
  }
  if (!data) {
    return <p className="py-10 text-center text-york-muted">This poll link is no longer valid.</p>;
  }
  if (data.poll.status === 'ARCHIVED' || data.poll.status === 'COMPLETED') {
    return (
      <div className="py-10 text-center text-york-muted">
        This poll is closed. Results below are final.
        <div className="mt-6 text-left">
          <LiveResults data={data} />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {data.poll.description && <p className="text-york-gray">{data.poll.description}</p>}

      {submitted && (
        <div className="mt-4 rounded-md border border-york-success/30 bg-york-success/10 px-4 py-3 text-sm text-york-success">
          Thanks — your availability was saved. You can revisit this link anytime to update it.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Reyes" className={inputClass} />
          </Field>
          <Field label={`Email ${data.poll.requireEmail ? '' : '(optional)'}`}>
            <input
              type="email"
              required={data.poll.requireEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <h2 className="font-display text-base font-bold text-white">When are you available?</h2>
          <ul className="mt-3 divide-y divide-york-border rounded-lg border border-york-border bg-york-card">
            {data.timeslots.map((slot) => (
              <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium text-white">
                    {new Date(slot.startsAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    <span className="text-york-muted">
                      {new Date(slot.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  {slot.label && <div className="text-xs text-york-muted">{slot.label}</div>}
                </div>
                <div className="flex gap-1" role="group" aria-label={`Availability for ${slot.startsAt}`}>
                  {OPTIONS.map((opt) => {
                    const active = (answers[slot.id] ?? 'NO') === opt.value;
                    return (
                      <motion.button
                        type="button"
                        key={opt.value}
                        onClick={() => setAnswer(slot.id, opt.value)}
                        aria-pressed={active}
                        whileTap={{ scale: 0.94 }}
                        className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                          active
                            ? opt.value === 'YES'
                              ? 'bg-york-gold text-york-navy'
                              : opt.value === 'MAYBE'
                              ? 'border border-york-gold/50 bg-york-gold-muted text-york-gold'
                              : 'bg-white/10 text-white'
                            : 'bg-white/5 text-york-muted hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {error && <p role="alert" className="text-sm text-york-danger">{error}</p>}

        <Button type="submit" variant="primary" loading={submitting} className="w-full sm:w-auto">
          Submit availability
        </Button>
      </form>

      <div className="mt-10">
        <LiveResults data={data} />
      </div>
    </div>
  );
}

function LiveResults({ data }: { data: PublicPollData }) {
  if (data.tallies.length === 0) return null;
  const recommended = data.tallies.find((t: any) => t.isRecommended);
  return (
    <div>
      <h2 className="font-display text-base font-bold text-white">
        Results so far <span className="text-york-muted">· {data.participantCount} responded</span>
      </h2>
      {recommended && (
        <p className="mt-1 text-sm text-york-gray">
          Currently leading:{' '}
          <span className="font-semibold text-york-gold">
            {new Date(recommended.startsAt).toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </p>
      )}
      <div className="mt-3 grid gap-2">
        {data.tallies
          .slice()
          .sort((a: any, b: any) => a.rank - b.rank)
          .map((t: any) => (
            <Card
              key={t.timeslotId}
              className={`flex items-center justify-between !p-3 ${t.isRecommended ? 'york-recommended' : ''}`}
            >
              <span className="text-sm text-white">
                {new Date(t.startsAt).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-sm text-york-muted">
                {t.yes} yes · {t.maybe} maybe · {t.percentage}%
              </span>
            </Card>
          ))}
      </div>
    </div>
  );
}
