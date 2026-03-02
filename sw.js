// firebase-messaging-sw.js

// Import Firebase compat scripts
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Your Firebase config (tama na 'to mula sa'yo)
const firebaseConfig = {
  apiKey: "AIzaSyDYr2dovq2g4py7th0saw70Uc_cJRNM_ak",
  authDomain: "studyflow-933f8.firebaseapp.com",
  projectId: "studyflow-933f8",
  storageBucket: "studyflow-933f8.firebasestorage.app",
  messagingSenderId: "811045907624",
  appId: "1:811045907624:web:475a0884919080dcae669d",
  measurementId: "G-Z4127WVYPQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages (when app is closed or minimized)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification
  const notificationTitle = payload.notification?.title || 'StudyFlow Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Oras na para mag-aral! Buksan mo ang app mo para sa task.',
    icon: '/favicon.ico',          // optional – magdagdag ng icon kung mayroon ka
    badge: '/favicon.ico',         // optional
    tag: 'studyflow-reminder',     // para hindi mag-stack ng maraming notifications
    renotify: true                 // para mag-vibrate ulit kung may bagong message
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
