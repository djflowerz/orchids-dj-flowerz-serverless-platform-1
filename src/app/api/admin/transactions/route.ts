
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { runQueryOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

export async function GET(req: Request) {
    try {
        const { userId } = auth()
        const user = await currentUser()

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = user.emailAddresses[0]?.emailAddress
        const isAdmin = user.publicMetadata?.role === 'admin' || email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const structuredQuery = {
            from: [{ collectionId: 'transactions' }],
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
            limit: 100
        }

        const transactions = await runQueryOnEdge('transactions', structuredQuery)

        const formattedTransactions = transactions.map((t: any) => ({
            id: t.id,
            user_id: t.userId || '',
            user_email: t.email || '',
            amount: t.amount,
            type: t.type,
            status: t.status,
            reference: t.reference,
            payment_method: t.paymentMethod,
            created_at: t.createdAt
        }))

        return NextResponse.json(formattedTransactions)

    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
