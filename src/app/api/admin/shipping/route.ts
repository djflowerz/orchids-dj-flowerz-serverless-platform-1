import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { runQueryOnEdge, createDocumentOnEdge, updateDocumentOnEdge, deleteDocumentOnEdge } from '@/lib/firestore-edge'

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

        const query: any = {
            from: [{ collectionId: 'shipping_zones' }]
        }
        const zones = await runQueryOnEdge('shipping_zones', query)
        return NextResponse.json(zones)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const newZone = { ...body, createdAt: new Date().toISOString() }
        const created = await createDocumentOnEdge('shipping_zones', newZone)
        return NextResponse.json(created)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, ...updates } = body
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const updated = await updateDocumentOnEdge('shipping_zones', id, updates)
        return NextResponse.json(updated)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await deleteDocumentOnEdge('shipping_zones', id)
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 })
    }
}
