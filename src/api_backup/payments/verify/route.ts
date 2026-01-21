import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

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
      paystack_reference: paystackData.data.reference,
      updatedAt: FieldValue.serverTimestamp()
    })

    const metadata = payment.metadata as { items?: Array<{ id: string; type: string; quantity: number }> }
    const items = metadata?.items || []

    for (const item of items) {
      if (item.type === 'product') {
        const purchaseId = `${payment.user_email}_${item.id}`.replace(/[^a-zA-Z0-9]/g, '_')
        await adminDb.collection('user_purchases').doc(purchaseId).set({
          user_email: payment.user_email,
          product_id: item.id,
          payment_id: payment.id,
          createdAt: FieldValue.serverTimestamp()
        })

        const productRef = adminDb.collection('products').doc(item.id)
        const productDoc = await productRef.get()
        const product = productDoc.data()

        // Grant digital product access
        if (product?.product_type === 'digital') {
          // Find user by email
          const usersSnapshot = await adminDb.collection('users')
            .where('email', '==', payment.user_email)
            .limit(1)
            .get()

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0]
            const userData = userDoc.data()
            const existingAccess = userData.productsAccess || []

            // Check if user already has access to this product
            const hasAccess = existingAccess.some((p: any) => p.productId === item.id)

            if (!hasAccess) {
              // Grant new access with 1 download
              const newAccess = {
                productId: item.id,
                productTitle: product.title,
                downloadsRemaining: 1,
                paidAt: FieldValue.serverTimestamp(),
                paymentReference: reference,
                expiresAt: null // Set if subscription-based
              }

              await userDoc.ref.update({
                productsAccess: [...existingAccess, newAccess]
              })
            } else {
              // User repurchased - add another download
              const updatedAccess = existingAccess.map((p: any) =>
                p.productId === item.id
                  ? { ...p, downloadsRemaining: (p.downloadsRemaining || 0) + 1, lastPurchasedAt: FieldValue.serverTimestamp() }
                  : p
              )

              await userDoc.ref.update({
                productsAccess: updatedAccess
              })
            }
          }
        }

        // Handle physical product stock
        if (product?.product_type === 'physical' && (product.stock_quantity || 0) > 0) {
          const newStock = Math.max(0, (product.stock_quantity || 0) - (item.quantity || 1))
          await productRef.update({ stock_quantity: newStock })

          if (newStock <= 5) {
            await sendTelegramNotification(
              `⚠️ <b>Low Stock Alert</b>\n\nProduct: ${product.title}\nRemaining: ${newStock} units`
            )
          }
        }
      } else if (item.type === 'mixtape') {
        const purchaseId = `${payment.user_email}_${item.id}`.replace(/[^a-zA-Z0-9]/g, '_')
        await adminDb.collection('user_purchases').doc(purchaseId).set({
          user_email: payment.user_email,
          mixtape_id: item.id,
          payment_id: payment.id,
          createdAt: FieldValue.serverTimestamp()
        })

        // Increment download count
        const mixtapeRef = adminDb.collection('mixtapes').doc(item.id)
        const mixtapeDoc = await mixtapeRef.get()
        if (mixtapeDoc.exists) {
          await mixtapeRef.update({
            download_count: (mixtapeDoc.data()?.download_count || 0) + 1
          })
        }
      }
    }

    const amount = paystackData.data.amount / 100

    // Log in transactions table
    await adminDb.collection('transactions').add({
      user_id: payment.user_id || null,
      user_email: payment.user_email,
      type: payment.payment_type || 'purchase',
      amount: amount,
      currency: 'KES',
      payment_method: paystackData.data.channel,
      transaction_reference: reference,
      status: 'completed',
      notes: `Payment for ${payment.payment_type || 'purchase'}`,
      createdAt: FieldValue.serverTimestamp()
    })

    await sendTelegramNotification(
      `💰 <b>New Purchase!</b>\n\nEmail: ${payment.user_email}\nAmount: KSh ${amount.toLocaleString()}\nType: ${payment.payment_type}\nRef: ${reference}`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
