import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { productId, userId, orderId } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.is_active || !product.is_published) {
      return NextResponse.json({ error: 'Product not available' }, { status: 403 })
    }

    if (product.tier_access === 'paid' && !orderId) {
      return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
    }

    if (['basic', 'pro'].includes(product.tier_access) && userId) {
      const { data: user } = await supabase
        .from('users')
        .select('subscription_tier, subscription_end')
        .eq('id', userId)
        .single()

      if (!user || !user.subscription_end || new Date(user.subscription_end) < new Date()) {
        return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
      }

      if (product.tier_access === 'pro' && user.subscription_tier !== 'pro') {
        return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
      }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiryHours = product.link_expiry_hours || 48
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    const { error: tokenError } = await supabase
      .from('download_tokens')
      .insert({
        product_id: productId,
        user_id: userId || null,
        order_id: orderId || null,
        token,
        expires_at: expiresAt.toISOString(),
        max_downloads: product.download_limit || null
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

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
    const { data: tokenData, error: tokenError } = await supabase
      .from('download_tokens')
      .select('*, products(*)')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 })
    }

    if (tokenData.max_downloads && tokenData.download_count >= tokenData.max_downloads) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 403 })
    }

    const product = tokenData.products
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const files = product.files || []
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files available' }, { status: 404 })
    }

    const idx = fileIndex ? parseInt(fileIndex) : 0
    if (idx < 0 || idx >= files.length) {
      return NextResponse.json({ error: 'Invalid file index' }, { status: 400 })
    }

    const file = files[idx]

    await supabase
      .from('download_tokens')
      .update({ download_count: (tokenData.download_count || 0) + 1 })
      .eq('id', tokenData.id)

    await supabase.from('download_logs').insert({
      user_id: tokenData.user_id,
      product_id: product.id,
      token_id: tokenData.id,
      download_type: 'product',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    })

    await supabase
      .from('products')
      .update({ download_count: (product.download_count || 0) + 1 })
      .eq('id', product.id)

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
