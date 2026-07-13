/* ==========================================================================
   Service Worker — Gestion ASBL
   Rôle : permettre l'installation de l'application (PWA) et un minimum de
   confort hors-ligne pour les icônes. Le document principal (index.html)
   n'est JAMAIS servi depuis un cache : il est toujours redemandé au
   réseau, avec l'option "no-store" qui court-circuite aussi les caches
   intermédiaires (navigateur, proxy). Ainsi, une mise à jour de
   l'application est TOUJOURS visible immédiatement, sans manipulation.
   ========================================================================== */

const CACHE_NAME = 'gestion-asbl-cache-v4';
const APP_SHELL = ['./icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Jamais d'interception pour Supabase (temps réel, toujours en direct)
  if (requestUrl.hostname.includes('supabase')) return;

  const estDocumentPrincipal =
    event.request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('index.html') ||
    requestUrl.pathname === '/' ||
    requestUrl.pathname.endsWith('manifest.json');

  if (estDocumentPrincipal) {
    // Toujours frais : on ignore complètement le cache, à tous les niveaux.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() =>
        caches.match(event.request)
      )
    );
    return;
  }

  // Icônes uniquement : cache d'abord, ça ne change quasiment jamais.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
