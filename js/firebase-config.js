// firebase-config.js
// =============================================
// IMPORTANT: Replace these placeholder values with
// your actual Firebase project config.
// Find them in: Firebase Console -> Project Settings
// -> Your apps -> Web -> SDK setup and configuration
// =============================================

const firebaseConfig = {
  apiKey: "AIzaSyCKpR2DVGq7DfgfhunGMNZNI458brSXNz0",
  authDomain: "purplemummy-d8ee4.firebaseapp.com",
  projectId: "purplemummy-d8ee4",
  storageBucket: "purplemummy-d8ee4.firebasestorage.app",
  messagingSenderId: "1054092519942",
  appId: "1:1054092519942:web:0e7a9b725617f996557187",
  measurementId: "G-H8DFTERDSD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global Firestore reference used by db.js
const db = firebase.firestore();
