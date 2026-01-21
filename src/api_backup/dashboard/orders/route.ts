import { NextResponse } from 'next/server'
import { getCurrentUser, getServerFirestore } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getServerFirestore()
    if (!db) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const ordersSnapshot = await db.collection('orders')
      .where('user_id', '==', user.id)
      .orderBy('created_at', 'desc')
      .get()

    const orders = await Promise.all(ordersSnapshot.docs.map(async (doc) => {
      const orderData = doc.data()
      let product = null
      
      if (orderData.product_id) {
        const productDoc = await db.collection('products').doc(orderData.product_id).get()
        if (productDoc.exists) {
          const pData = productDoc.data()
          product = {
            id: productDoc.id,
            title: pData?.title,
            type: pData?.type,
            image_url: pData?.image_url
          }
        }
      }

      return {
        id: doc.id,
        ...orderData,
        product
      }
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Dashboard orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
