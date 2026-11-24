import {
  compareMonths,
  formatLong,
  formatMonth,
  formatShort,
  monthDays,
  WEEKDAY_INITIALS,
  weekdayIndex,
  type DayKey,
  type JalaliMonth,
} from '../../domain/dates';
import { dayScore, levelFor, streaks, STREAK_THRESHOLD, taskRates } from '../../domain/scoring';
import { lineChart } from '../chart';
import { esc, percent } from '../html';
import { icons } from '../icons';
import { store } from '../store';

/** Days of the viewed month up to today (future days are never shown as data). */
function visibleDays(month: JalaliMonth): DayKey[] {
  return monthDays(month).filter((d) => d <= store.today);
}

export function monthNav(month: JalaliMonth, action = 'month'): string {
  const canPrev = compareMonths(month, store.minMonth) > 0;
  const canNext = compareMonths(month, store.maxMonth) < 0;
  // RTL: "previous month" sits on the right, "next month" on the left.
  return `<div class="month-nav">
      <button class="icon-btn" data-action="${action}" data-delta="-1" aria-label="ماه قبل" ${canPrev ? '' : 'disabled style="opacity:.25"'}>${icons.chevronRight}</button>
      <div class="month-nav__title">${esc(formatMonth(month))}</div>
      <button class="icon-btn" data-action="${action}" data-delta="1" aria-label="ماه بعد" ${canNext ? '' : 'disabled style="opacity:.25"'}>${icons.chevronLeft}</button>
    </div>`;
}

function heatClass(pct: number | null): string {
  if (pct === null) return 'cal__cell--empty';
  return `heat-${levelFor(pct).tone}`;
}

/** Month grid with Saturday-first columns. Used by the dashboard and the date picker. */
export function monthGrid(month: JalaliMonth, options: { selected?: DayKey; action: string }): string {
  const days = monthDays(month);
  const offset = weekdayIndex(days[0]!);
  const head = WEEKDAY_INITIALS.map((w) => `<div class="cal__dow" aria-hidden="true">${w}</div>`).join('');
  const blanks = Array.from({ length: offset }, () => '<div aria-hidden="true"></div>').join('');
  const cells = days
    .map((day, i) => {
      const future = day > store.today;
      const { pct } = dayScore(store.data, day);
      const classes = [
        'cal__cell',
        'num',
        future ? '' : heatClass(pct),
        day === store.today ? 'cal__cell--today' : '',
        day === options.selected ? 'cal__cell--selected' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const label = `${formatLong(day)}${pct === null ? '' : ` · ${pct}%`}`;
      return `<button class="${classes}" data-action="${options.action}" data-day="${day}" aria-label="${esc(label)}"
          ${future ? 'disabled' : ''}>${i + 1}</button>`;
    })
    .join('');
  return `<div class="cal">${head}${blanks}${cells}</div>`;
}

function legend(): string {
  return `<div class="legend" aria-hidden="true">
      <span><i class="heat-top"></i><span class="num">90%+</span></span>
      <span><i class="heat-great"></i><span class="num">70–89%</span></span>
      <span><i class="heat-good"></i><span class="num">40–69%</span></span>
      <span><i class="heat-low"></i>زیر <span class="num">40%</span></span>
    </div>`;
}

export function renderHistory(): string {
  const month = store.ui.viewMonth;
  const days = visibleDays(month).reverse();
  const rows = days
    .map((day) => {
      const { pct, score, max } = dayScore(store.data, day);
      const level = pct === null ? null : levelFor(pct);
      return `<button class="day-row" data-action="open-day" data-day="${day}">
          <span class="day-row__dot ${pct === null ? '' : heatClass(pct)}" style="${pct === null ? 'border:1px solid var(--line)' : ''}"></span>
          <span class="day-row__date">
            <span class="task__name">${esc(formatLong(day))}</span>
            <span class="task__note">${level ? `${esc(level.label)} · <span class="num">${score}/${max}</span>` : 'ثبت نشده'}</span>
          </span>
          <span class="day-row__pct num ${level ? `tone-${level.tone}` : 'muted'}">${percent(pct)}</span>
          <span class="muted" style="width:16px">${icons.chevronLeft}</span>
        </button>`;
    })
    .join('');
  return `<div class="stack">
      ${monthNav(month)}
      <section class="panel" aria-label="روزهای ${esc(formatMonth(month))}">
        ${rows || '<div class="empty">روزی برای نمایش نیست.</div>'}
      </section>
      <p class="small muted" style="text-align:center">روی هر روز بزن تا آن را ببینی یا ویرایش کنی.</p>
    </div>`;
}

function monthSummary(month: JalaliMonth): { avg: number | null; excellent: number; recorded: number } {
  const scores = visibleDays(month)
    .map((d) => dayScore(store.data, d).pct)
    .filter((p): p is number => p !== null);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  return { avg, excellent: scores.filter((p) => p >= STREAK_THRESHOLD).length, recorded: scores.length };
}

export function renderDashboard(): string {
  const month = store.ui.viewMonth;
  const summary = monthSummary(month);
  const streak = streaks(store.data, store.today);
  return `<div class="stack">
      ${monthNav(month)}
      <div class="tiles">
        <div class="tile"><div class="label">AVERAGE</div><div class="small muted">میانگین ماه</div>
          <div class="tile__value num">${percent(summary.avg)}</div></div>
        <div class="tile"><div class="label">70%+</div><div class="small muted">روزهای عالی</div>
          <div class="tile__value num">${summary.excellent} <small>از ${summary.recorded}</small></div></div>
        <div class="tile"><div class="label">STREAK</div><div class="small muted">پیوستگی فعلی</div>
          <div class="tile__value num tone-top">${streak.current} <small>روز</small></div></div>
        <div class="tile"><div class="label">BEST</div><div class="small muted">بهترین پیوستگی</div>
          <div class="tile__value num">${streak.best} <small>روز</small></div></div>
      </div>
      <section class="panel" aria-labelledby="heat-title">
        <div class="panel__head">
          <div><div class="label">HEATMAP</div><h2 class="panel__title" id="heat-title">تقویم ${esc(formatMonth(month))}</h2></div>
        </div>
        <div class="panel__body">
          ${monthGrid(month, { action: 'open-day' })}
          ${legend()}
        </div>
      </section>
      <p class="small muted" style="text-align:center">پیوستگی یعنی روزهای پشت‌سرهم با امتیاز <span class="num">70%</span> یا بیشتر.</p>
    </div>`;
}

export function renderStats(): string {
  const month = store.ui.viewMonth;
  const days = monthDays(month);
  const points = days.filter((d) => d <= store.today).map((day) => ({ day, pct: dayScore(store.data, day).pct }));
  const summary = monthSummary(month);
  const selected = store.ui.chartDay && points.some((p) => p.day === store.ui.chartDay && p.pct !== null) ? store.ui.chartDay : null;
  const selPct = selected ? dayScore(store.data, selected).pct : null;

  const readout =
    selected && selPct !== null
      ? `<span>${esc(formatShort(selected))} · <span class="${`tone-${levelFor(selPct).tone}`}">${esc(levelFor(selPct).label)}</span></span>
         <strong class="num">${selPct}%</strong>`
      : `<span class="muted">میانگین ${esc(formatMonth(month))} · <span class="num">${summary.recorded}</span> روز ثبت‌شده</span>
         <strong class="num">${percent(summary.avg)}</strong>`;

  const rates = taskRates(store.data, days.filter((d) => d <= store.today)).sort(
    (a, b) => (a.rate ?? 101) - (b.rate ?? 101),
  );
  const rateRows = rates
    .map(({ task, rate }) => {
      const tone = rate === null ? 'muted' : `tone-${levelFor(rate).tone}`;
      const fill = rate === null ? '' : `<span class="${heatClass(rate)}" style="width:${rate}%"></span>`;
      return `<div class="rate">
          <div class="rate__head"><span>${esc(task.name)}</span><span class="num ${tone}">${percent(rate)}</span></div>
          <div class="rate__track">${fill}</div>
        </div>`;
    })
    .join('');

  return `<div class="stack">
      ${monthNav(month)}
      <section class="panel" aria-labelledby="chart-title">
        <div class="panel__head">
          <div><div class="label">MONTHLY CHART</div><h2 class="panel__title" id="chart-title">روند امتیاز روزانه</h2></div>
        </div>
        <div class="panel__body">
          <div class="chart__readout" aria-live="polite">${readout}</div>
          ${summary.recorded ? lineChart(points, selected, days.length) : '<div class="empty">در این ماه هنوز روزی ثبت نشده است.</div>'}
          <p class="small muted" style="margin:8px 0 0">روی هر نقطه بزن. خط‌چین مرز <span class="num">70%</span> است؛ روزهای ثبت‌نشده خط را قطع می‌کنند.</p>
        </div>
      </section>
      <section class="panel" aria-labelledby="rates-title">
        <div class="panel__head">
          <div><div class="label">HABITS</div><h2 class="panel__title" id="rates-title">عملکرد عادت‌ها (از ضعیف‌ترین)</h2></div>
        </div>
        <div class="panel__body">${rateRows || '<div class="empty">تسکی وجود ندارد.</div>'}</div>
      </section>
    </div>`;
}
