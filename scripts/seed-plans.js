
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    console.error('FIREBASE_SERVICE_ACCOUNT_B64 is missing');
    process.exit(1);
}

const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const plans = [
    {
        id: 'plan_weekly',
        title: 'Music Pool - 1 Week Access',
        product_type: 'subscription',
        price: 200, // KSh
        duration: '7 days',
        description: 'Unlock 1 week of unlimited access to the music pool.',
        category: 'subscription'
    },
    {
        id: 'plan_monthly',
        title: 'Music Pool - 1 Month Access',
        product_type: 'subscription',
        price: 700,
        duration: '30 days',
        description: 'Unlock 1 month of unlimited access to the music pool.',
        category: 'subscription'
    },
    {
        id: 'plan_3months',
        title: 'Music Pool - 3 Months Access',
        product_type: 'subscription',
        price: 1800,
        duration: '90 days',
        description: 'Unlock 3 months of access. Save KSh 300.',
        category: 'subscription'
    },
    {
        id: 'plan_6months',
        title: 'Music Pool - 6 Months Access',
        product_type: 'subscription',
        price: 3500,
        duration: '180 days',
        description: 'Unlock 6 months of access. Save KSh 700.',
        category: 'subscription'
    },
    {
        id: 'plan_annual',
        title: 'Music Pool - 1 Year VIP Access',
        product_type: 'subscription',
        price: 6000,
        duration: '365 days',
        description: 'Unlock 12 months of VIP access. Best value.',
        category: 'subscription'
    }
];

async function seedPlans() {
    console.log('Seeding subscription plans...');
    const batch = db.batch();

    for (const plan of plans) {
        const ref = db.collection('products').doc(plan.id);
        batch.set(ref, {
            ...plan,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        }, { merge: true });
        console.log(`Prepared: ${plan.title}`);
    }

    await batch.commit();
    console.log('Successfully seeded plans.');
}

seedPlans().catch(console.error);
