import type { Availability } from '@prisma/client';

export interface TimeslotWithResponses {
  id: string;
  startsAt: Date;
  endsAt: Date;
  label: string | null;
  sortOrder: number;
  responses: { participantId: string; availability: Availability }[];
}

export interface TimeslotTally {
  timeslotId: string;
  startsAt: Date;
  endsAt: Date;
  label: string | null;
  yes: number;
  maybe: number;
  no: number;
  /** Weighted score: YES counts fully, MAYBE counts as half. */
  score: number;
  /** Percentage of all known participants who said YES, 0–100. */
  percentage: number;
  rank: number; // 1 = best. Ties share the same rank.
  isRecommended: boolean;
}

/**
 * Computes attendance tallies for every timeslot, ranks them (with tie
 * handling — identical scores share a rank and no slot is skipped over),
 * and flags the top slot(s) as recommended.
 *
 * totalParticipants should be the count of participants who have submitted
 * at least one response, so percentages reflect actual respondents rather
 * than everyone who was merely invited.
 */
export function computeTallies(
  timeslots: TimeslotWithResponses[],
  totalParticipants: number
): TimeslotTally[] {
  const base = timeslots
    .map((slot) => {
      let yes = 0;
      let maybe = 0;
      let no = 0;
      for (const r of slot.responses) {
        if (r.availability === 'YES') yes += 1;
        else if (r.availability === 'MAYBE') maybe += 1;
        else no += 1;
      }
      const score = yes + maybe * 0.5;
      const percentage = totalParticipants > 0 ? Math.round((yes / totalParticipants) * 100) : 0;
      return {
        timeslotId: slot.id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        label: slot.label,
        yes,
        maybe,
        no,
        score,
        percentage,
        rank: 0,
        isRecommended: false,
      };
    })
    // Stable secondary sort by start time so equally-scored slots display
    // chronologically rather than in arbitrary insertion order.
    .sort((a, b) => b.score - a.score || a.startsAt.getTime() - b.startsAt.getTime());

  let currentRank = 0;
  let previousScore: number | null = null;
  let seen = 0;

  for (const tally of base) {
    seen += 1;
    if (previousScore === null || tally.score !== previousScore) {
      currentRank = seen; // e.g. 1, 2, 2, 4 — ties share a rank, next rank skips
      previousScore = tally.score;
    }
    tally.rank = currentRank;
  }

  const topScore = base[0]?.score ?? 0;
  for (const tally of base) {
    tally.isRecommended = base.length > 0 && tally.score === topScore && topScore > 0;
  }

  return base;
}

/** Convenience: the highest-ranked timeslot(s), for a "Recommended" banner. */
export function getRecommendedSlots(tallies: TimeslotTally[]): TimeslotTally[] {
  return tallies.filter((t) => t.isRecommended);
}
