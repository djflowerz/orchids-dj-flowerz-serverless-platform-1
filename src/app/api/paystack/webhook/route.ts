
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { updateDocumentOnEdge, createDocumentOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

// Helper function to verify Paystack signature
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
    try {
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secret)
        const msgData = encoder.encode(body)

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['verify']
        )

        if (!signature || signature.length % 2 !== 0) return false
        const signatureBytes = new Uint8Array(signature.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16)))

        return await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes,
            msgData
        )
    } catch (err) {
        console.error('[Paystack Webhook] Signature verification internal error:', err)
        return false
    }
}

async function processEvent(eventData: any) {
    console.log('[Paystack Webhook] Background processing event:', eventData.event)

    if (eventData.event === 'charge.success') {
        const { reference, amount, customer } = eventData.data
        console.log(`[Paystack Webhook] Processing payment success for reference: ${reference}`)

        try {
            const metadata = eventData.data.metadata || {}
            const type = metadata.type || 'product'

            const transactionData = {
                reference: reference,
                type: type,
                status: 'success',
                amount: amount || 0,
                email: customer?.email || '',
                metadata: metadata,
                paymentMethod: 'PAYSTACK',
                createdAt: new Date()
            }

            if (type === 'booking') {
                const bookingId = metadata.booking_id
                await updateDocumentOnEdge('recording_bookings', bookingId, {
                    is_paid: true,
                    status: 'CONFIRMED',
                    payment_reference: reference,
                    payment_method: 'PAYSTACK'
                })

                await createDocumentOnEdge('transactions', {
                    ...transactionData,
                    bookingId
                })
                console.log(`[Paystack Webhook] ✅ Booking ${bookingId} CONFIRMED & Transaction Saved`)

            } else if (type === 'subscription') {
                const userId = metadata.user_id
                if (userId) {
                    // Update user subscription status
                    await updateDocumentOnEdge('users', userId, {
                        subscription_status: 'active',
                        subscription_tier: 'unlimited',
                        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        updatedAt: new Date()
                    })

                    await createDocumentOnEdge('transactions', {
                        ...transactionData,
                        userId
                    })
                    console.log(`[Paystack Webhook] ✅ User ${userId} subscription activated & Transaction Saved`)
                } else {
                    await createDocumentOnEdge('transactions', transactionData)
                }

            } else {
                // Product Order
                const orderId = metadata.order_id || reference  // fallback to reference if order_id missing, though order update might fail if IDs don't match

                // If orderId is same as reference (unlikely for existing orders), it might just be a direct transaction
                // Assuming orderId IS passed in metadata correctly.

                if (metadata.order_id) {
                    try {
                        await updateDocumentOnEdge('orders', orderId, {
                            status: 'PROCESSING',
                            isPaid: true,
                            paymentMethod: 'PAYSTACK'
                        })
                        console.log(`[Paystack Webhook] ✅ Order ${orderId} marked as PAID`)
                    } catch (e) {
                        console.error(`[Paystack Webhook] Failed to update order ${orderId}`, e)
                        // continue to create transaction
                    }
                }

                await createDocumentOnEdge('transactions', {
                    ...transactionData,
                    orderId: metadata.order_id || null,
                    userId: metadata.user_id || null
                })
            }

        } catch (err) {
            console.error('[Paystack Webhook] Error updating records:', err)
        }
    }
}


export async function POST(req: Request) {
    try {
        const body = await req.text()
        const signature = req.headers.get('x-paystack-signature')
        const secret = process.env.PAYSTACK_SECRET_KEY

        if (!secret) {
            console.error('[Paystack Webhook] critical: PAYSTACK_SECRET_KEY is missing')
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
        }

        if (!signature) {
            return NextResponse.json({ error: 'No signature provided' }, { status: 401 })
        }

        const isValid = await verifySignature(body, signature, secret)
        if (!isValid) {
            console.error('[Paystack Webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const eventData = JSON.parse(body)

        try {
            const { ctx } = getRequestContext()
            if (ctx && typeof ctx.waitUntil === 'function') {
                ctx.waitUntil(processEvent(eventData))
            } else {
                await processEvent(eventData)
            }
        } catch (e) {
            // Local fallback
            await processEvent(eventData)
        }

        return NextResponse.json({ status: 'success' }, { status: 200 })

    } catch (error) {
        console.error('[Paystack Webhook] Request processing error:', error)
        return NextResponse.json({ error: 'Webhook request failed' }, { status: 500 })
    }
}
