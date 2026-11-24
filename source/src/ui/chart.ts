import { toJalali, type DayKey } from '../domain/dates';
import { esc } from './html';

export interface ChartPoint {
  day: DayKey;
  /** null = nothing recorded (drawn as a gap, never as zero). */
  pct: number | null;
}

const W = 340;
const H = 210;
const PAD = { top: 14, right: 10, bottom: 26, left: 34 };
const GRID = [0, 40, 70, 100] as const;

/**
 * Line chart of daily score: one point per day, consecutive recorded days are
 * joined by a line, unrecorded days break the line. Time runs left → right,
 * like market charts. Each point has a large invisible hit target for touch.
 */
export function lineChart(points: readonly ChartPoint[], selected: DayKey | null, monthLength: number): string {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (dayOfMonth: number): number => PAD.left + ((dayOfMonth - 1) / Math.max(1, monthLength - 1)) * innerW;
  const y = (pct: number): number => PAD.top + (1 - pct / 100) * innerH;

  const grid = GRID.map(
    (g) => `<line x1="${PAD.left}" x2="${W - PAD.right}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)" stroke-width="1"
        ${g === 70 ? 'stroke-dasharray="3 3"' : ''}/>
      <text x="${PAD.left - 6}" y="${y(g) + 3}" text-anchor="end">${g}%</text>`,
  ).join('');

  const ticks = [1, 5, 10, 15, 20, 25, monthLength]
    .filter((d, i, arr) => d <= monthLength && arr.indexOf(d) === i && !(d !== monthLength && monthLength - d < 3))
    .map((d) => `<text x="${x(d)}" y="${H - 8}" text-anchor="middle">${d}</text>`)
    .join('');

  // Build line segments, breaking at unrecorded days.
  let path = '';
  let penDown = false;
  for (const p of points) {
    if (p.pct === null) {
      penDown = false;
      continue;
    }
    const jd = toJalali(p.day).jd;
    path += `${penDown ? 'L' : 'M'}${x(jd).toFixed(1)} ${y(p.pct).toFixed(1)} `;
    penDown = true;
  }

  const recorded = points.filter((p): p is ChartPoint & { pct: number } => p.pct !== null);
  const sel = recorded.find((p) => p.day === selected);
  const guide = sel
    ? `<line x1="${x(toJalali(sel.day).jd)}" x2="${x(toJalali(sel.day).jd)}" y1="${PAD.top}" y2="${H - PAD.bottom}"
         stroke="var(--copper)" stroke-width="1" opacity="0.5"/>`
    : '';

  const dots = recorded
    .map((p) => {
      const cx = x(toJalali(p.day).jd).toFixed(1);
      const cy = y(p.pct).toFixed(1);
      const isSel = p.day === selected;
      return `<circle cx="${cx}" cy="${cy}" r="${isSel ? 5 : 3}" fill="${isSel ? 'var(--cream)' : 'var(--copper)'}"
          stroke="${isSel ? 'var(--copper)' : 'none'}" stroke-width="2"/>`;
    })
    .join('');

  const hits = recorded
    .map(
      (p) => `<circle cx="${x(toJalali(p.day).jd).toFixed(1)}" cy="${y(p.pct).toFixed(1)}" r="14" fill="transparent"
          data-action="chart-point" data-day="${esc(p.day)}" style="cursor:pointer"><title>${p.pct}%</title></circle>`,
    )
    .join('');

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="نمودار درصد امتیاز روزانه">
      ${grid}${ticks}${guide}
      <path d="${path.trim()}" fill="none" stroke="var(--copper)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}${hits}
    </svg>`;
}
