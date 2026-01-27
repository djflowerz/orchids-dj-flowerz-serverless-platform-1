import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json(
                { valid: false, message: 'Coupon code is required' },
                { status: 400 }
            )
        }

        // Query Firestore for the coupon
        const couponsRef = collection(db, 'coupons')
        const q = query(couponsRef, where('__name__', '==', code.toUpperCase()))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
            return NextResponse.json(
                { valid: false, message: 'Invalid coupon code' },
                { status: 404 }
            )
        }

        const couponDoc = snapshot.docs[0]
        const coupon = couponDoc.data()

        // Check if coupon is expired
        const expiresAt = new Date(coupon.expiresAt)
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { valid: false, message: 'This coupon has expired' },
                { status: 400 }
            )
        }

        // Return valid coupon
        return NextResponse.json({
            valid: true,
            coupon: {
                code: couponDoc.id,
                description: coupon.description,
                discount: coupon.discount,
                forNewUser: coupon.forNewUser,
                forMember: coupon.forMember,
            },
        })
    } catch (error) {
        console.error('Error validating coupon:', error)
        return NextResponse.json(
            { valid: false, message: 'Failed to validate coupon' },
            { status: 500 }
        )
    }
}
