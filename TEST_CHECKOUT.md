# How to Test Your New Secure Checkout

Your Paystack secure checkout flow is now deployed. Follow these steps to verify it.

## 1. Prerequisites
- Ensure `PAYSTACK_SECRET_KEY` is set in your [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages > `djflowerz-site` > Settings > Environment Variables.
- Ensure your Paystack Dashboard is in **Test Mode** if you want to test without spending money.

## 2. Testing the Flow
1. **Login:** Go to `https://djflowerz-site.pages.dev/login` and sign in. (You can use the new `/check-email` flow if creating a new account).
2. **Select Product:** Go to `https://djflowerz-site.pages.dev/store`.
3. **Click Buy Now:** Select a product (preferably a Digital one). Click the new **Buy Now** button.
   - *Expected:* You should see "Redirecting to checkout..." toast, then be taken to Paystack.
4. **Complete Payment:**
   - If in Test Mode, select "Success" card or Bank.
   - If in Live Mode, use a real card (you can refund yourself later).
5. **Verify Redirection:**
   - After payment, Paystack will redirect you to:
   - `https://djflowerz-site.pages.dev/payment-success?reference=...`
6. **Verify Success Page:**
   - The page should load, show "Payment Successful", and display the product details.
   - *Security Check:* If you visit `/payment-success` *without* a reference (or with a fake one), you should be redirected or see an error.
7. **Download File:**
   - Click the **Download Now** button.
   - *Expected:* The file should start downloading.
   - *Note:* This link is protected; it validates your payment again before serving the file.

## 3. Verify Backend (Optional)
- Check your Firestore `transactions` collection. You should see a new record with `status: 'success'` and the correct `reference`.

## Troubleshooting
- **404 /payment-success:** Wait 1-2 minutes for deployment to propagate.
- **"Checkout failed":** Check Browser Console for errors. Ensure `PAYSTACK_SECRET_KEY` is correct.
- **Email Verification:** If you just signed up and didn't get an email, remember to add `djflowerz-site.pages.dev` to Firebase Console > Authentication > Settings > Authorized Domains.
