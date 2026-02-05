import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    // Query for the coupon by code (case-insensitive)
    const couponsRef = collection(db, 'coupons')
    const q = query(couponsRef, where('code', '==', code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      )
    }

    const couponDoc = snapshot.docs[0]
    const coupon = couponDoc.data()

    // Check if coupon is active
    if (coupon.status !== 'active') {
      return NextResponse.json(
        { error: 'This coupon is no longer active' },
        { status: 400 }
      )
    }

    // Check expiration date
    const now = new Date()
    const expiresAt = coupon.valid_until ? new Date(coupon.valid_until) : null
    if (expiresAt && expiresAt < now) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      )
    }

    // Check valid from date
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
    if (validFrom && validFrom > now) {
      return NextResponse.json(
        { error: 'This coupon is not yet valid' },
        { status: 400 }
      )
    }

    // Check maximum uses
    if (coupon.max_uses && coupon.usage_count >= coupon.max_uses) {
      return NextResponse.json(
        { error: 'This coupon has reached its maximum uses' },
        { status: 400 }
      )
    }

    // Check minimum purchase requirement
    if (coupon.min_purchase && subtotal && subtotal < coupon.min_purchase) {
      return NextResponse.json(
        {
          error: `Minimum purchase of ${formatPrice(coupon.min_purchase)} required`,
          min_purchase: coupon.min_purchase
        },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal ? (subtotal * coupon.discount_value) / 100 : 0
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value
    }

    // Return valid coupon with discount details
    return NextResponse.json({
      valid: true,
      coupon: {
        id: couponDoc.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        applicable_to: coupon.applicable_to
      }
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    const couponsRef = collection(db, 'coupons')
    const q = query(couponsRef, where('code', '==', code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      )
    }

    const couponDoc = snapshot.docs[0]
    const coupon = couponDoc.data()

    // Check if coupon is active
    if (coupon.status !== 'active') {
      return NextResponse.json(
        { error: 'This coupon is no longer active' },
        { status: 400 }
      )
    }

    // Check expiration
    const expiresAt = coupon.valid_until ? new Date(coupon.valid_until) : null
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: couponDoc.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      }
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount)
}
