import { NextRequest, NextResponse } from 'next/server'
import { runQueryOnEdge, createDocumentOnEdge, updateDocumentOnEdge, deleteDocumentOnEdge } from '@/lib/firestore-edge'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'edge';

// GET /api/plans - List all plans (public for active, all for admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const all = searchParams.get('all') === 'true'

        const query: any = {
            from: [{ collectionId: 'plans' }],
            orderBy: [{ field: { fieldPath: 'price' }, direction: 'ASCENDING' }]
        }

        if (!all) {
            query.where = {
                fieldFilter: {
                    field: { fieldPath: 'is_active' },
                    op: 'EQUAL',
                    value: { booleanValue: true }
                }
            }
        }

        const plans = await runQueryOnEdge('plans', query)

        return NextResponse.json(plans)
    } catch (error) {
        console.error('Error fetching plans:', error)
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }
}

// POST /api/plans - Create new plan (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const {
            name,
            price,
            durationDays,
            channels,
            isActive,
            description,
            features,
            tier,
            duration
        } = body

        if (!name || price === undefined || !durationDays) {
            return NextResponse.json(
                { error: 'Name, price, and duration are required' },
                { status: 400 }
            )
        }

        const plan = await createDocumentOnEdge('plans', {
            name,
            price: parseFloat(price),
            duration_days: parseInt(durationDays),
            channels: channels || [],
            is_active: isActive !== undefined ? isActive : true,
            description,
            features: features || [],
            tier,
            duration,
            created_at: new Date().toISOString()
        })

        return NextResponse.json(plan)
    } catch (error: any) {
        console.error('Error creating plan:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create plan' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

// PUT /api/plans - Update plan (admin only)
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        const firestoreData: any = {}
        if (updateData.name !== undefined) firestoreData.name = updateData.name
        if (updateData.price !== undefined) firestoreData.price = parseFloat(updateData.price)
        if (updateData.durationDays !== undefined) firestoreData.duration_days = parseInt(updateData.durationDays)
        if (updateData.channels !== undefined) firestoreData.channels = updateData.channels
        if (updateData.isActive !== undefined) firestoreData.is_active = updateData.isActive
        if (updateData.description !== undefined) firestoreData.description = updateData.description
        if (updateData.features !== undefined) firestoreData.features = updateData.features
        if (updateData.tier !== undefined) firestoreData.tier = updateData.tier
        if (updateData.duration !== undefined) firestoreData.duration = updateData.duration

        const plan = await updateDocumentOnEdge('plans', id, firestoreData)

        return NextResponse.json(plan)
    } catch (error: any) {
        console.error('Error updating plan:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update plan' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

// DELETE /api/plans - Delete plan (admin only)
export async function DELETE(request: NextRequest) {
    try {
        await requireAdmin()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        await deleteDocumentOnEdge('plans', id)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting plan:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete plan' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}
