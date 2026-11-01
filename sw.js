self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html","./style.css","./app.js","./manifest.json","./LOGO%20MADIN%20REMOVE%20BG.png"]))));
