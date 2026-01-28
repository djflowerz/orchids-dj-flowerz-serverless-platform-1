import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-server'

export const runtime = 'edge'

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true }
        })

        const isAdmin = user?.role === 'admin' || user?.email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: any = {}
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }

        const users = await prisma.user.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                account_status: true,
                subscription_status: true,
                subscription_tier: true,
                createdAt: true,
                updatedAt: true
            }
        })

        const mappedUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            account_status: u.account_status,
            subscription_status: u.subscription_status,
            subscription_tier: u.subscription_tier,
            created_at: u.createdAt.toISOString()
        }))

        return NextResponse.json(mappedUsers)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true }
        })

        const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { id, role, account_status } = body

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const data: any = {}
        if (role) data.role = role
        if (typeof account_status !== 'undefined') data.account_status = account_status

        const updatedUser = await prisma.user.update({
            where: { id },
            data
        })

        return NextResponse.json(updatedUser)

    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}
