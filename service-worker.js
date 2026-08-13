/* ════════════════════════════════════════════════════════════
   service-worker.js — app shell 快取 + runtime cache
   同源請求走 network-first（有網路必拿最新版，離線才退回快取）；
   CDN（React/html2canvas/jsPDF）走 stale-while-revalidate。
   ════════════════════════════════════════════════════════════ */

const CACHE_VERSION = "v2";
const APP_SHELL_CACHE = "gasfield-app-shell-" + CACHE_VERSION;
const RUNTIME_CACHE = "gasfield-runtime-" + CACHE_VERSION;

const APP_SHELL_FILES = [
  "./",
  "index.html",
  "manifest.json",
  "js/data.js",
  "js/db.js",
  "js/widgets.js",
  "js/forms.js",
  "js/app.js",
  "icons/icon-192.svg",
  "icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== APP_SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // 同源：network-first，明確繞過瀏覽器 HTTP 快取（no-store）避免 CDN/主機端
    // Cache-Control 造成「已改版但還是拿到舊檔」；離線或網路失敗時才退回快取
    event.respondWith(
      fetch(req, { cache: "no-store" }).then((res) => {
        if (res && res.ok) caches.open(APP_SHELL_CACHE).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 跨源（CDN）：stale-while-revalidate
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
