import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase()
  const code = request.nextUrl.searchParams.get('code')

  if (code) {
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !promo) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 })
    }

    const now = new Date()
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return NextResponse.json({ error: 'Promo code not yet active' }, { status: 400 })
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 })
    }
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ error: 'Promo code usage limit reached' }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (user && promo.per_user_limit) {
      const { count } = await supabase
        .from('promo_code_uses')
        .select('*', { count: 'exact', head: true })
        .eq('promo_code_id', promo.id)
        .eq('user_id', user.id)

      if (count && count >= promo.per_user_limit) {
        return NextResponse.json({ error: 'You have already used this promo code' }, { status: 400 })
      }
    }

    return NextResponse.json({ 
      promo: {
        id: promo.id,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_purchase: promo.min_purchase,
        applies_to: promo.applies_to
      }
    })
  }

  const { data: promos, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ promos })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const { code, orderId, discountApplied } = await request.json()

  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (!promo) {
    return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 })
  }

  const { error: useError } = await supabase
    .from('promo_code_uses')
    .insert({
      promo_code_id: promo.id,
      user_id: user.id,
      order_id: orderId,
      discount_applied: discountApplied
    })

  if (useError) {
    return NextResponse.json({ error: useError.message }, { status: 500 })
  }

  await supabase
    .from('promo_codes')
    .update({ current_uses: (promo.current_uses || 0) + 1 })
    .eq('id', promo.id)

  return NextResponse.json({ success: true })
}
