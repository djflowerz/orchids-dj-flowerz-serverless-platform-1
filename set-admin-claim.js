const admin = require('firebase-admin');

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || require('fs').readFileSync('.env.local', 'utf8').match(/FIREBASE_SERVICE_ACCOUNT_B64=(.+)/)?.[1];
let jsonStr = Buffer.from(b64, 'base64').toString('utf8');
// Fix malformed JSON escape sequence
jsonStr = jsonStr.replace(/\\([^nrtbf"\\/])/g, '\\n$1');
const serviceAccount = JSON.parse(jsonStr);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = 'HB0Gq49bGAaS6w0nnpJlOawBgu52';

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('✅ Admin claim set successfully for user:', uid);
    console.log('⚠️  User must log out and log back in for changes to take effect');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting admin claim:', error);
    process.exit(1);
  });
