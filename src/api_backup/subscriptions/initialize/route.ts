import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, tier, amount, duration } = body

    if (!email || !tier || !amount || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const reference = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + duration)

    await adminDb.collection('payments').doc(reference).set({
      user_email: email,
      amount,
      currency: 'KES',
      payment_ref: reference,
      payment_type: 'subscription',
      status: 'pending',
      metadata: { tier, duration },
      createdAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      reference,
      amount,
      tier,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Subscription initialization error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize subscription' },
      { status: 500 }
    )
  }
}
