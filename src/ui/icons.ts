/** Inline stroke icons (1.6px, currentColor) — no icon font, works offline. */
const svg = (body: string, extra = ''): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" ${extra}>${body}</svg>`;

export const icons = {
  today: svg('<path d="M5 4h14v17H5z"/><path d="M9 2v4M15 2v4M5 9h14"/><path d="M9 14.5l2 2 4-4"/>'),
  water: svg('<path d="M12 3.5c3.5 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.5 6-11z"/>'),
  history: svg('<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><path d="M12 8v4.5l3 2"/>'),
  dashboard: svg('<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>'),
  stats: svg('<path d="M3 20h18"/><path d="M4 16l5-6 4 3 7-8"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/><circle cx="13" cy="13" r="0.6" fill="currentColor"/>'),
  gear: svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><path d="M14 4.5v5h4v-5zM6 14.5v5h4v-5z"/>'),
  chevronDown: svg('<path d="M6 9l6 6 6-6"/>'),
  chevronRight: svg('<path d="M9 6l6 6-6 6"/>'),
  chevronLeft: svg('<path d="M15 6l-6 6 6 6"/>'),
  up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  pencil: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  calendar: svg('<path d="M4 5h16v15H4z"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M12 13v5M9.5 15.5h5"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>'),
  logout: svg('<path d="M14 4H5v16h9"/><path d="M10 12h10M16 8l4 4-4 4"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: svg('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
  done: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2"'),
  partial: svg('<path d="M6 12h12"/>', 'stroke-width="2"'),
  missed: svg('<path d="M7 7l10 10M17 7L7 17"/>', 'stroke-width="2"'),
} as const;

export type IconName = keyof typeof icons;
