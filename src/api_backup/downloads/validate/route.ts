import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  try {
    const tokensSnapshot = await adminDb.collection('download_tokens').where('token', '==', token).limit(1).get()

    if (tokensSnapshot.empty) {
      return NextResponse.json({ error: 'Invalid download link' }, { status: 404 })
    }

    const tokenDoc = tokensSnapshot.docs[0]
    const tokenData = tokenDoc.data()

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 })
    }

    // Default download_count to 0 if missing
    const downloadCount = tokenData.download_count || 0

    if (tokenData.max_downloads && downloadCount >= tokenData.max_downloads) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 403 })
    }

    const productDoc = await adminDb.collection('products').doc(tokenData.product_id).get()

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = productDoc.data()!

    // Check availability
    if (!product.is_active && product.status !== 'active') {
      return NextResponse.json({ error: 'Product not available' }, { status: 404 })
    }

    return NextResponse.json({
      id: tokenDoc.id,
      expires_at: tokenData.expires_at,
      download_count: downloadCount,
      max_downloads: tokenData.max_downloads,
      products: {
        id: productDoc.id,
        title: product.title,
        description: product.description,
        instructions: product.instructions,
        access_password: product.access_password,
        cover_images: product.cover_images || [],
        image_url: product.image_url,
        // Handle files array fallback
        files: product.files || (product.download_file_path ? [{ url: product.download_file_path, name: product.title, size: 0 }] : []),
        version: product.version
      }
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
