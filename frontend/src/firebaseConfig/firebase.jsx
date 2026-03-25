// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_a8A5yxsYg5H99YlqLARFTbcB8ZUrI_w",
    authDomain: "myschool-fcm.firebaseapp.com",
    projectId: "myschool-fcm",
    storageBucket: "myschool-fcm.appspot.com",
    messagingSenderId: "698861875818",
    appId: "1:698861875818:web:fce5e988dd251d230b1013",
    measurementId: "G-QJ00D7BEK5"
};
// Initialize Firebase with error handling
let firebaseApp = null;
let messaging = null;
try {
    firebaseApp = initializeApp(firebaseConfig);
    // Only initialize messaging if we're in a browser that supports it
    if (typeof window !== 'undefined' && 'Notification' in window) {
        messaging = getMessaging(firebaseApp);
    }
} catch (error) {
    // Firebase init error
}
export const fetchToken = (setTokenFound) => {
    if (!messaging) {
        setTokenFound(false);
        return Promise.resolve();
    }
    return getToken(messaging, { 
        vapidKey: 'BD3JvgnhabS3re-F_6uT13y8URaUv6QZnPsQfLgvfNIz6znle2DmfuX-_O-nNb42gZpuBUAYnln-IQeMV5jQED8' 
    }).then((currentToken) => {
        if (currentToken) {
            // Token received
            setTokenFound(true);
        } else {
            // No token available
            setTokenFound(false);
        }
    }).catch((err) => {
        // Token error
        setTokenFound(false);
    });
}
export const onMessageListener = () =>
    new Promise((resolve, reject) => {
        if (!messaging) {
            // Return a promise that never resolves if messaging isn't available
            return;
        }
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
