let versionLocked = true;

self.addEventListener("install", event => {
    event.waitUntil(async () => {
        const cache = await caches.open("resources");
        await cache.addAll(["/", "/index.html"]);
        console.log("installed!")
    })
});

self.addEventListener('activate', function(event) {
    console.log('Claiming control');
    return self.clients.claim().then(() => console.log("control... claimed!"));
});

self.addEventListener("fetch", (event) => {
    const urlOrigin = new URL(event.request.url).origin;
    if (self.location.origin == urlOrigin) {
        if (versionLocked) {
            event.respondWith(caches.open("resources").then(cache => cache.match(event.request).then(cacheResponse => {
                if (cacheResponse === undefined) {
                    return fetch(event.request);
                } else {
                    return cacheResponse;
                }
            })));
        } else {
            caches.open("resources").then(cache => cache.add(event.request));
        }
    }
});

self.addEventListener("message", (event) => {
    versionLocked = event.data;
})
