import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

import { Buffer } from 'buffer';

function getServiceAccount() {
  // Try base64 encoded service account first
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_B64:', e);
    }
  }

  // Try JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
    }
  }

  // Try individual fields
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    };
  }

  // Warning only - return null so we can handle it 
  console.warn('⚠️ No Firebase service account credentials found in environment variables. This is expected during build time.');
  return null;
}

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized');
    } else {
      console.warn('⚠️ Skipping Firebase Admin initialization (missing credentials)');
      // Create a dummy app/db structure or let it fail at usage time?
      // Better to throw if we actually need it, but during build we just want to load.
      // We can't really mock the whole app easily. 
      // But if we don't assign 'app', getFirestore(app) below will fail unless we guard that too.
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    // Don't throw during build to allow static generation to proceed (unless strictly required)
    // throw error; 
  }
} else {
  app = getApps()[0];
}

// Export initialized services
if (app) {
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };
