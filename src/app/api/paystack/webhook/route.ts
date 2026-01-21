import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK

        // In a production app, verify the x-paystack-signature header here using HMAC SHA512
        // const signature = req.headers.get('x-paystack-signature')

        console.log('[Paystack Webhook] Event received:', body.event)

        // Process event 'charge.success'
        if (body.event === 'charge.success') {
            console.log('[Paystack Webhook] Payment Successful for Reference:', body.data.reference)
            // Add database update logic here if needed
        }

        return NextResponse.json({ status: 'success', message: 'Webhook received' }, { status: 200 })
    } catch (error) {
        console.error('[Paystack Webhook] Error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}
