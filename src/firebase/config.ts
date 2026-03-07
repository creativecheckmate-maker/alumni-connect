/**
 * Firebase Configuration
 * Hardcoded for zero-config prototype stability.
 * Values are also mirrored in .env for local development flexibility.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCICrX9hlYRQPIyZTBBWp5mmq_kNCht2fA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-8002433623-f6597.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-8002433623-f6597",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-8002433623-f6597.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "632211242428",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:632211242428:web:83193c5d76434e11d6bfb9"
};
