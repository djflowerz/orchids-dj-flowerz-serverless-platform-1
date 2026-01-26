
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

function getServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        try {
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
            return JSON.parse(decoded);
        } catch (e) {
            console.error('Failed to parse B64 service account', e);
        }
    }
    return require('./service-account.json');
}

const serviceAccount = getServiceAccount();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const email = 'ianohusa@gmail.com';

async function verifyUser() {
    try {
        console.log(`Searching for user: ${email}...`);
        const user = await admin.auth().getUserByEmail(email);
        console.log(`Found user: ${user.email} (${user.uid})`);

        // Update email verified status
        await admin.auth().updateUser(user.uid, {
            emailVerified: true
        });
        console.log('✅ Email manually set to VERIFIED in Auth.');

        // Also update Firestore user document if it exists
        const db = admin.firestore();
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            await userRef.update({
                email_verified: true,
                updated_at: new Date().toISOString()
            });
            console.log('✅ Firestore profile updated.');
        } else {
            console.log('⚠️ User profile doc not found in Firestore (user exists in Auth though).');
            console.log('Creating profile...');
            await userRef.set({
                name: 'Ian Muriithi',
                email: email,
                role: 'user',
                email_verified: true,
                created_at: new Date().toISOString()
            }, { merge: true });
            console.log('✅ Created new profile in Firestore.');
        }

    } catch (error) {
        console.error('Error verifying user:', error);
    }
    process.exit();
}

verifyUser();
