# Paystack Webhook Fixes Summary

## Date: 2026-01-26

## Overview
We overhauled the Paystack webhook integration to prevent timeouts and ensure users are properly granted access upon payment.

## Changes

### 1. Checkout Action (`src/actions/checkout.ts`)
- **Issue:** Was not passing `user_id` to Paystack.
- **Fix:** Now retrieves `userId` from `getAuthenticatedUser()` and adds it to transaction metadata.
- **Benefit:** Webhook clearly identifies which user to upgrade.

### 2. Webhook Handler (`src/app/api/paystack/webhook/route.ts`)
- **Issue:** Was waiting for DB updates before returning response, risking timeouts (72h retries).
- **Fix:** 
    - Validates signature first.
    - Returns `200 OK` immediately.
    - Uses `getRequestContext().waitUntil()` to perform DB updates in the background.
    - Added logic to update `users` collection (subscription_status='active').

## Deployment Note
Ensure your Paystack Dashboard is pointing to the **API Route**:
`https://<your-domain>/api/paystack/webhook`

## files Created/Modified
- `src/actions/checkout.ts` (Modified)
- `src/app/api/paystack/webhook/route.ts` (Modified)

