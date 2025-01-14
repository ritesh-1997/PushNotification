// src/serviceWorker.js
// eslint-disable-next-line no-restricted-globals
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon,
      badge: '/badge-icon.png',
    };
  
    event.waitUntil(
    // eslint-disable-next-line no-restricted-globals
      self.registration.showNotification(data.title, options)
    );
  });
  