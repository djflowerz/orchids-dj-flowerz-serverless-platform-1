
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-server'
import { headers } from 'next/headers'

// GET /api/admin/transactions
// Fetch all transactions with pagination/filtering if needed but starting simple
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        // Basic admin check (Assuming user email check similar to lib/auth.ts)
        const userEmail = session?.user?.email
        // NOTE: Hardcoded admin email from previous context. 
        // Ideally should use a role check or helper.
        // Re-using the check found in auth.ts: 'ianmuriithiflowerz@gmail.com'
        const isAdmin = userEmail === 'ianmuriithiflowerz@gmail.com' || userEmail === 'admin@djflowerz.com' // Fallback

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const transactions = await prisma.transaction.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 100, // Limit to 100 for now
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                booking: {
                    select: {
                        scheduledDate: true,
                        scheduledTime: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        })

        const formattedTransactions = transactions.map(t => ({
            id: t.id,
            user_id: t.userId || '',
            user_email: t.email || '',
            amount: t.amount,
            type: t.type,
            status: t.status,
            reference: t.reference,
            payment_method: t.paymentMethod,
            created_at: t.createdAt.toISOString()
        }))

        return NextResponse.json(formattedTransactions)

    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
