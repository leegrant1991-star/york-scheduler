'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './ui/Button';
import { Field, inputClass, checkboxClass } from './ui/Field';
import Card from './ui/Card';

interface TimeslotRow {
  id: string;
  startsAt: string;
  endsAt: string;
  label: string;
}
interface ParticipantRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}
function defaultTimeslot(): TimeslotRow {
  return { id: newId(), startsAt: '', endsAt: '', label: '' };
}
function defaultParticipant(): ParticipantRow {
  return { id: newId(), name: '', email: '', role: '' };
}

const STEPS = ['Meeting details', 'Participants', 'Timeslots', 'Review & publish'];

export default function PollWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cadence, setCadence] = useState('ONE_OFF');
  const [timezone] = useState(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'
  );
  const [requireEmail, setRequireEmail] = useState(false);
  const [sendInvites, setSendInvites] = useState(false);
  const [timeslots, setTimeslots] = useState<TimeslotRow[]>([defaultTimeslot(), defaultTimeslot()]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([defaultParticipant()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  function updateTimeslot(id: string, patch: Partial<TimeslotRow>) {
    setTimeslots((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function updateParticipant(id: string, patch: Partial<ParticipantRow>) {
    setParticipants((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/participants/import', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) {
      setImportMessage(data.error ?? 'Import failed.');
      return;
    }
    setParticipants((prev) => [
      ...prev.filter((p) => p.name.trim() !== ''),
      ...data.participants.map((p: any) => ({
        id: newId(),
        name: p.name,
        email: p.email ?? '',
        role: p.role ?? '',
      })),
    ]);
    setImportMessage(`Imported ${data.participants.length} participants.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validateStep(current: number): string | null {
    if (current === 0 && !title.trim()) return 'Give this meeting a title.';
    if (current === 2 && timeslots.filter((t) => t.startsAt && t.endsAt).length === 0) {
      return 'Add at least one candidate timeslot.';
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handlePublish() {
    const cleanSlots = timeslots.filter((t) => t.startsAt && t.endsAt);
    if (cleanSlots.length === 0) {
      setError('Add at least one candidate timeslot.');
      setStep(2);
      return;
    }
    const cleanParticipants = participants.filter((p) => p.name.trim() !== '');

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          cadence,
          timezone,
          requireEmail,
          sendInvites,
          timeslots: cleanSlots.map((t) => ({
            startsAt: new Date(t.startsAt).toISOString(),
            endsAt: new Date(t.endsAt).toISOString(),
            label: t.label || undefined,
          })),
          participants: cleanParticipants.map((p) => ({
            name: p.name,
            email: p.email || undefined,
            role: p.role || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not create the poll.');
        return;
      }
      router.push(`/dashboard/polls/${data.poll.slug}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                i === step
                  ? 'bg-york-gold text-york-navy'
                  : i < step
                  ? 'bg-york-gold-muted text-york-gold'
                  : 'bg-white/10 text-york-muted'
              }`}
              aria-current={i === step ? 'step' : undefined}
            >
              {i + 1}
            </button>
            <span className={`hidden text-xs font-medium sm:block ${i === step ? 'text-white' : 'text-york-muted'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-york-border" />}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <Card className="space-y-4">
                <Field label="Poll title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Weekly OAC meeting — Riverside Tower"
                    className={inputClass}
                  />
                </Field>
                <Field label="Meeting description">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Coordinate schedule, RFIs, and submittals with the design team."
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Cadence">
                    <select value={cadence} onChange={(e) => setCadence(e.target.value)} className={inputClass}>
                      <option value="ONE_OFF">One-off</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="BIWEEKLY">Bi-weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </Field>
                  <Field label="Timezone">
                    <input value={timezone} disabled className={`${inputClass} opacity-60`} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-york-gray">
                  <input
                    type="checkbox"
                    checked={requireEmail}
                    onChange={(e) => setRequireEmail(e.target.checked)}
                    className={checkboxClass}
                  />
                  Require an email address from participants when they respond
                </label>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-white">Participants</h2>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer text-sm font-semibold text-york-gold">
                      Import CSV
                      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setParticipants((rows) => [...rows, defaultParticipant()])}
                      className="text-sm font-semibold text-york-gold"
                    >
                      + Add participant
                    </button>
                  </div>
                </div>
                {importMessage && <p className="mt-2 text-sm text-york-muted">{importMessage}</p>}
                <p className="mt-2 text-xs text-york-muted">
                  CSV columns: <code className="font-mono text-york-gold">name, email, role</code>.
                </p>
                <div className="mt-4 space-y-3">
                  {participants.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-end gap-2">
                      <Field label="Name" className="min-w-[160px] flex-1">
                        <input value={p.name} onChange={(e) => updateParticipant(p.id, { name: e.target.value })} placeholder="Jordan Reyes" className={inputClass} />
                      </Field>
                      <Field label="Email (optional)" className="min-w-[200px] flex-1">
                        <input type="email" value={p.email} onChange={(e) => updateParticipant(p.id, { email: e.target.value })} placeholder="jordan@consultingfirm.com" className={inputClass} />
                      </Field>
                      <Field label="Role (optional)" className="min-w-[140px] flex-1">
                        <input value={p.role} onChange={(e) => updateParticipant(p.id, { role: e.target.value })} placeholder="Structural engineer" className={inputClass} />
                      </Field>
                      <Button variant="tertiary" className="mb-0.5" onClick={() => setParticipants((rows) => rows.filter((r) => r.id !== p.id))}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-white">Candidate timeslots</h2>
                  <button
                    type="button"
                    onClick={() => setTimeslots((rows) => [...rows, defaultTimeslot()])}
                    className="text-sm font-semibold text-york-gold"
                  >
                    + Add timeslot
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {timeslots.map((slot) => (
                    <div key={slot.id} className="flex flex-wrap items-end gap-2">
                      <Field label="Starts" className="min-w-[180px] flex-1">
                        <input type="datetime-local" value={slot.startsAt} onChange={(e) => updateTimeslot(slot.id, { startsAt: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Ends" className="min-w-[180px] flex-1">
                        <input type="datetime-local" value={slot.endsAt} onChange={(e) => updateTimeslot(slot.id, { endsAt: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Label (optional)" className="min-w-[160px] flex-1">
                        <input value={slot.label} onChange={(e) => updateTimeslot(slot.id, { label: e.target.value })} placeholder="Site walk" className={inputClass} />
                      </Field>
                      <Button variant="tertiary" className="mb-0.5" onClick={() => setTimeslots((rows) => rows.filter((r) => r.id !== slot.id))}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card className="space-y-5">
                <h2 className="font-display text-base font-bold text-white">Review</h2>
                <ReviewRow label="Title" value={title || '—'} />
                <ReviewRow label="Cadence" value={cadence.replace('_', ' ')} />
                <ReviewRow label="Timeslots" value={String(timeslots.filter((t) => t.startsAt && t.endsAt).length)} />
                <ReviewRow label="Participants" value={String(participants.filter((p) => p.name.trim()).length)} />
                <label className="flex items-center gap-2 text-sm text-york-gray">
                  <input type="checkbox" checked={sendInvites} onChange={(e) => setSendInvites(e.target.checked)} className={checkboxClass} />
                  Email the poll link now to everyone with an address
                </label>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-york-danger">{error}</p>}

      <div className="mt-6 flex justify-between">
        <Button variant="tertiary" onClick={goBack} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={goNext}>
            Continue
          </Button>
        ) : (
          <Button variant="primary" loading={submitting} onClick={handlePublish}>
            Publish poll
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-york-border pb-2 last:border-0">
      <span className="text-sm text-york-muted">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
