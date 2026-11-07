const CACHE = "absensi-madin-v35";

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        "./",
        "./index.html",
        "./style.css?v=30",
        "./app.js?v=27",
        "./manifest.json",
        "./LOGO%20MADIN%20REMOVE%20BG.png",
        "./santri-mengaji-transparent-hd.png"
      ])
    )
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE).map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  if (
    event.request.method === "GET" &&
    new URL(event.request.url).origin === location.origin
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
