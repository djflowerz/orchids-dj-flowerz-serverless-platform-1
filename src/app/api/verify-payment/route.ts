
import { NextResponse } from 'next/server'
import { updateDocumentOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { reference, orderId, expectedAmount } = await req.json()
        const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK

        if (!secretKey) {
            console.error('PAYSTACK_SECRET_KEY is missing in environment variables')
            return NextResponse.json({ error: 'Server configuration error: Missing Secret Key' }, { status: 500 })
        }

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!data.status) {
            return NextResponse.json({ error: 'Verification failed from Paystack', details: data.message }, { status: 400 })
        }

        const paidAmount = data.data.amount

        if (expectedAmount && paidAmount !== expectedAmount) {
            return NextResponse.json({
                verified: false,
                message: 'Amount mismatch',
                expected: expectedAmount,
                paid: paidAmount
            }, { status: 400 })
        }

        // Identify the order
        const targetOrderId = orderId || reference

        // Update the order in Firestore
        try {
            const updatedOrder = await updateDocumentOnEdge('orders', targetOrderId, {
                status: 'PROCESSING',
                isPaid: true,
                paymentMethod: 'PAYSTACK'
            })

            console.log(`Order ${targetOrderId} verified and updated`, updatedOrder)
            return NextResponse.json({ verified: true, data: data.data })
        } catch (error) {
            console.error('Error updating order status in Firestore:', error)
            return NextResponse.json({ error: 'Payment verified but failed to update order status' }, { status: 500 })
        }

    } catch (error) {
        console.error('Verification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
