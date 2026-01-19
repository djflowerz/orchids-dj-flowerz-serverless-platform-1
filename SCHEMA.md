# Database Schema (Firebase/Firestore)

## Collections

### users
```
{
  id: string (Firebase Auth UID)
  name: string
  email: string
  role: 'user' | 'subscriber' | 'staff' | 'admin'
  subscription_status: 'active' | 'inactive' | 'expired'
  subscription_tier: 'basic' | 'pro' | 'unlimited' | null
  account_status: 'active' | 'suspended' | 'unverified'
  telegram_user_id: string | null
  telegram_username: string | null
  created_at: ISO timestamp
  last_login: ISO timestamp
}
```

### products
```
{
  id: string (auto-generated)
  title: string
  description: string
  price: number (KES)
  type: 'digital' | 'physical'
  version: string (for digital only, e.g., "1.0.0")
  stock: number (for physical only)
  sku: string (for physical only)
  deliveryStatus: string (for physical only)
  status: 'active' | 'inactive'
  downloads: number
  created_at: ISO timestamp
}
```

### mixtapes
```
{
  id: string (auto-generated)
  title: string
  description: string
  coverImage: string (Firebase Storage URL)
  mixLink: string (external URL: YouTube, Audiomack, Mixcloud, etc.)
  genre: string
  price: number (KES)
  isFree: boolean
  plays: number
  status: 'active' | 'inactive'
  created_at: ISO timestamp
}
```

### music_pool
```
{
  id: string (auto-generated)
  title: string
  artist: string
  genre: string
  bpm: number
  trackLink: string (external URL)
  coverImage: string (Firebase Storage URL)
  tier: 'basic' | 'pro' | 'unlimited'
  downloads: number
  created_at: ISO timestamp
}
```

### subscriptions
```
{
  id: string (auto-generated)
  user_id: string (references users.id)
  user_email: string
  tier: 'basic' | 'pro' | 'unlimited'
  status: 'active' | 'expired' | 'cancelled'
  start_date: ISO timestamp
  end_date: ISO timestamp
  telegram_channels: string[] (channel IDs user has access to)
  created_at: ISO timestamp
}
```

### bookings
```
{
  id: string (auto-generated)
  customer_name: string
  email: string
  phone: string
  event_type: string
  event_date: ISO date
  event_time: string
  location: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  amount: number (KES)
  notes: string
  assigned_dj: string | null
  created_at: ISO timestamp
}
```

### transactions
```
{
  id: string (auto-generated)
  user_id: string (references users.id)
  user_email: string
  amount: number (KES)
  type: 'purchase' | 'subscription' | 'booking' | 'tip'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference: string (payment gateway reference)
  payment_method: 'paystack' | 'mpesa'
  created_at: ISO timestamp
}
```

### tips
```
{
  id: string (auto-generated)
  donor_name: string
  donor_email: string
  amount: number (KES)
  message: string
  source: 'website' | 'telegram'
  created_at: ISO timestamp
}
```

### orders
```
{
  id: string (auto-generated)
  user_id: string (references users.id)
  user_email: string
  items: [
    {
      product_id: string
      title: string
      quantity: number
      price: number
    }
  ]
  total: number (KES)
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shipping_address: string (for physical products)
  tracking_number: string (for physical products)
  created_at: ISO timestamp
}
```

### settings (single document: "site")
```
{
  maintenanceMode: boolean
  paystackPublicKey: string
  paystackSecretKey: string
  mpesaConsumerKey: string
  mpesaConsumerSecret: string
  telegramBotToken: string
  telegramChannels: [
    {
      id: string
      name: string
      chatId: string
      tier: 'basic' | 'pro' | 'unlimited'
    }
  ]
  autoSyncEnabled: boolean
}
```

---

## Firebase Storage Structure

```
/covers/
  /covers/mixtapes/{timestamp}_{filename}
  /covers/music_pool/{timestamp}_{filename}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId) || isAdmin();
    }

    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /mixtapes/{mixtapeId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /music_pool/{trackId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /subscriptions/{subId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /transactions/{txId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /tips/{tipId} {
      allow read: if isAdmin();
      allow write: if true;
    }

    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /covers/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null 
        && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

---

## Indexes Required

Create these composite indexes in Firebase Console:

1. **users** - `created_at` (descending)
2. **products** - `created_at` (descending)
3. **mixtapes** - `created_at` (descending)
4. **music_pool** - `created_at` (descending)
5. **subscriptions** - `created_at` (descending)
6. **bookings** - `created_at` (descending)
7. **transactions** - `created_at` (descending)
8. **tips** - `created_at` (descending)
9. **orders** - `created_at` (descending)
