import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, items, reference, currency, product_id, email } = body

    if (!items && !product_id) {
      return NextResponse.json(
        { success: false, error: 'Items or product_id required' },
        { status: 400 }
      )
    }

    if (product_id) {
      const productDoc = await adminDb.collection('products').doc(product_id).get()

      if (!productDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }

      const product = productDoc.data() as any
      const orderRef = `ORD-${Date.now()}`

      const orderDocRef = await adminDb.collection('orders').add({
        user_id: user_id || null,
        product_id,
        total_amount: product.price,
        currency: currency || 'KES',
        status: 'pending',
        reference: reference || orderRef,
        email: email || null,
        order_type: 'digital_product',
        createdAt: new Date().toISOString()
      })

      const orderDoc = await orderDocRef.get()
      const order = { id: orderDoc.id, ...orderDoc.data() }

      await adminDb.collection('transactions').add({
        user_id: user_id || null,
        product_id,
        type: 'product_purchase',
        amount: product.price,
        currency: currency || 'KES',
        status: 'pending',
        transaction_reference: reference,
        notes: `Purchase: ${product.title}`,
        createdAt: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        order,
        reference: (order as any).reference
      })
    }

    const batch = adminDb.batch()
    const orderIds: string[] = []

    for (const item of items) {
      const orderRef = adminDb.collection('orders').doc()
      batch.set(orderRef, {
        user_id,
        mixtape_id: item.mixtape_id || null,
        product_id: item.product_id || null,
        total_amount: item.amount,
        currency: currency || 'KES',
        status: 'pending',
        reference,
        createdAt: new Date().toISOString()
      })
      orderIds.push(orderRef.id)
    }

    await batch.commit()

    const orders = await Promise.all(
      orderIds.map(async (id) => {
        const doc = await adminDb.collection('orders').doc(id).get()
        return { id: doc.id, ...doc.data() }
      })
    )

    return NextResponse.json({
      success: true,
      orders,
      reference
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
