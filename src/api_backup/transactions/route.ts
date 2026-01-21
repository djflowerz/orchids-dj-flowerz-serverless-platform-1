import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query: FirebaseFirestore.Query = adminDb.collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(limit)

    if (type) query = query.where('type', '==', type)
    if (status) query = query.where('status', '==', status)

    const snapshot = await query.get()
    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    if (startDate) {
      data = data.filter((t: any) => new Date(t.createdAt) >= new Date(startDate))
    }
    if (endDate) {
      data = data.filter((t: any) => new Date(t.createdAt) <= new Date(endDate))
    }

    const totals = {
      total: data?.reduce((sum, t: any) => sum + (t.amount || 0), 0) || 0,
      tips: data?.filter((t: any) => t.type === 'tip').reduce((sum, t: any) => sum + (t.amount || 0), 0) || 0,
      bookings: data?.filter((t: any) => t.type === 'booking').reduce((sum, t: any) => sum + (t.amount || 0), 0) || 0,
      products: data?.filter((t: any) => t.type === 'product_purchase').reduce((sum, t: any) => sum + (t.amount || 0), 0) || 0,
      subscriptions: data?.filter((t: any) => t.type === 'subscription').reduce((sum, t: any) => sum + (t.amount || 0), 0) || 0,
      completed: data?.filter((t: any) => t.status === 'completed').reduce((sum, t: any) => sum + (t.amount || 0), 0) || 0,
    }

    return NextResponse.json({
      success: true,
      transactions: data,
      totals
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id,
      booking_id,
      product_id,
      type,
      amount,
      currency = 'KES',
      payment_method,
      transaction_reference,
      notes
    } = body

    if (!type || !amount) {
      return NextResponse.json(
        { success: false, error: 'Type and amount are required' },
        { status: 400 }
      )
    }

    const docRef = await adminDb.collection('transactions').add({
      user_id: user_id || null,
      booking_id: booking_id || null,
      product_id: product_id || null,
      type,
      amount,
      currency,
      payment_method: payment_method || null,
      transaction_reference: transaction_reference || null,
      notes: notes || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    const doc = await docRef.get()

    return NextResponse.json({
      success: true,
      transaction: { id: doc.id, ...doc.data() }
    })
  } catch (error) {
    console.error('Transaction creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
