importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAP_AtvkjJwAOXGVJcJYpWtnDaFVowhvek",
  authDomain: "dash-ff36f.firebaseapp.com",
  projectId: "dash-ff36f",
  storageBucket: "dash-ff36f.firebasestorage.app",
  messagingSenderId: "734724800536",
  appId: "1:734724800536:web:d9ea26f62cea62bbdd436d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "DASH", {
    body: body || "",
  }).then(() => console.log("Notification shown successfully"))
    .catch(err => console.error("Failed to show notification:", err));
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});