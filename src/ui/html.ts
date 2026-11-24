const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for safe interpolation into HTML (all user input goes through this). */
export function esc(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

/** Litres with two decimals, e.g. 1940 → "1.94". */
export function litres(ml: number): string {
  return (ml / 1000).toFixed(2);
}

export function percent(pct: number | null): string {
  return pct === null ? '—' : `${pct}%`;
}
