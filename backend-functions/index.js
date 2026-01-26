const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Create a payment transaction securely on the server.
 * This function can be called directly from your client app using the Firebase SDK.
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
    // 1. Ensure the user is authenticated (optional but recommended)
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { amount, email, productId } = data;

    try {
        // 2. Initialize Paystack (or Stripe) here using your Secret Key
        // const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

        console.log(`Initializing payment for ${email}: ${amount}`);

        // Mock response for now - REPLACE with actual Paystack initialization
        // const response = await paystack.transaction.initialize({ ... })

        return {
            status: 'success',
            message: 'Payment initialized securely',
            transactionReference: `REF_${Date.now()}`,
            // authorizationUrl: response.data.authorization_url 
        };

    } catch (error) {
        console.error("Payment creation failed:", error);
        throw new functions.https.HttpsError('internal', 'Unable to create payment verification.');
    }
});

/**
 * Paystack Webhook Handler (Firebase Version)
 * If you prefer handling webhooks via Firebase Functions instead of Cloudflare Edge.
 * URL: https://us-central1-flowpay-401a4.cloudfunctions.net/paystackWebhook
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    // 1. Validate Signature
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];

    if (!secret || !signature) {
        console.warn('Missing secret or signature');
        res.status(401).send('Unauthorized');
        return;
    }

    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash !== signature) {
        console.warn('Invalid signature');
        res.status(401).send('Invalid signature');
        return;
    }

    const event = req.body;
    console.log('Firebase Webhook received:', event.event);

    if (event.event === 'charge.success') {
        const { reference, metadata } = event.data;

        // 2. Update Firestore
        try {
            // Check for subscription type payment
            const isSubscription = metadata?.type === 'subscription';

            if (isSubscription && metadata.user_id) {
                await admin.firestore().collection('users').doc(metadata.user_id).update({
                    subscription_status: 'active',
                    subscription_tier: 'unlimited',
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                });
                // Also update subscription record
                await admin.firestore().collection('subscriptions').doc(reference).set({
                    status: 'active',
                    payment_status: 'paid',
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } else if (metadata?.product_id) {
                // Normal product order
                // Logic to update orders collection implies finding order by ID or reference
                // For simplicity, we assume reference matches order doc if that's how we set it up,
                // or query for it.
            }
        } catch (e) {
            console.error('Error updating Firestore:', e);
            res.status(500).send('Database error');
            return;
        }
    }

    res.status(200).send('OK');
});
