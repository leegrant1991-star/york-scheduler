import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { TimeslotTally } from './scheduling';

/**
 * Renders a simple, print-friendly PDF summary of poll results: title,
 * ranked timeslots with attendance, and a per-participant matrix. Kept
 * deliberately plain (no external fonts/images) so it has zero runtime
 * dependencies beyond pdf-lib and renders identically everywhere.
 */
export async function buildResultsPdf(
  pollTitle: string,
  tallies: TimeslotTally[],
  participants: { name: string; answers: Map<string, 'YES' | 'MAYBE' | 'NO'> }[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([612, 792]); // US Letter
  let y = 750;
  const marginX = 48;
  const ink = rgb(0.02, 0.05, 0.14); // york-navy, for print on white
  const muted = rgb(0.53, 0.57, 0.65); // york-muted
  const gold = rgb(0.906, 0.608, 0.176); // york-gold

  const drawText = (text: string, size: number, f = font, color = ink) => {
    page.drawText(text, { x: marginX, y, size, font: f, color });
    y -= size + 8;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < 48) {
      page = doc.addPage([612, 792]);
      y = 750;
    }
  };

  drawText('YORK CONSTRUCTION', 9, bold, gold);
  drawText(pollTitle, 20, bold);
  drawText(`Generated ${new Date().toLocaleString()}`, 10, font, muted);
  y -= 8;

  drawText('Ranked timeslots', 14, bold);
  for (const t of tallies) {
    ensureSpace(20);
    const line = `#${t.rank}  ${new Date(t.startsAt).toLocaleString()}  —  ${t.yes} yes / ${t.maybe} maybe / ${t.no} no  (${t.percentage}%)`;
    page.drawText(line, { x: marginX, y, size: 11, font, color: t.isRecommended ? gold : ink });
    y -= 18;
  }

  y -= 12;
  ensureSpace(24);
  drawText('Participant responses', 14, bold);
  for (const p of participants) {
    ensureSpace(16);
    const summary = tallies
      .map((t) => `${formatShort(t.startsAt)}:${p.answers.get(t.timeslotId) ?? '-'}`)
      .join('   ');
    page.drawText(`${p.name}`, { x: marginX, y, size: 11, font: bold, color: ink });
    y -= 14;
    ensureSpace(14);
    page.drawText(summary, { x: marginX + 12, y, size: 9, font, color: muted });
    y -= 16;
  }

  return doc.save();
}

function formatShort(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
