// ⛔⛔ A KILL SWITCH, NOT A SERVICE WORKER. Its only job is to undo itself.
//
// Until 2026-09-20 heartbank.ceo was a single-page app on Firebase Hosting, and it registered a
// service worker at THIS path with scope "/" — precaching the whole app shell and answering every
// navigation with its cached index.html. That worker is still installed in every browser that ever
// opened the site. The static site that replaced it registers NO worker at all, so nothing would
// ever replace the old one: returning visitors would be served the retired app from their own
// cache, over a host that serves something else.
//
// ⭐ A browser re-checks a registered worker's script on navigation. When it fetches THIS file, it
//   installs it, and this file takes over, drops every cache the old worker left, unregisters
//   itself and reloads the windows it controls — after which the host behaves as if no worker had
//   ever existed.
//
// ⚠️ WHY NOT SIMPLY DELETE THE FILE: a 404 on the script is the ordinary way a registration dies,
//   but it depends on the browser treating a failed update as a reason to unregister, and the
//   estate has already been stranded once by an update that merely FAILED (thank.heartbank.ceo,
//   2026-09-20, where a catch-all rewrite answered this path with 200 and HTML). A real script at
//   the real path does not depend on that. ⛔ Keep serving it — it is cheap to keep and expensive
//   to remove, because whoever has not come back yet is still running the old worker.
//
// ⛔ Line comments only in this file. A block comment that happens to contain the two characters
//   that close one turns everything after it into code, and the browser reports nothing more
//   useful than "ServiceWorker script evaluation failed" — which is how that sibling broke.
//
// ⛔ No page on this site registers this file. It exists only to answer the old registration.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            for (const key of await caches.keys()) await caches.delete(key);
            await self.registration.unregister();
            // Reload the windows this worker still controls, so the visitor sees the real site now
            // rather than on some later visit.
            for (const client of await self.clients.matchAll({ type: "window" })) {
                try {
                    client.navigate(client.url);
                } catch (e) {
                    // nothing further to do
                }
            }
        })()
    );
});

// ⛔ No fetch handler on purpose. A worker that does not intercept lets every request go straight
//   to the network, so even before it finishes unregistering it is already harmless.
