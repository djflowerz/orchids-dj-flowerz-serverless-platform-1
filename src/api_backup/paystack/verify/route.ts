import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference is required' },
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

    const ordersSnapshot = await adminDb.collection('orders')
      .where('reference', '==', reference)
      .limit(1)
      .get()

    if (ordersSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderDoc = ordersSnapshot.docs[0]
    const order = { id: orderDoc.id, ...orderDoc.data() } as any

    if (order.status === 'success') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    await orderDoc.ref.update({
      status: 'success',
      updatedAt: new Date().toISOString()
    })

    if (order.mixtape_id) {
      const purchaseId = `${order.user_id}_${order.mixtape_id}`.replace(/[^a-zA-Z0-9]/g, '_')
      await adminDb.collection('user_purchases').doc(purchaseId).set({
        user_id: order.user_id,
        mixtape_id: order.mixtape_id,
        payment_id: order.id,
        createdAt: new Date().toISOString()
      })
      
      const mixtapeRef = adminDb.collection('mixtapes').doc(order.mixtape_id)
      const mixtapeDoc = await mixtapeRef.get()
      if (mixtapeDoc.exists) {
        await mixtapeRef.update({
          download_count: (mixtapeDoc.data()?.download_count || 0) + 1
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      order_id: order.id,
      mixtape_id: order.mixtape_id
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
