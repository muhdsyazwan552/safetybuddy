// Minimal service worker: lets the browser offer "Install app" / "Add to Home screen".
// It does not cache anything, so users always get the latest data and pages.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
