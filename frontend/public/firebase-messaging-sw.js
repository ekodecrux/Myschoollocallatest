// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyD_a8A5yxsYg5H99YlqLARFTbcB8ZUrI_w",
  authDomain: "myschool-fcm.firebaseapp.com",
  projectId: "myschool-fcm",
  storageBucket: "myschool-fcm.appspot.com",
  messagingSenderId: "698861875818",
  appId: "1:698861875818:web:fce5e988dd251d230b1013",
  measurementId: "G-QJ00D7BEK5"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here

  function logerr(err) {
    console.log('Database erroor: ', err);
  }
  function connectDB(f) {
    const request = exports.indexedDB.open('ms-noti', 1);
    request.onerror = logerr;
    request.onsuccess = function () {
      f(request.result);
    };
    request.onupgradeneeded = function (e) {
      e.currentTarget.result.createObjectStore('Table1', { keyPath: 'ssn' });
      connectDB(f);
    };
  }
  connectDB(db => {
    const transition = db.transaction(['Table1'], 'readwrite');
    const objectStore = transition.objectStore('data');
    const customerData = {
      ssn: '444-44-4444',
      payload: payload.data.payload,
    };
    const objectStoreRequest = objectStore.add(customerData);

    objectStoreRequest.onerror = logerr;
    objectStoreRequest.onsuccess = function () {
      return objectStoreRequest.result;
    };
  });

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});
// [END background_handler]