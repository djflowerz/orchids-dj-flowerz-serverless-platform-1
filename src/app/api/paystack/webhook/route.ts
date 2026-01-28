import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequestContext } from '@cloudflare/next-on-pages'

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

        // Convert hex signature to Uint8Array safely
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
        const { reference, id, amount, customer } = eventData.data
        console.log(`[Paystack Webhook] Processing payment success for reference: ${reference}`)

        try {
            const metadata = eventData.data.metadata || {}
            const type = metadata.type || 'product'

            // Data for transaction record
            const transactionData = {
                reference: reference,
                type: type,
                status: 'success', // Paystack charge.success means success
                amount: amount || 0,
                email: customer?.email || '',
                metadata: metadata,
                paymentMethod: 'PAYSTACK'
            }

            if (type === 'booking') {
                const bookingId = metadata.booking_id

                await prisma.recordingBooking.update({
                    where: { id: bookingId },
                    data: {
                        isPaid: true,
                        status: 'CONFIRMED',
                        paymentReference: reference
                    }
                })

                // Create Transaction linked to Booking
                await prisma.transaction.create({
                    data: {
                        ...transactionData,
                        bookingId: bookingId,
                        ...(metadata.user_id ? { userId: metadata.user_id } : {})
                    }
                })

                console.log(`[Paystack Webhook] ✅ Booking ${bookingId} CONFIRMED & Transaction Saved`)

            } else if (type === 'subscription') {
                const userId = metadata.user_id

                if (userId) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            subscription_status: 'active',
                            subscription_tier: 'unlimited',
                            subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                            updatedAt: new Date()
                        }
                    })

                    // Create Transaction linked to User
                    await prisma.transaction.create({
                        data: {
                            ...transactionData,
                            userId: userId
                        }
                    })

                    console.log(`[Paystack Webhook] ✅ User ${userId} subscription activated & Transaction Saved`)
                } else {
                    console.warn(`[Paystack Webhook] ⚠️ Subscription paid but no user_id found in metadata`)
                    // Create unlinked transaction
                    await prisma.transaction.create({
                        data: transactionData
                    })
                }

            } else {
                // Product Order
                const orderId = metadata.order_id || reference

                try {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: 'PROCESSING',
                            isPaid: true,
                            paymentMethod: 'PAYSTACK'
                        }
                    })
                    console.log(`[Paystack Webhook] ✅ Order ${orderId} marked as PAID`)

                    // Create Transaction linked to Order
                    await prisma.transaction.create({
                        data: {
                            ...transactionData,
                            orderId: orderId,
                            ...(metadata.user_id ? { userId: metadata.user_id } : {})
                        }
                    })

                } catch (orderError) {
                    console.error(`[Paystack Webhook] Failed to update order ${orderId}:`, orderError)
                    // Fallback: Just save transaction
                    await prisma.transaction.create({
                        data: transactionData
                    })
                }
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

        // Try to get secret from process.env (Node/Next compatibility) or Cloudflare env if applicable
        // With next-on-pages, process.env is typically populated
        const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK

        if (!secret) {
            console.error('[Paystack Webhook] critical: PAYSTACK_SECRET_KEY is missing')
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
        }

        if (!signature) {
            console.warn('[Paystack Webhook] Missing signature header')
            return NextResponse.json({ error: 'No signature provided' }, { status: 401 })
        }

        const isValid = await verifySignature(body, signature, secret)
        if (!isValid) {
            console.error('[Paystack Webhook] Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // Signature valid! Return 200 OK immediately per Paystack guidelines
        const eventData = JSON.parse(body)

        // Use Cloudflare's waitUntil to keep the lambda alive for background processing
        try {
            const { ctx } = getRequestContext()
            if (ctx && typeof ctx.waitUntil === 'function') {
                ctx.waitUntil(processEvent(eventData))
            } else {
                // Fallback if ctx is not available/mocked correctly
                console.warn('[Paystack Webhook] ctx.waitUntil not found, running inline (risk of timeout)')
                await processEvent(eventData)
            }
        } catch (e) {
            // Fallback for environments where getRequestContext might fail (e.g. local dev without wrangler)
            console.warn('[Paystack Webhook] getRequestContext failed (likely local dev), awaiting handler directly.')
            await processEvent(eventData)
        }

        return NextResponse.json({ status: 'success' }, { status: 200 })

    } catch (error) {
        console.error('[Paystack Webhook] Request processing error:', error)
        return NextResponse.json({
            error: 'Webhook request failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
