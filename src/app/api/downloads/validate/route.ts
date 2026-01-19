import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

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
      return NextResponse.json({ error: 'Invalid download link' }, { status: 404 })
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 })
    }

    if (tokenData.max_downloads && tokenData.download_count >= tokenData.max_downloads) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 403 })
    }

    const product = tokenData.products
    if (!product || !product.is_active) {
      return NextResponse.json({ error: 'Product not available' }, { status: 404 })
    }

    return NextResponse.json({
      id: tokenData.id,
      expires_at: tokenData.expires_at,
      download_count: tokenData.download_count,
      max_downloads: tokenData.max_downloads,
      products: {
        id: product.id,
        title: product.title,
        description: product.description,
        instructions: product.instructions,
        access_password: product.access_password,
        cover_images: product.cover_images || [],
        image_url: product.image_url,
        files: product.files || [],
        version: product.version
      }
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
