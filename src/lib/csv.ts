import { parse } from 'csv-parse/sync';
import type { TimeslotTally } from './scheduling';

/** Builds a CSV string of the availability matrix plus computed tallies. */
export function buildResultsCsv(
  pollTitle: string,
  timeslots: TimeslotTally[],
  participants: { name: string; answers: Map<string, 'YES' | 'MAYBE' | 'NO'> }[]
): string {
  const rows: string[] = [];
  const header = ['Participant', ...timeslots.map((t) => formatSlotHeader(t))];
  rows.push(header.map(csvEscape).join(','));

  for (const p of participants) {
    const row = [p.name, ...timeslots.map((t) => p.answers.get(t.timeslotId) ?? '')];
    rows.push(row.map(csvEscape).join(','));
  }

  rows.push('');
  rows.push(['', ...timeslots.map((t) => `${t.yes} yes`)].map(csvEscape).join(','));
  rows.push(['', ...timeslots.map((t) => `${t.percentage}%`)].map(csvEscape).join(','));
  rows.push(['', ...timeslots.map((t) => `Rank ${t.rank}`)].map(csvEscape).join(','));

  return rows.join('\n');
}

function formatSlotHeader(t: TimeslotTally): string {
  return `${t.label ?? ''} ${new Date(t.startsAt).toLocaleString()}`.trim();
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export interface ImportedParticipant {
  name: string;
  email?: string;
  role?: string;
}

/**
 * Parses a CSV of participants with flexible headers. Accepts any of:
 * name / full name, email / e-mail, role / title / company.
 */
export function parseParticipantsCsv(csvText: string): ImportedParticipant[] {
  const records: Record<string, string>[] = parse(csvText, {
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  });

  const results: ImportedParticipant[] = [];
  for (const row of records) {
    const name = row['name'] ?? row['full name'] ?? row['participant'];
    if (!name) continue;
    const email = row['email'] ?? row['e-mail'] ?? undefined;
    const role = row['role'] ?? row['title'] ?? row['company'] ?? undefined;
    results.push({ name, email: email || undefined, role: role || undefined });
  }
  return results;
}
