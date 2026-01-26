# How to Test Music Pool Subscription

We have migrated the Music Pool subscription buttons to use the new Secure Checkout flow.

## 1. Prerequisites
- Deployment must be complete.
- You must be logged in to the site.

## 2. Test Flow
1. **Navigate to:** `https://djflowerz-site.pages.dev/music-pool`
2. **Subscribe:** Click on any "Subscribe" button (e.g., 1 Week, 1 Month).
   - *Action:* You should see "Initiating subscription..." toast.
   - *Redirect:* You will be redirected to Paystack.
3. **Payment:** Complete payment (Test Mode recommended).
4. **Success:** You will be redirected to `/payment-success`.
   - *Verification:* The page validates your payment.
   - *UI:* Instead of "Download", it will say "Your subscription is confirmed" and show "Go to Music Pool".
5. **Access:** Click "Go to Music Pool".
   - You should now see the tracks (access unlocked).

## 3. Managing Plans
The subscription plans (Weekly, Monthly, etc.) are now stored in Firestore in the `products` collection with `type: 'subscription'`.
If you need to change prices, edit the documents in Firestore:
- `plan_weekly`
- `plan_monthly`
- `plan_3months`
- `plan_6months`
- `plan_annual`

## 4. Backend Verification
- Ensure your Paystack Webhook is configured to `https://djflowerz-site.pages.dev/api/paystack/webhook`.
- Verify that a `subscriptions` document is created in Firestore upon checkout initiation (status: `pending`) and updated to `active` upon webhook success.
