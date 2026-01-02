self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (url) {
    event.waitUntil(clients.openWindow(url));
  }
});

self.addEventListener('push', function(event) {
  // Fallback for push messages if ever used
  let payload = {};
  try { payload = event.data.json(); } catch (e) { payload = { title: 'Bible Plan', body: event.data.text() }; }
  const title = payload.title || 'Bible Plan';
  const options = Object.assign({ body: payload.body || '', data: payload.data || {} }, payload.options || {});
  event.waitUntil(self.registration.showNotification(title, options));
});
