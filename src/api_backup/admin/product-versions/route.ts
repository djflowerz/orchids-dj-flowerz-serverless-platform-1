import { NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase, isAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { data: versions, error } = await supabase
    .from('product_versions')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ versions })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId, version, changelog, fileUrl, fileSize } = await request.json()

  if (!productId || !version) {
    return NextResponse.json({ error: 'Product ID and version are required' }, { status: 400 })
  }

  const supabase = getServerSupabase()

  const { data: existingVersion } = await supabase
    .from('product_versions')
    .select('id')
    .eq('product_id', productId)
    .eq('version', version)
    .single()

  if (existingVersion) {
    return NextResponse.json({ error: 'Version already exists' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('product_versions')
    .insert({
      product_id: productId,
      version,
      changelog,
      file_url: fileUrl,
      file_size: fileSize
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('admin_logs').insert({
    admin_id: user.id,
    action: 'create_version',
    entity_type: 'product_version',
    entity_id: data.id,
    details: { productId, version }
  })

  return NextResponse.json({ version: data })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user || !await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const versionId = searchParams.get('id')

  if (!versionId) {
    return NextResponse.json({ error: 'Version ID is required' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { error } = await supabase
    .from('product_versions')
    .delete()
    .eq('id', versionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('admin_logs').insert({
    admin_id: user.id,
    action: 'delete_version',
    entity_type: 'product_version',
    entity_id: versionId,
    details: {}
  })

  return NextResponse.json({ success: true })
}
