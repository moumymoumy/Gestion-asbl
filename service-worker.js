/* ==========================================================================
   Service Worker — Gestion ASBL
   Rôle : permettre à l'application de s'ouvrir instantanément (même hors
   ligne) en mettant en cache uniquement les fichiers de l'interface
   (HTML, manifest, icônes). Les échanges avec Supabase (synchronisation
   temps réel) ne passent jamais par ce cache : ils vont toujours sur le
   réseau pour garantir des données à jour.
   ========================================================================== */

const CACHE_NAME = 'gestion-asbl-cache-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : on met en cache la coquille de l'application
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activation : on supprime les anciennes versions du cache si besoin
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Requêtes réseau : on ignore tout ce qui va vers Supabase (temps réel,
// toujours en direct) et on sert le reste depuis le cache si disponible,
// avec repli sur le réseau sinon.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ne jamais mettre en cache les échanges avec Supabase
  if (url.includes('supabase.co') || url.includes('supabase.in')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
