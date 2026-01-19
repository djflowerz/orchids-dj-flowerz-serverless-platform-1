import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, items, paymentType } = body

    const reference = `DJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await adminDb.collection('payments').doc(reference).set({
      user_email: email,
      amount,
      currency: 'KES',
      payment_ref: reference,
      payment_type: paymentType || 'product',
      status: 'pending',
      metadata: { 
        items: items || null 
      },
      createdAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      reference,
      amount
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
