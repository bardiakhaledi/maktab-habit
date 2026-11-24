import { esc } from './html';
import { icons } from './icons';

let sheetEl: HTMLElement;
let sheetBody: HTMLElement;
let sheetTitle: HTMLElement;
let toastEl: HTMLElement;
let toastTimer = 0;
let lastFocus: HTMLElement | null = null;
let onSheetClose: (() => void) | null = null;

export function mountOverlays(root: HTMLElement): void {
  root.insertAdjacentHTML(
    'beforeend',
    `<div class="sheet" id="sheet" aria-hidden="true">
       <div class="sheet__scrim" data-action="sheet-close"></div>
       <div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
         <div class="sheet__grip" aria-hidden="true"></div>
         <div class="sheet__head">
           <h2 class="sheet__title" id="sheet-title"></h2>
           <button class="icon-btn" data-action="sheet-close" aria-label="بستن">${icons.close}</button>
         </div>
         <div id="sheet-body"></div>
       </div>
     </div>
     <div class="toast" id="toast" role="status" aria-live="polite"></div>`,
  );
  sheetEl = root.querySelector<HTMLElement>('#sheet')!;
  sheetBody = root.querySelector<HTMLElement>('#sheet-body')!;
  sheetTitle = root.querySelector<HTMLElement>('#sheet-title')!;
  toastEl = root.querySelector<HTMLElement>('#toast')!;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSheetOpen()) closeSheet();
  });
}

export function isSheetOpen(): boolean {
  return sheetEl.classList.contains('is-open');
}

export function openSheet(title: string, bodyHtml: string, options: { onClose?: () => void } = {}): HTMLElement {
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  onSheetClose = options.onClose ?? null;
  sheetTitle.textContent = title;
  sheetBody.innerHTML = bodyHtml;
  sheetEl.classList.add('is-open');
  sheetEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const first = sheetBody.querySelector<HTMLElement>('[autofocus], input, textarea, select, button');
  // Delay focus until the panel has started sliding in (avoids scroll jumps on mobile).
  window.setTimeout(() => first?.focus({ preventScroll: true }), 60);
  return sheetBody;
}

/** Replaces the body of the open sheet (e.g. month navigation inside the picker). */
export function updateSheet(bodyHtml: string): HTMLElement {
  sheetBody.innerHTML = bodyHtml;
  return sheetBody;
}

export function closeSheet(): void {
  if (!isSheetOpen()) return;
  sheetEl.classList.remove('is-open');
  sheetEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  const cb = onSheetClose;
  onSheetClose = null;
  cb?.();
  lastFocus?.focus({ preventScroll: true });
}

export function toast(message: string, ms = 2600): void {
  window.clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), ms);
}

/** Small confirmation sheet. Resolves true only when the user confirms. */
export function confirmSheet(title: string, message: string, confirmLabel: string, danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const body = openSheet(
      title,
      `<div data-confirm-root>
         <p class="muted" style="margin:0 0 20px">${esc(message)}</p>
         <div class="btn-row">
           <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-confirm="yes">${esc(confirmLabel)}</button>
           <button class="btn btn--ghost" data-confirm="no">انصراف</button>
         </div>
       </div>`,
      { onClose: () => finish(false) },
    );
    // Listen on the freshly created wrapper (not the reused sheet body), so
    // listeners from earlier dialogs can never fire for this one.
    body.querySelector('[data-confirm-root]')!.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-confirm]');
      if (!btn) return;
      finish(btn.dataset.confirm === 'yes');
      closeSheet();
    });
  });
}
