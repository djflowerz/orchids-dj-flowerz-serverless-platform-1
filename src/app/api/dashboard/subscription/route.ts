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

    const subsSnapshot = await db.collection('subscriptions')
      .where('user_id', '==', user.id)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()

    if (subsSnapshot.empty) {
      return NextResponse.json({ subscription: null })
    }

    const subscription = {
      id: subsSnapshot.docs[0].id,
      ...subsSnapshot.docs[0].data()
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Dashboard subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
