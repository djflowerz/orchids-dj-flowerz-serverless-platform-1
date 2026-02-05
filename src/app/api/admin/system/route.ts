import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { runQueryOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

async function checkAdmin() {
    const { userId } = auth()
    const user = await currentUser()
    if (!userId || !user) return null
    const email = user.emailAddresses[0]?.emailAddress
    const isAdmin = user.publicMetadata?.role === 'admin' || email === 'ianmuriithiflowerz@gmail.com'
    return isAdmin ? user : null
}

export async function GET(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check Paystack Status (Simple Reachability)
        let paystackStatus = 'operational'
        let paystackLatency = 0
        try {
            const start = Date.now()
            // Using a public status endpoint or just root if available
            const psRes = await fetch('https://api.paystack.co', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } // Auth might be needed
            })
            paystackLatency = Date.now() - start
            if (!psRes.ok && psRes.status !== 404) paystackStatus = 'degraded' // 404 might be normal for root
        } catch (e) {
            paystackStatus = 'outage'
        }

        // Fetch Logs from Firestore
        const logQuery: any = {
            from: [{ collectionId: 'system_logs' }],
            limit: 50,
            orderBy: [{ field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' }]
        }

        // Handling empty logs gracefully
        let logs: any[] = []
        try {
            logs = await runQueryOnEdge('system_logs', logQuery)
        } catch (e) {
            console.error('Logs fetch error', e)
        }

        return NextResponse.json({
            status: 'healthy',
            paystack: { status: paystackStatus, latency: paystackLatency },
            logs: logs
        })

    } catch (e) {
        console.error('System health error:', e)
        return NextResponse.json({ error: 'Failed to fetch system health' }, { status: 500 })
    }
}
