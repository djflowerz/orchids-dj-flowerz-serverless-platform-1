# Payment & Order Tracking Fixes (Updated)

## 1. "Sign in with Google" Fix
The authentication issue is caused by the Cloudflare Pages domain not being authorized in Firebase.
**Action Required**:
1. Go to **Firebase Console** > **Authentication** > **Settings** > **Authorized domains**.
2. Click **Add domain**.
3. Enter: `djflowerz-site.pages.dev`
4. Click **Add**.

## 2. "Site not reflecting payments" Fix
We identified that the user profile and admin panel were looking for data in the wrong places or hiding it.

### User Profile (`/profile`)
- **Issue**: The profile page was trying to finding records in a `payments` collection, but our checkout system writes to `orders`.
- **Fix**: Updated the profile page to fetch from `orders`. You will now see your purchase history correctly.
- **Note**: If you see a "Missing Index" error and a blank list, open the browser console and click the link provided by Firebase to create the necessary index for `orders` (filtering by email + sorting by date).

### Admin Panel (`/admin`)
- **Important Update**: We have renamed the "Shipping" tab to **Orders**.
- **Real-Time Updates**: This tab uses a live connection to the database. As soon as a payment is confirmed (via Paystack Webhook), it will update instantly.
- **Enhanced Visibility**:
    - Shows **ALL** orders (Digital & Physical).
    - **Items Column**: See exactly what was purchased.
    - **Reference/ID**: Matches the Paystack Reference.
    - **Time**: Shows the exact date and time.
- **Manual Control ("Pendings Fix")**:
    - We added a dropdown to the **Payment Status** column.
    - You can now **manually change "Pending" to "Paid"** if the automatic system misses an update or if you are handling a manual payment.

## 3. Deployment
To make these changes live:
1. Run the deployment script:
   ```bash
   ./deploy-now.sh
   ```
2. If prompted, log in to Cloudflare.
3. Verify the site at `https://djflowerz-site.pages.dev`.

## 4. Paystack Verification
- Ensure your Paystack Dashboard Webhook URL is set to: `https://djflowerz-site.pages.dev/api/paystack/webhook`
- Any "Pending" orders in the Admin panel mean the checkout was initiated but the Webhook confirmation hasn't been received/processed yet. You can now manually update these to "Paid" if you confirm receipt of funds.
