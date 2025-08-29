// Firebase configuration for feedback system
// Using your existing rajuhotel-basic project

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, orderBy, query, Timestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAbt2icr3kENdqHRkmqqauctWa713A3q9o",
  authDomain: "rajuhotel-basic.firebaseapp.com",
  projectId: "rajuhotel-basic",
  storageBucket: "rajuhotel-basic.appspot.com",
  messagingSenderId: "1083213742331",
  appId: "1:1083213742331:web:ad691aef7a2ca0cb61305e",
  measurementId: "G-7H5YX3E5DF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore DB instance
export const db = getFirestore(app);

// Export Firestore functions for easier use
export { collection, addDoc, getDocs, orderBy, query, Timestamp };
