// firebase-messaging-sw.js
// Ito ang file na dapat mong i-save sa root folder ng app mo

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase Config mo – siguraduhing tama 'to
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

// Background notification handler – CUSTOMIZED NA ITO
messaging.onBackgroundMessage((payload) => {
  console.log('[StudyFlow SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || '📚 StudyFlow Alert!';
  
  const notificationOptions = {
    body: payload.notification?.body || 'Babylyn, oras na para mag-aral! Huwag mong palampasin ang task mo – kaya mo 'yan! 💪',
    icon: '/favicon.ico',          // optional – palitan mo kung may logo ka
    badge: '/favicon.ico',
    tag: 'studyflow-reminder-' + Date.now(),  // unique para hindi mag-merge
    renotify: true,                // mag-vibrate ulit kahit may existing
    vibrate: [200, 100, 200, 100, 200], // strong vibration pattern
    requireInteraction: true,      // manatili hangga't hindi mo ic-click
    silent: false                  // siguradong may sound/vibrate
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
