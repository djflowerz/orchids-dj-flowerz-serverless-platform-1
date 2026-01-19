import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!botToken || !chatId) return

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch (error) {
    console.error('Telegram notification error:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Missing reference' },
        { status: 400 }
      )
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    const paymentDoc = await adminDb.collection('payments').doc(reference).get()

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    const payment = { id: paymentDoc.id, ...paymentDoc.data() } as any

    if (payment.status === 'success') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    await adminDb.collection('payments').doc(reference).update({
      status: 'success',
      paystack_ref: paystackData.data.reference,
      updatedAt: new Date().toISOString()
    })

    const metadata = payment.metadata as { tier?: string; duration?: number }
    const tier = metadata?.tier || '1_month'
    const duration = metadata?.duration || 30

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + duration)

    const subsRef = adminDb.collection('subscriptions')
    const existingSubQuery = await subsRef
      .where('user_email', '==', payment.user_email)
      .where('status', '==', 'active')
      .get()

    if (!existingSubQuery.empty) {
      const subDoc = existingSubQuery.docs[0]
      const currentExpiry = new Date(subDoc.data().expires_at)
      const newExpiry = currentExpiry > new Date() 
        ? new Date(currentExpiry.getTime() + duration * 24 * 60 * 60 * 1000)
        : expiresAt

      await subDoc.ref.update({
        tier,
        amount: payment.amount,
        expires_at: newExpiry.toISOString(),
        payment_ref: reference,
        updated_at: new Date().toISOString()
      })
    } else {
      await subsRef.add({
        user_email: payment.user_email,
        tier,
        status: 'active',
        amount: payment.amount,
        currency: 'KES',
        expires_at: expiresAt.toISOString(),
        payment_ref: reference,
        created_at: new Date().toISOString()
      })
    }

    const amount = paystackData.data.amount / 100
    await sendTelegramNotification(
      `👑 <b>New Subscription!</b>\n\nEmail: ${payment.user_email}\nTier: ${tier}\nAmount: KSh ${amount.toLocaleString()}\nExpires: ${expiresAt.toLocaleDateString()}\nRef: ${reference}`
    )

    return NextResponse.json({ 
      success: true,
      subscription: {
        tier,
        expiresAt: expiresAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Subscription verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
