/* Service worker for the MIT Manipal Campus Directory (static export).
 *
 * Strategy:
 *  - Hashed build assets (/_next/static/): cache-first, they are immutable.
 *  - Page navigations: network-first with a cached fallback, so content
 *    stays fresh online and the app still opens offline.
 *  - Other same-origin assets (icons, images, manifest): stale-while-revalidate.
 */

const VERSION = "v1";
const PAGE_CACHE = `pages-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const OFFLINE_FALLBACK = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_FALLBACK]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PAGE_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/*
 * Network-first, but only for as long as the network deserves.
 *
 * Page HTML has to stay fresh: it references hashed chunk filenames, and a
 * stale copy can point at chunks a later deploy has already removed. So the
 * network still wins when it answers. What changed is that it no longer gets
 * unlimited time to do so — previously a slow or half-open connection made
 * every navigation hang on the request even when a perfectly good cached copy
 * was sitting right there.
 */
const NETWORK_TIMEOUT_MS = 2500;

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);

  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  // If the race below is won by the timeout, nothing else handles this
  // rejection. Attaching a no-op keeps it from surfacing as unhandled.
  network.catch(() => {});

  const cached = await cache.match(request);
  if (!cached) {
    // Nothing to fall back to, so the network is the only option.
    try {
      return await network;
    } catch {
      return cache.match(OFFLINE_FALLBACK);
    }
  }

  try {
    return await Promise.race([
      network,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("network timeout")), NETWORK_TIMEOUT_MS),
      ),
    ]);
  } catch {
    // Timed out or failed. Serve the cached page; the fetch above is still in
    // flight and will refresh the cache for next time.
    return cached;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
