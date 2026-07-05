// AlloPanier Service Worker — PWA
const CACHE_NAME = 'allopanier-v1'
const STATIC_ASSETS = [
  '/',
  '/catalogue',
  '/promoflash',
  '/manifest.json',
]

// Installation — mise en cache des assets statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// Activation — nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Stratégie : Network First (tente le réseau, fallback cache)
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ne pas intercepter les requêtes API
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return
  }

  // Pour les assets statiques : cache first
  if (request.destination === 'image' || request.destination === 'font' ||
      request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Pour les pages : network first avec fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
  )
})
