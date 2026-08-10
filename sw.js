/*
 * Artemidos - service worker
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Cache-first for the app shell, because the whole point is that it works
 * with no signal. The two big data files are cached on first use rather than
 * on install: field-tools-data.js alone is 2.5 MB and most sessions never
 * touch it.
 */
const VERSION = 'artemidos-187fa300';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/mark.png',
  './icons/maskable.png',
  /* precached: the splash artwork is the first thing drawn on a cold start,
     so leaving it to the network would show a bare dark screen first */
  './icons/splash.png?v=c5a9101e',
  './css/app.css?v=fc0d31cc',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './js/core.js?v=9da9849d',
  './js/icons.js?v=fb24c677',
  './js/units-data.js?v=d9a97e97',
  './js/units.js?v=646ca550',
  './js/calc.js?v=ac7a9d29',
  './js/graph.js?v=79bf00d6',
  './js/solver.js?v=65f772bf',
  './js/stats.js?v=0edca100',
  './js/ratio.js?v=a6507052',
  './js/catalog.js?v=21b24602',
  './js/catalog-physics.js?v=25064cb9',
  './js/catalog-vehicles.js?v=4d6e1627',
  './js/catalog-military.js?v=c3dc8f4c',
  './js/catalog-bio.js?v=3c3cb6a9',
  './js/catalog-ballistics.js?v=ab247d9e',
  './js/catalog-military-2.js?v=aebd039f',
  './js/catalog-military-3.js?v=87bf8aad',
  './js/catalog-military-4.js?v=f353ffe1',
  './js/catalog-optics.js?v=ffd4f0e5',
  './js/catalog-vision.js?v=b621b2c6',
  './js/catalog-radiation.js?v=7d1f8c4b',
  './js/catalog-thermal.js?v=2b263934',
  './js/catalog-ew.js?v=c77eee78',
  './js/catalog-capability.js?v=9af127a5',
  './js/catalog-images.js?v=6aeb66ca',
  './js/catalog-profiles.js?v=988581e0',
  './js/speed.js?v=a105f994',
  './js/physics.js?v=c4135012',
  './js/shadow.js?v=2f1b6a88',
  './js/rangefinder.js?v=9c01d3dd',
  './js/radio.js?v=b0c7ad71',
  './js/morse.js?v=5485a23e',
  './js/field-tools.js?v=fd269e67',
  './js/settings.js?v=1355a376',
  './js/app.js?v=10d14cab'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      /* one bad URL must not fail the whole install, so add them individually */
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* exchange rates: always try the network, fall back to whatever we have */
  if (/(^|\.)frankfurter\.(dev|app)$/.test(url.hostname)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  /* Stale-while-revalidate: answer instantly from cache so the app opens with
     no signal, but always re-fetch in the background so a new build lands on
     the next launch. Plain cache-first would pin the app to whatever shipped
     first and make every update depend on remembering to bump a version. */
  e.respondWith(
    caches.match(req, { ignoreSearch: false }).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || caches.match('./index.html'));

      return hit || network;
    })
  );
});
