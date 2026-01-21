import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { code, amount } = await request.json()

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Promo code is required' })
    }

    const snapshot = await adminDb.collection('promo_codes')
      .where('code', '==', code.toUpperCase())
      .where('is_active', '==', true)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code' })
    }

    const promo = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any

    const now = new Date()
    
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return NextResponse.json({ valid: false, error: 'This promo code is not yet active' })
    }

    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return NextResponse.json({ valid: false, error: 'This promo code has expired' })
    }

    if (promo.max_uses && promo.use_count >= promo.max_uses) {
      return NextResponse.json({ valid: false, error: 'This promo code has reached its usage limit' })
    }

    if (promo.min_order_amount && amount < promo.min_order_amount * 100) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum order amount is KSh ${promo.min_order_amount}` 
      })
    }

    return NextResponse.json({
      valid: true,
      type: promo.discount_type || 'percentage',
      discount: promo.discount_value || promo.discount_percentage || 0,
      code: promo.code
    })
  } catch (error) {
    console.error('Promo validation error:', error)
    return NextResponse.json({ valid: false, error: 'Failed to validate promo code' })
  }
}
