const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');
require('dotenv').config({ path: '.env.local' });

console.log('B64 Key present:', !!process.env.FIREBASE_SERVICE_ACCOUNT_B64);

if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
  try {
    const jsonStr = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
    const sa = JSON.parse(jsonStr);
    console.log('JSON Parse success');
    admin.initializeApp({
      credential: cert(sa)
    });
    console.log('Firebase Admin Initialized successfully!');
  } catch (e) {
    console.error('Error:', e.message);
  }
} else {
  console.log('No B64 key found');
}
