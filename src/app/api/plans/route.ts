import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/plans - List all plans (public for active, all for admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const all = searchParams.get('all') === 'true'

        const where: any = all ? {} : { isActive: true }

        const plans = await prisma.plan.findMany({
            where,
            orderBy: {
                price: 'asc'
            }
        })

        // Map to frontend format
        const formattedPlans = plans.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            durationDays: p.durationDays,
            channels: p.channels,
            isActive: p.isActive,
            createdAt: p.createdAt.toISOString(),
            description: p.description,
            features: p.features,
            tier: p.tier,
            duration: p.duration
        }))

        return NextResponse.json(formattedPlans)
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

        const plan = await prisma.plan.create({
            data: {
                name,
                price: parseFloat(price),
                durationDays: parseInt(durationDays),
                channels: channels || [],
                isActive: isActive !== undefined ? isActive : true,
                description,
                features: features || [],
                tier,
                duration
            }
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

        const prismaData: any = {}
        if (updateData.name !== undefined) prismaData.name = updateData.name
        if (updateData.price !== undefined) prismaData.price = parseFloat(updateData.price)
        if (updateData.durationDays !== undefined) prismaData.durationDays = parseInt(updateData.durationDays)
        if (updateData.channels !== undefined) prismaData.channels = updateData.channels
        if (updateData.isActive !== undefined) prismaData.isActive = updateData.isActive
        if (updateData.description !== undefined) prismaData.description = updateData.description
        if (updateData.features !== undefined) prismaData.features = updateData.features
        if (updateData.tier !== undefined) prismaData.tier = updateData.tier
        if (updateData.duration !== undefined) prismaData.duration = updateData.duration

        const plan = await prisma.plan.update({
            where: { id },
            data: prismaData
        })

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

        await prisma.plan.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting plan:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete plan' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}
