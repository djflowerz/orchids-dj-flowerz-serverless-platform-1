
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { runQueryOnEdge, updateDocumentOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

export async function GET(request: Request) {
    try {
        const { userId } = auth()
        const user = await currentUser()

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = user.emailAddresses[0]?.emailAddress
        const isAdmin = user.publicMetadata?.role === 'admin' || email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const structuredQuery: any = {
            from: [{ collectionId: 'users' }],
            limit: limit,
            offset: offset,
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }]
        }

        const users = await runQueryOnEdge('users', structuredQuery)

        const mappedUsers = users.map((u: any) => ({
            id: u.id,
            name: u.name || u.firstName || 'Unknown',
            email: u.email,
            role: u.role,
            account_status: u.account_status,
            subscription_status: u.subscription_status,
            subscription_tier: u.subscription_tier,
            created_at: u.createdAt
        }))

        return NextResponse.json(mappedUsers)

    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { userId } = auth()
        const user = await currentUser()

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = user.emailAddresses[0]?.emailAddress
        const isAdmin = user.publicMetadata?.role === 'admin' || email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { id, role, account_status } = body

        if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })

        const updates: any = {}
        if (role) updates.role = role
        if (typeof account_status !== 'undefined') updates.account_status = account_status

        const updatedUser = await updateDocumentOnEdge('users', id, updates)

        return NextResponse.json(updatedUser)

    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}
