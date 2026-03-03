// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Config mo (tama na 'to)
firebase.initializeApp({
  apiKey: "AIzaSyDYr2dovq2g4py7th0saw70Uc_cJRNM_ak",
  authDomain: "studyflow-933f8.firebaseapp.com",
  projectId: "studyflow-933f8",
  storageBucket: "studyflow-933f8.firebasestorage.app",
  messagingSenderId: "811045907624",
  appId: "1:811045907624:web:475a0884919080dcae669d",
  measurementId: "G-Z4127WVYPQ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[StudyFlow SW] Background message received:', payload);

  const title = payload.notification?.title || '📚 StudyFlow Alert!';
  const options = {
    body: payload.notification?.body || 'Babylyn, oras na para mag-aral! Huwag mong palampasin ang task mo – kaya mo 'yan! 💪',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'studyflow-reminder-' + Date.now(),
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    silent: false
  };

  return self.registration.showNotification(title, options);
});
