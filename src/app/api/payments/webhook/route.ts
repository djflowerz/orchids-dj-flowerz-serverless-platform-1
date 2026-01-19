import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import crypto from 'crypto'

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
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const { reference, amount, customer } = event.data

      const paymentDoc = await adminDb.collection('payments').doc(reference).get()

      if (paymentDoc.exists) {
        const payment = paymentDoc.data()
        if (payment?.status !== 'success') {
          await adminDb.collection('payments').doc(reference).update({
            status: 'success',
            paystack_ref: reference,
            updatedAt: new Date().toISOString()
          })

          await sendTelegramNotification(
            `💰 <b>Payment Webhook</b>\n\nEmail: ${customer.email}\nAmount: KSh ${(amount / 100).toLocaleString()}\nRef: ${reference}`
          )
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
