const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');
require('dotenv').config({ path: '.env.local' });

const pk = process.env.FIREBASE_PRIVATE_KEY;
console.log('Raw PK length:', pk ? pk.length : 0);
if (pk) {
  console.log('Raw PK start:', JSON.stringify(pk.substring(0, 30)));
  console.log('Raw PK has actual newlines:', pk.includes('\n'));
  console.log('Raw PK has literal \\n:', pk.includes('\\n'));
}

try {
  const finalPk = pk.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: finalPk
    })
  });
  console.log('Success!');
} catch (e) {
  console.error('Error:', e.message);
}
