import { runQueryOnEdge } from '@/lib/firestore-edge'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
    try {
        const result = await runQueryOnEdge('site_settings', {
            limit: 1
        })
        const settings = result[0]

        // Return only public fields
        const publicSettings = {
            siteName: settings?.siteName || 'DJ FLOWERZ',
            paystackPublicKey: settings?.paystackPublicKey || null,
            whatsappNumber: settings?.whatsappNumber || null
        }

        return NextResponse.json(publicSettings)
    } catch (error) {
        console.error('Error fetching public settings:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
