// VivaahReady Service Worker — Push Notifications Only
// No caching or offline support (not a PWA)

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'VivaahReady', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-icon.png',
    badge: data.badge || '/logo-icon.png',
    tag: data.tag || 'vivaahready-notification',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: data.actions || [],
  }

  event.waitUntil(self.registration.showNotification(data.title || 'VivaahReady', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(url)
    })
  )
})
