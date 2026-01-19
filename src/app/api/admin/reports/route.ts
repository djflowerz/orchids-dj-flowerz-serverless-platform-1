import { NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase, isAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  const reportType = searchParams.get('type') || 'summary'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const supabase = getServerSupabase()

  const dateFilter = (query: ReturnType<typeof supabase.from>) => {
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
    return query
  }

  let reportData: Record<string, unknown> = {}

  if (reportType === 'summary' || reportType === 'all') {
    const [users, transactions, bookings, subscriptions] = await Promise.all([
      dateFilter(supabase.from('users').select('*')),
      dateFilter(supabase.from('transactions').select('*')),
      dateFilter(supabase.from('bookings').select('*')),
      dateFilter(supabase.from('subscriptions').select('*'))
    ])

    const totalRevenue = transactions.data?.reduce((sum, t) => 
      t.status === 'completed' ? sum + (t.amount || 0) : sum, 0) || 0

    reportData.summary = {
      totalUsers: users.data?.length || 0,
      totalTransactions: transactions.data?.length || 0,
      totalBookings: bookings.data?.length || 0,
      activeSubscriptions: subscriptions.data?.filter(s => s.status === 'active').length || 0,
      totalRevenue
    }
  }

  if (reportType === 'transactions' || reportType === 'all') {
    const { data: transactions } = await dateFilter(
      supabase.from('transactions')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false })
    )
    reportData.transactions = transactions
  }

  if (reportType === 'bookings' || reportType === 'all') {
    const { data: bookings } = await dateFilter(
      supabase.from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
    )
    reportData.bookings = bookings
  }

  if (reportType === 'subscriptions' || reportType === 'all') {
    const { data: subscriptions } = await dateFilter(
      supabase.from('subscriptions')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false })
    )
    reportData.subscriptions = subscriptions
  }

  if (reportType === 'downloads' || reportType === 'all') {
    const { data: downloads } = await dateFilter(
      supabase.from('download_logs')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false })
    )
    reportData.downloads = downloads
  }

  if (format === 'csv') {
    let csv = ''
    
    if (reportType === 'transactions') {
      csv = 'ID,User,Type,Amount,Currency,Status,Date\n'
      const txns = reportData.transactions as Array<Record<string, unknown>> || []
      txns.forEach((t: Record<string, unknown>) => {
        const user = t.users as { name?: string; email?: string } | null
        csv += `${t.id},"${user?.name || user?.email || 'N/A'}",${t.type},${t.amount},${t.currency},${t.status},${t.created_at}\n`
      })
    } else if (reportType === 'bookings') {
      csv = 'ID,Customer,Event Type,Date,Location,Status,Budget,Created\n'
      const bkgs = reportData.bookings as Array<Record<string, unknown>> || []
      bkgs.forEach((b: Record<string, unknown>) => {
        csv += `${b.id},"${b.customer_name || b.name}",${b.event_type},${b.event_date},"${b.location}",${b.status},${b.estimated_budget},${b.created_at}\n`
      })
    } else if (reportType === 'subscriptions') {
      csv = 'ID,User,Tier,Status,Start Date,End Date,Amount\n'
      const subs = reportData.subscriptions as Array<Record<string, unknown>> || []
      subs.forEach((s: Record<string, unknown>) => {
        const user = s.users as { name?: string; email?: string } | null
        csv += `${s.id},"${user?.name || user?.email || 'N/A'}",${s.tier},${s.status},${s.start_date},${s.end_date},${s.amount}\n`
      })
    } else {
      csv = `Report Type: ${reportType}\n`
      csv += `Generated: ${new Date().toISOString()}\n\n`
      csv += JSON.stringify(reportData, null, 2)
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  }

  return NextResponse.json(reportData)
}
