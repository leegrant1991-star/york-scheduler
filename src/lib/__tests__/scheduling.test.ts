import { describe, it, expect } from 'vitest';
import { computeTallies, getRecommendedSlots } from '../scheduling';

function slot(id: string, startsAt: string, responses: { participantId: string; availability: 'YES' | 'MAYBE' | 'NO' }[]) {
  return {
    id,
    startsAt: new Date(startsAt),
    endsAt: new Date(startsAt),
    label: null,
    sortOrder: 0,
    responses,
  };
}

describe('computeTallies', () => {
  it('ranks slots by yes+maybe/2 score, highest first', () => {
    const slots = [
      slot('a', '2026-08-01T09:00:00Z', [
        { participantId: 'p1', availability: 'YES' },
        { participantId: 'p2', availability: 'NO' },
      ]),
      slot('b', '2026-08-01T10:00:00Z', [
        { participantId: 'p1', availability: 'YES' },
        { participantId: 'p2', availability: 'YES' },
      ]),
    ];
    const tallies = computeTallies(slots, 2);
    expect(tallies).toHaveLength(2);
    expect(tallies[0]?.timeslotId).toBe('b');
    expect(tallies[0]?.rank).toBe(1);
    expect(tallies[1]?.timeslotId).toBe('a');
    expect(tallies[1]?.rank).toBe(2);
  });

  it('handles ties by sharing a rank and skipping the next value', () => {
    const slots = [
      slot('a', '2026-08-01T09:00:00Z', [{ participantId: 'p1', availability: 'YES' }]),
      slot('b', '2026-08-01T10:00:00Z', [{ participantId: 'p1', availability: 'YES' }]),
      slot('c', '2026-08-01T11:00:00Z', [{ participantId: 'p1', availability: 'NO' }]),
    ];
    const tallies = computeTallies(slots, 1);
    const ranks = tallies.map((t) => t.rank);
    expect(ranks).toEqual([1, 1, 3]);
  });

  it('flags every top-scoring slot as recommended, and none when all-zero', () => {
    const tied = computeTallies(
      [
        slot('a', '2026-08-01T09:00:00Z', [{ participantId: 'p1', availability: 'YES' }]),
        slot('b', '2026-08-01T10:00:00Z', [{ participantId: 'p1', availability: 'YES' }]),
      ],
      1
    );
    expect(getRecommendedSlots(tied)).toHaveLength(2);

    const empty = computeTallies(
      [slot('a', '2026-08-01T09:00:00Z', [{ participantId: 'p1', availability: 'NO' }])],
      1
    );
    expect(getRecommendedSlots(empty)).toHaveLength(0);
  });

  it('computes percentage against total known participants, not respondents to that slot', () => {
    const slots = [slot('a', '2026-08-01T09:00:00Z', [{ participantId: 'p1', availability: 'YES' }])];
    const tallies = computeTallies(slots, 4);
    expect(tallies[0]?.percentage).toBe(25);
  });
});
