import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { runQueryOnEdge, updateDocumentOnEdge, deleteDocumentOnEdge } from '@/lib/firestore-edge'

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
            from: [{ collectionId: 'comments' }],
            orderBy: [{ field: { fieldPath: 'created_at' }, direction: 'DESCENDING' }]
        }
        const comments = await runQueryOnEdge('comments', query)
        return NextResponse.json(comments)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, status } = body
        if (!id || !status) return NextResponse.json({ error: 'ID and Status required' }, { status: 400 })

        const updated = await updateDocumentOnEdge('comments', id, { status })
        return NextResponse.json(updated)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await checkAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await deleteDocumentOnEdge('comments', id)
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
}
