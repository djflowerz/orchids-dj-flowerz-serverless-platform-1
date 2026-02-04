# Production Configuration - DJ FLOWERZ

**Last Updated:** 2026-02-04  
**Environment:** Production (Live)  
**Deployment Platform:** Cloudflare Pages  
**Site URL:** https://djflowerz-site.pages.dev

---

## ✅ Configuration Status

All production API credentials have been configured in `.env.local`:

### 🔐 Authentication (Clerk - LIVE)
- **Publishable Key:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (see `.env.local`)
- **Secret Key:** `CLERK_SECRET_KEY` (see `.env.local`)
- **Frontend API:** https://clerk.djflowerz-site.pages.dev
- **Backend API:** https://api.clerk.com
- **JWKS URL:** https://clerk.djflowerz-site.pages.dev/.well-known/jwks.json

### 💳 Payment Gateway (Paystack - LIVE)
- **Public Key:** `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (see `.env.local`)
- **Secret Key:** `PAYSTACK_SECRET_KEY` (see `.env.local`)
- **Callback URL:** https://djflowerz-site.pages.dev/payment-success
- **Webhook URL:** https://djflowerz-site.pages.dev/api/paystack/webhook

### ☁️ Cloudflare Pages Deployment
- **API Key:** `CLOUDFLARE_API_KEY` (see `.env.local`)
- **CA Key:** `CLOUDFLARE_CA_KEY` (see `.env.local`)

### 🗄️ Database (Neon PostgreSQL)
- **REST API URL:** `NEON_DATABASE_REST_URL` (see `.env.local`)
- **Connection String:** `DATABASE_URL` (see `.env.local`)

---

## 💰 Subscription Plans & Pricing

All subscription plans are configured with Paystack payment links:

| Plan | Price (KES) | Payment Link | Environment Variable |
|------|-------------|--------------|---------------------|
| **1 Week** | 200 | https://paystack.shop/pay/7u8-7dn081 | `NEXT_PUBLIC_PLAN_1_WEEK_URL` |
| **1 Month** | 700 | https://paystack.shop/pay/u0qw529xyk | `NEXT_PUBLIC_PLAN_1_MONTH_URL` |
| **3 Months** | 1,800 | https://paystack.shop/pay/ayljjgzxzp | `NEXT_PUBLIC_PLAN_3_MONTHS_URL` |
| **6 Months** | 3,500 | https://paystack.shop/pay/5p4gjiehpv | `NEXT_PUBLIC_PLAN_6_MONTHS_URL` |
| **12 Months VIP** | 6,000 | https://paystack.shop/pay/po2leez4hy | `NEXT_PUBLIC_PLAN_12_MONTHS_URL` |

### Savings Breakdown
- **3 Months:** Save KSh 300 (vs 3x monthly)
- **6 Months:** Save KSh 700 (vs 6x monthly)
- **12 Months:** Save KSh 2,400 (vs 12x monthly) + VIP benefits

---

## 🚀 Deployment Information

### GitHub Repository
- **URL:** https://github.com/djflowerz/orchids-dj-flowerz-serverless-platform-1.git
- **Branch:** `main`
- **Latest Commit:** `06ce152 - Fix: Replace custom auth with Clerk components for production`

### Cloudflare Pages
- **Project Name:** djflowerz-site
- **Production URL:** https://djflowerz-site.pages.dev
- **Preview URL:** https://837d6194.djflowerz-site.pages.dev

---

## 📋 Next Steps

### 1. Configure Cloudflare Pages Environment Variables
You need to add these environment variables to your Cloudflare Pages dashboard:

```bash
# Navigate to: Cloudflare Dashboard > Pages > djflowerz-site > Settings > Environment Variables

# Copy all environment variables from your local .env.local file
# The values are stored securely in .env.local and should be added manually to Cloudflare Pages

# Required environment variables:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - NEXT_PUBLIC_CLERK_FRONTEND_API
# - CLERK_BACKEND_API
# - CLERK_JWKS_URL
# - NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
# - PAYSTACK_SECRET_KEY
# - NEXT_PUBLIC_PAYSTACK_CALLBACK_URL
# - PAYSTACK_WEBHOOK_URL
# - NEON_DATABASE_REST_URL
# - DATABASE_URL
# - NEXT_PUBLIC_APP_URL

# See your local .env.local file for the actual values
```

### 2. Configure Paystack Webhook
1. Go to Paystack Dashboard > Settings > Webhooks
2. Add webhook URL: `https://djflowerz-site.pages.dev/api/paystack/webhook`
3. Select events: `charge.success`
4. Save configuration

### 3. Test Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test build
npm run build
```

### 4. Deploy to Production
```bash
# Commit changes
git add .
git commit -m "chore: update production configuration with live API credentials"

# Push to GitHub (triggers Cloudflare Pages deployment)
git push origin main
```

---

## 🔒 Security Notes

- ✅ All API keys are configured for **LIVE/PRODUCTION** mode
- ✅ `.env.local` is in `.gitignore` (not committed to repository)
- ⚠️ **IMPORTANT:** Configure environment variables in Cloudflare Pages dashboard separately
- ⚠️ Never commit `.env.local` to version control
- ✅ Webhook URLs are configured for production domain

---

## 📞 Support & Resources

- **Clerk Dashboard:** https://dashboard.clerk.com
- **Paystack Dashboard:** https://dashboard.paystack.com
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Neon Console:** https://console.neon.tech

---

**Configuration Complete! ✅**
