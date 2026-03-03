// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/7.20.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/7.20.0/firebase-messaging-compat.js');

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYr2dovq2g4py7th0saw70Uc_cJRNM_ak",
  authDomain: "studyflow-933f8.firebaseapp.com",
  projectId: "studyflow-933f8",
  storageBucket: "studyflow-933f8.firebasestorage.app",
  messagingSenderId: "811045907624",
  appId: "1:811045907624:web:475a0884919080dcae669d",
  measurementId: "G-Z4127WVYPQ"
};

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'StudyFlow Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Oras na para mag-aral!',
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
