import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { productId, userId, orderId } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const productDoc = await adminDb.collection('products').doc(productId).get()

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = productDoc.data()!

    if (!product.is_active && product.status !== 'active') { // Check both fields for compatibility
      return NextResponse.json({ error: 'Product not available' }, { status: 403 })
    }

    // Since is_published might be missing or differently named, we skip that strict check or assume true if active

    let user: any = null
    if (userId) {
      const userDoc = await adminDb.collection('users').doc(userId).get()
      user = userDoc.data()
    }

    // Admin bypass: Admins can download anything without restriction
    if (user && (user.role === 'admin' || user.email === 'ianmuriithiflowerz@gmail.com')) {
      // Proceed to generate token
    } else {
      // Regular user checks
      if (product.tier_access === 'paid' && !orderId) {
        return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
      }

      if (['basic', 'pro'].includes(product.tier_access)) {
        if (!userId || !user) {
          return NextResponse.json({ error: 'Login required' }, { status: 401 })
        }

        const hasActiveSub =
          (user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date()) ||
          (user.subscription_end && new Date(user.subscription_end) > new Date()) ||
          user.subscription_status === 'active'

        if (!hasActiveSub) {
          return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
        }

        // Removed specific tier check (Pro vs Basic) - any active subscription allows access
      }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiryHours = product.link_expiry_hours || 48
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    await adminDb.collection('download_tokens').add({
      product_id: productId,
      user_id: userId || null,
      order_id: orderId || null,
      token,
      expires_at: expiresAt.toISOString(),
      max_downloads: product.download_limit || null,
      download_count: 0,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      downloadUrl: `/download/${token}`
    })
  } catch (error) {
    console.error('Download token error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const fileIndex = searchParams.get('file')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  try {
    const tokensSnapshot = await adminDb.collection('download_tokens').where('token', '==', token).limit(1).get()

    if (tokensSnapshot.empty) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    const tokenDoc = tokensSnapshot.docs[0]
    const tokenData = tokenDoc.data()

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 })
    }

    if (tokenData.max_downloads && (tokenData.download_count || 0) >= tokenData.max_downloads) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 403 })
    }

    const productDoc = await adminDb.collection('products').doc(tokenData.product_id).get()

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = productDoc.data()!

    // Handle both files array and single download_file_path for backward compatibility
    let files = product.files || []
    if (files.length === 0 && product.download_file_path) {
      files = [{ url: product.download_file_path, name: product.title, size: 0 }]
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files available' }, { status: 404 })
    }

    const idx = fileIndex ? parseInt(fileIndex) : 0
    if (idx < 0 || idx >= files.length) {
      return NextResponse.json({ error: 'Invalid file index' }, { status: 400 })
    }

    const file = files[idx]

    await tokenDoc.ref.update({ download_count: FieldValue.increment(1) })

    await adminDb.collection('download_logs').add({
      user_id: tokenData.user_id,
      product_id: tokenData.product_id,
      token_id: tokenDoc.id,
      download_type: 'product',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString()
    })

    await adminDb.collection('products').doc(tokenData.product_id).update({
      download_count: FieldValue.increment(1)
    })

    return NextResponse.json({
      downloadUrl: file.url,
      fileName: file.name,
      fileSize: file.size
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
