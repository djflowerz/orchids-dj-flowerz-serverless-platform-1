# Firebase Cloud Functions Setup

## Date: 2026-01-26

We have successfully set up Firebase Cloud Functions to complement your Cloudflare Pages hosting.

## 📂 Configuration
- **Directory:** `backend-functions` (Configured in `firebase.json` to avoid conflict with `functions/` used by Cloudflare)
- **Runtime:** Node.js 20

## 🚀 Deployed Functions

### 1. `createPaymentIntent` (Callable)
- **Type:** `functions.https.onCall`
- **Use:** Call from your frontend using Firebase SDK to securely initialize payments.
- **Example Usage:**
  ```javascript
  const createPayment =  firebase.functions().httpsCallable('createPaymentIntent');
  const result = await createPayment({ email: 'user@example.com', amount: 5000 });
  ```

### 2. `paystackWebhook` (HTTP Request)
- **Type:** `functions.https.onRequest`
- **Use:** Determines payment success and updates Firestore.
- **Webhook URL:** `https://us-central1-flowpay-401a4.cloudfunctions.net/paystackWebhook`

## ✅ Next Steps for You
1.  **Update Paystack Dashboard:** Go into Settings > API & Webhooks and paste the **Webhook URL** above.
2.  **Set Environment Variables:** Ensure `PAYSTACK_SECRET_KEY` is set in Firebase config if not handled by `.env` (Run: `firebase functions:config:set paystack.secret="YOUR_KEY"` and update code to use `functions.config().paystack.secret` if strictly following legacy patterns, though `process.env` works if variables are deployed).
