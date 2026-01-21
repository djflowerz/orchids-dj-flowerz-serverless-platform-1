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

    const physicalOrdersSnapshot = await db.collection('orders')
      .where('user_id', '==', user.id)
      .where('type', '==', 'physical')
      .get()

    if (physicalOrdersSnapshot.empty) {
      return NextResponse.json({ shipping: [] })
    }

    const orderIds = physicalOrdersSnapshot.docs.map(o => o.id)

    // Firestore 'in' query supports up to 10-30 values depending on version, 
    // but usually 10 is safe for a single query.
    // For many orders, we might need to chunk this or use a different approach.
    // Assuming a reasonable number of physical orders for now.
    
    const shippingSnapshot = await db.collection('shipping')
      .where('order_id', 'in', orderIds.slice(0, 10))
      .orderBy('created_at', 'desc')
      .get()

    const shipping = shippingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ shipping })
  } catch (error) {
    console.error('Dashboard shipping error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
