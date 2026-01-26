# Deployment Success Report

## Date: 2026-01-26

## ✅ Status: LIVE MODE ACTIVE
Your site is deployed with **Paystack Live Keys**. Real payments will now be processed.

## 🌍 Live Site
- **Production URL:** `https://djflowerz-site-7y1.pages.dev`
- **Configured App URL:** `https://djflowerz-site.pages.dev` (Ensure this maps to your project in Cloudflare Dashboard)

## ☁️ Firebase Functions
- **Project:** flowpay-401a4
- **Webook URL:** `https://us-central1-flowpay-401a4.cloudfunctions.net/paystackWebhook`

## 🛠 Deployment Configuration

### Frontend (Cloudflare Pages)
- **Framework:** Next.js (via `@cloudflare/next-on-pages`)
- **Runtime:** Edge Runtime for API Routes (`/api/*`), Static for Pages.
- **Secrets:** `PAYSTACK_SECRET_KEY` (Uploaded to Cloudflare)
- **Environment:** `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (pk_live...) baked into build.

### Backend (Firebase Functions)
- **Runtime:** Node.js 20
- **Location:** `backend-functions/`
- **Secrets:** `PAYSTACK_SECRET_KEY` (Configured via `.env`)

## ✅ Verification Steps
1.  **Test Payment:** Run a real transaction with a small amount (e.g., KES 10) on the live site.
2.  **Verify Webhook:** Ensure the transaction status updates in your Admin Dashboard/Firestore.

## ⚠️ Important
Ensure your Paystack Dashboard > Settings > API & Webhooks > **Live Webhook URL** is set to:
`https://us-central1-flowpay-401a4.cloudfunctions.net/paystackWebhook`

**Live Callback URL:**
`https://djflowerz-site.pages.dev/payment-success` (or `https://djflowerz-site-7y1.pages.dev/payment-success` if using the direct pages URL)
