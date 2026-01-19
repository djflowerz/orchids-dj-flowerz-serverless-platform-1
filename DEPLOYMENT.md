# DJ FLOWERZ Platform

A complete DJ platform with mixtapes, store, music pool, and Telegram integration.

## Features

- **Mixtapes**: Free and paid mixtapes with audio streaming
- **Store**: Digital and physical products with Paystack checkout
- **Music Pool**: Subscription-based exclusive content for DJs
- **Tip Jar**: One-time donations via Paystack
- **Admin Dashboard**: Manage users, products, mixtapes
- **Telegram Bot**: Subscription management and notifications

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Payments**: Paystack
- **Notifications**: Telegram Bot API

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx

TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id
```

## Deployment

### Frontend (Cloudflare Pages)

1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variables in Cloudflare dashboard

### Telegram Bot

1. Install dependencies: `npm install telegraf`
2. Run bot: `node telegram-bot.js`
3. Or deploy to a server/serverless function

## Paystack Webhook

Set your webhook URL to: `https://yourdomain.com/api/payments/webhook`

## Database Schema

Tables:
- `users` - User accounts with subscription status
- `products` - Digital and physical products
- `mixtapes` - Music mixtapes
- `music_pool` - Exclusive DJ tracks
- `payments` - Payment records
- `user_purchases` - User purchase history
- `settings` - Platform configuration

## Admin Access

To make a user an admin:
1. Sign up/login with the user account
2. In Supabase, update the user's `role` to `admin`
3. Access `/admin` route
