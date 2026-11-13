// Installs the offline service worker in production builds (ADR-005). The dev server has none:
// a cached copy would hide every change.
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    // Without it the app still works online; offline it simply does not open.
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
