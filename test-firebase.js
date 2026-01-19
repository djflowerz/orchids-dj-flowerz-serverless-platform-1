const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');
require('dotenv').config({ path: '.env.local' });

console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('Service Account Key present:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('JSON Parse success');
    console.log('Private key present:', !!sa.private_key);
    admin.initializeApp({
      credential: cert(sa)
    });
    console.log('Firebase Admin Initialized with JSON successfully!');
  } catch (e) {
    console.error('JSON Error:', e.message);
  }
} else if (process.env.FIREBASE_PRIVATE_KEY) {
  try {
    const pk = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pk
      })
    });
    console.log('Firebase Admin Initialized with individual variables successfully!');
  } catch (e) {
    console.error('ENV Error:', e.message);
  }
} else {
  console.log('No credentials found');
}
