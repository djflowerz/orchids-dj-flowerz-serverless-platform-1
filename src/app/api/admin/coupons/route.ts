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

        const structuredQuery: any = {
            from: [{ collectionId: 'coupons' }],
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }]
        }
        const coupons = await runQueryOnEdge('coupons', structuredQuery)
        return NextResponse.json(coupons)

    } catch (error) {
        console.error('Error fetching coupons:', error)
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const newCoupon = {
            ...body,
            createdAt: new Date().toISOString(),
            usageCount: 0
        }
        const created = await createDocumentOnEdge('coupons', newCoupon)
        return NextResponse.json(created)

    } catch (error) {
        console.error('Error creating coupon:', error)
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, ...updates } = body
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const updated = await updateDocumentOnEdge('coupons', id, updates)
        return NextResponse.json(updated)

    } catch (error) {
        console.error('Error updating coupon:', error)
        return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await deleteDocumentOnEdge('coupons', id)
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting coupon:', error)
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
    }
}
