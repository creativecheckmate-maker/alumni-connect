'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseSdks {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

let cachedSdks: FirebaseSdks | null = null;

/**
 * Initializes Firebase App and returns the core SDK instances.
 * Uses a singleton pattern to prevent multiple initializations of Firestore,
 * which can lead to INTERNAL ASSERTION FAILED errors (Unexpected state ID: ca9).
 */
export function initializeFirebase(): FirebaseSdks {
  if (cachedSdks) return cachedSdks;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  cachedSdks = {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };

  return cachedSdks;
}

/**
 * Returns SDK instances for a given Firebase App.
 * Prefers initializeFirebase() for standard application use to ensure singleton stability.
 */
export function getSdks(firebaseApp: FirebaseApp): FirebaseSdks {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
