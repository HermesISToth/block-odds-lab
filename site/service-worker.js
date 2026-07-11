const CACHE_NAME = "block-odds-lab-v24";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./disclosure.html",
  "./white-paper.html",
  "./share-kit.html",
  "./weekend-mining-challenge.html",
  "./feed.xml",
  "./llms.txt",
  "./bitcoin-mining-difficulty-tracker.html",
  "./block-odds-calculator.html",
  "./bitcoin-solo-mining-calculator.html",
  "./bitaxe-odds-calculator.html",
  "./nerdminer-bitcoin-odds.html",
  "./articles/bitaxe-gamma-tuning.html",
  "./articles/low-cost-upgrades.html",
  "./articles/solo-pool-checklist.html",
  "./articles/lottery-mining-odds.html",
  "./articles/bitaxe-vs-nerdminer.html",
  "./articles/lottery-mining-profitability.html",
  "./articles/bitcoin-mining-difficulty.html",
  "./downloads/bitaxe-tuning-log.csv",
  "./assets/hero-lottery-mining.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
