import { NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs' // Changed from 'edge' to 'nodejs' for Admin SDK compatibility

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
    let serviceAccount

    // Try base64-encoded key first
    const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
    if (serviceAccountB64) {
        const decoded = Buffer.from(serviceAccountB64, 'base64').toString('utf-8')
        serviceAccount = JSON.parse(decoded)
    } else {
        // Fall back to regular JSON key
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        if (serviceAccountKey) {
            serviceAccount = JSON.parse(serviceAccountKey)
        }
    }

    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        })
    } else {
        console.error('[Paystack Webhook] No Firebase service account configured')
    }
}

// Helper function to verify Paystack signature
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
    const crypto = require('crypto')
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
    return hash === signature
}

export async function POST(req: Request) {
    try {
        const body = await req.text()
        const signature = req.headers.get('x-paystack-signature')
        const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK

        if (!secret) {
            console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY is missing')
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
        }

        if (!signature) {
            console.error('[Paystack Webhook] No signature provided')
            return NextResponse.json({ error: 'No signature provided' }, { status: 401 })
        }

        // Verify signature
        const isValid = await verifySignature(body, signature, secret)

        if (!isValid) {
            console.error('[Paystack Webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const eventData = JSON.parse(body)
        console.log('[Paystack Webhook] Event received:', eventData.event)

        // Handle charge.success event
        if (eventData.event === 'charge.success') {
            const { reference, id, amount, customer } = eventData.data
            console.log(`[Paystack Webhook] Processing payment success for reference: ${reference}`)

            try {
                const db = getFirestore()
                const orderRef = db.collection('orders').doc(reference)

                // Update order status
                await orderRef.update({
                    status: 'paid',
                    payment_status: 'success',
                    transaction_id: id?.toString() || '',
                    paid_at: new Date().toISOString(),
                    verified_amount: amount || 0,
                    customer_email: customer?.email || '',
                    updated_at: new Date().toISOString()
                })

                console.log(`[Paystack Webhook] ✅ Order ${reference} marked as PAID`)

                // Create transaction record
                await db.collection('transactions').add({
                    order_id: reference,
                    user_email: customer?.email || '',
                    amount: amount || 0,
                    type: 'digital', // or determine from order
                    status: 'completed',
                    reference: reference,
                    transaction_id: id?.toString() || '',
                    payment_method: 'paystack',
                    created_at: new Date().toISOString()
                })

                console.log(`[Paystack Webhook] ✅ Transaction record created for ${reference}`)

            } catch (err) {
                console.error('[Paystack Webhook] Error updating order:', err)
                return NextResponse.json({
                    status: 'error',
                    message: err instanceof Error ? err.message : 'Unknown error'
                }, { status: 500 })
            }
        }

        return NextResponse.json({ status: 'success' }, { status: 200 })

    } catch (error) {
        console.error('[Paystack Webhook] Error:', error)
        return NextResponse.json({
            error: 'Webhook handler failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
