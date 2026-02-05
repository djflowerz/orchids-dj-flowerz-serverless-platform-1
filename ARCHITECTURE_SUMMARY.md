# DJ Flowerz Platform Architecture

## Overview
The DJ Flowerz platform is a **serverless, distributed architecture** using best-in-class services for each component.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                         │
│                  (Frontend Hosting Only)                    │
│                                                             │
│  • Static HTML, CSS, JavaScript                            │
│  • Next.js App Router (Static Generation)                  │
│  • Edge Runtime for API Routes                             │
│  • URL: https://djflowerz-site.pages.dev                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Connects to ↓
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ↓                     ↓                     ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    CLERK     │    │   FIREBASE   │    │   PAYSTACK   │
│ (Auth Only)  │    │  (Backend)   │    │  (Payments)  │
└──────────────┘    └──────────────┘    └──────────────┘
│                   │                   │
│ • User Sign Up    │ • Firestore DB    │ • Payment Init
│ • Login/Logout    │ • Storage         │ • Webhooks
│ • Sessions        │ • Real-time DB    │ • Verification
│ • Profile Mgmt    │ • Data Queries    │
│                   │ • CRUD Ops        │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Component Responsibilities

### 1. **Cloudflare Pages** (Frontend Hosting)
**Role:** Static site hosting and edge computing
**Responsibilities:**
- Serve static HTML, CSS, JavaScript files
- Host Next.js frontend application
- Run Edge Runtime API routes (lightweight serverless functions)
- Global CDN distribution
- SSL/TLS certificates

**Does NOT handle:**
- ❌ Database operations
- ❌ User authentication logic
- ❌ Payment processing
- ❌ Data persistence

**Configuration:**
```bash
# Build Command
npm run pages:build

# Output Directory
.vercel/output/static

# Environment Variables (in Cloudflare Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_PROJECT_ID
# ... other Firebase config
```

---

### 2. **Clerk** (Authentication Service)
**Role:** Complete user authentication and session management
**Responsibilities:**
- User registration (sign up)
- User login (email/password, OAuth)
- Session management
- JWT token generation
- User profile management
- Password reset
- Email verification
- Multi-factor authentication (if enabled)

**Integration Points:**
```typescript
// Frontend: Clerk React Components
import { SignIn, SignUp, UserButton } from '@clerk/nextjs'

// Backend: Clerk API for auth checks
import { auth, currentUser } from '@clerk/nextjs/server'
const { userId } = auth()
const user = await currentUser()
```

**URLs:**
- Frontend API: `https://clerk.djflowerz-site.pages.dev`
- Backend API: `https://api.clerk.com`
- JWKS: `https://clerk.djflowerz-site.pages.dev/.well-known/jwks.json`

---

### 3. **Firebase** (Backend Database)
**Role:** Complete backend data storage and management
**Responsibilities:**
- **Firestore:** NoSQL database for all app data
  - Products, Mixtapes, Orders
  - User data, Subscriptions
  - Comments, Equipment logs
  - System logs, Coupons
- **Storage:** File storage for images, audio, videos
- **Realtime Database:** Real-time data sync (if used)

**Integration:**
```typescript
// Firestore Edge (for API routes)
import { runQueryOnEdge, createDocumentOnEdge, updateDocumentOnEdge } from '@/lib/firestore-edge'

// Client-side Firebase
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc } from 'firebase/firestore'
```

**Collections:**
- `products` - Store products
- `mixtapes` - DJ mixtapes
- `orders` - Customer orders
- `users` - User profiles
- `subscriptions` - Subscription data
- `coupons` - Marketing coupons
- `shipping_zones` - Shipping configuration
- `comments` - User comments
- `equipment` - Equipment logs
- `system_logs` - System activity

---

### 4. **Paystack** (Payment Processing)
**Role:** Complete payment processing and verification
**Responsibilities:**
- Initialize payment transactions
- Process credit/debit card payments
- Handle payment callbacks
- Send payment webhooks
- Transaction verification
- Refunds and disputes

**Integration:**
```typescript
// Initialize Payment
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: user.email,
    amount: amount * 100, // in kobo
    callback_url: 'https://djflowerz-site.pages.dev/payment-success'
  })
})

// Webhook Handler (API Route)
// Receives payment confirmation from Paystack
// Updates order status in Firebase
```

**Webhook URL:**
`https://djflowerz-site.pages.dev/api/paystack/webhook`

---

## Data Flow Examples

### Example 1: User Signup
```
1. User visits /signup
2. Clerk SignUp component renders
3. User enters email/password
4. Clerk creates account (Clerk servers)
5. Clerk sends verification email
6. User verifies email
7. Clerk redirects to homepage
8. Frontend creates user profile in Firebase (optional)
```

### Example 2: Product Purchase
```
1. User adds product to cart (stored in browser state)
2. User clicks "Checkout"
3. Frontend calls Paystack API to initialize payment
4. Paystack returns payment URL
5. User redirected to Paystack payment page
6. User completes payment on Paystack
7. Paystack sends webhook to /api/paystack/webhook
8. API route verifies payment with Paystack
9. API route creates order in Firebase
10. API route updates order status to "paid"
11. User redirected to success page
```

### Example 3: Admin Panel Access
```
1. User visits /admin
2. Clerk middleware checks authentication
3. If not logged in → redirect to /login
4. If logged in → check user email/role
5. If admin (ianmuriithiflowerz@gmail.com) → allow access
6. Admin panel loads data from Firebase
7. Admin makes changes → saved to Firebase
```

---

## Environment Variables

### Cloudflare Pages Dashboard
All environment variables are configured in the Cloudflare Pages dashboard:
`Settings → Environment variables → Production`

```bash
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZGpmbG93ZXJ6LXNpdGUucGFnZXMuZGV2JA
CLERK_SECRET_KEY=sk_live_***

# Paystack (Payments)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_2ed6a5c46ebab203998efd1f5d9c22d2dcc05f71
PAYSTACK_SECRET_KEY=sk_live_ec66162f517e07fb5e2322ec5e5281e2fe3ab74b

# Firebase (Backend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCJ-yumwuCfGwxgjRhyCUIIc50_tcmEwb4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flowpay-401a4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=flowpay-401a4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flowpay-401a4.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=990425156188
NEXT_PUBLIC_FIREBASE_APP_ID=1:990425156188:web:0b95648801bdd2a7d3f499

# Firebase Service Account (Base64 encoded)
FIREBASE_SERVICE_ACCOUNT_B64=***
```

---

## Security Model

### Authentication Flow
1. **Clerk** handles all authentication
2. Clerk issues JWT tokens
3. Frontend includes JWT in API requests
4. API routes verify JWT with Clerk
5. If valid → allow access to Firebase data

### Admin Protection
```typescript
// API Route Protection
const { userId } = auth()
const user = await currentUser()
const isAdmin = user.emailAddresses[0]?.emailAddress === 'ianmuriithiflowerz@gmail.com'
if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

### Payment Security
1. Paystack handles all payment data (PCI compliant)
2. Webhook signature verification
3. Transaction verification before order creation
4. No credit card data stored in Firebase

---

## Deployment Workflow

### 1. Local Development
```bash
npm run dev  # Runs on localhost:3000
```

### 2. Build for Production
```bash
npm run pages:build  # Builds for Cloudflare Pages
```

### 3. Deploy to Cloudflare
```bash
# Option A: Git Push (Automatic)
git push origin main
# Cloudflare automatically builds and deploys

# Option B: Manual Deploy
./deploy-now.sh
# Builds locally and uploads to Cloudflare
```

---

## Summary

✅ **Cloudflare Pages:** Frontend hosting ONLY
✅ **Clerk:** Authentication service (sign up, login, sessions)
✅ **Firebase:** Backend database (all data storage)
✅ **Paystack:** Payment processing

This architecture provides:
- **Scalability:** Each service scales independently
- **Security:** Best-in-class security for each component
- **Performance:** Global CDN + edge computing
- **Cost-effective:** Pay only for what you use
- **Maintainability:** Clear separation of concerns
