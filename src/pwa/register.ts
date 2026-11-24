import { toast } from '../ui/overlays';

let updateRequested = false;

/**
 * Registers the service worker (offline support + installability).
 * A new version waits until the user taps "update", so an open journal entry
 * is never interrupted by an automatic reload.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  // Reload only when the user asked for an update. On the very first install
  // the worker also takes control (clients.claim), which must not reload the page.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!updateRequested || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then((registration) => {
        const offer = (worker: ServiceWorker): void => showUpdateBar(worker);
        if (registration.waiting && navigator.serviceWorker.controller) offer(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
          });
        });
        // Check for updates when the app comes back to the foreground.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registration.update().catch(() => undefined);
        });
      })
      .catch(() => {
        /* Offline support unavailable; the app still works online. */
      });
  });
}

function showUpdateBar(worker: ServiceWorker): void {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'update-bar';
  bar.className = 'banner settings-row';
  bar.style.cssText = 'position:fixed;inset-inline:16px;top:72px;z-index:40;background:var(--charcoal);max-width:448px;margin:0 auto';
  bar.innerHTML = `<span>نسخه‌ی تازه‌ی اپ آماده است.</span>
    <button class="btn btn--primary" style="min-height:36px;padding:6px 14px">به‌روزرسانی</button>`;
  bar.querySelector('button')!.addEventListener('click', () => {
    updateRequested = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
    toast('در حال به‌روزرسانی…');
  });
  document.body.appendChild(bar);
}
