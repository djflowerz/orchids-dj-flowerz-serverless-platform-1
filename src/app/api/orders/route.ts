
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { runQueryOnEdge, createDocumentOnEdge, updateDocumentOnEdge, getDocument } from '@/lib/firestore-edge'

export const runtime = 'edge'

// Helper to get product price - fetches from Firestore
async function getProductPrice(productId: string): Promise<number | null> {
    const doc = await getDocument(`products/${productId}`)
    if (!doc) return null
    return doc.price || 0
}

// GET /api/orders - Get user's orders (or all for admin)
export async function GET(request: Request) {
    try {
        const { userId } = auth()
        const user = await currentUser()

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = user.emailAddresses[0]?.emailAddress
        const isAdmin = user.publicMetadata?.role === 'admin' || email === 'ianmuriithiflowerz@gmail.com'

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const viewAll = searchParams.get('all') === 'true'

        // Construct Query
        const filters: any[] = []

        // If NOT admin, force userId filter. If admin check viewAll.
        if (!isAdmin || !viewAll) {
            filters.push({
                fieldFilter: {
                    field: { fieldPath: 'userId' },
                    op: 'EQUAL',
                    value: { stringValue: userId }
                }
            })
        }

        if (status) {
            filters.push({
                fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: status }
                }
            })
        }

        const structuredQuery: any = {
            from: [{ collectionId: 'orders' }],
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }]
        }

        if (filters.length > 0) {
            structuredQuery.where = {
                compositeFilter: {
                    op: 'AND',
                    filters: filters
                }
            }
        }

        const rawOrders = await runQueryOnEdge('orders', structuredQuery)

        // Map to frontend format
        const mappedOrders = rawOrders.map((order: any) => ({
            id: order.id,
            user_id: order.userId,
            user_name: order.userName || 'Unknown',
            user_email: order.userEmail || 'Unknown',
            items: (order.items || []).map((item: any) => ({
                product_id: item.productId,
                title: item.title || item.name || 'Product',
                quantity: item.quantity,
                price: item.price,
                image: item.image || null
            })),
            total: order.total,
            status: order.status,
            shipping_address: order.shippingAddress,
            created_at: order.createdAt
        }))

        return NextResponse.json(mappedOrders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
}

// POST /api/orders - Create new order
export async function POST(request: Request) {
    try {
        const { userId } = auth()
        const user = await currentUser()

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { items, shippingAddress, paymentMethod = 'PAYSTACK' } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Order items required' }, { status: 400 })
        }

        if (!shippingAddress) {
            return NextResponse.json({ error: 'Shipping address required' }, { status: 400 })
        }

        // Validate Items & Calculate Total
        let total = 0
        const orderItems: any[] = []

        // Parallel fetch for speed
        const productPromises = items.map((item: any) => getDocument(`products/${item.productId}`))
        const products = await Promise.all(productPromises)

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const product = products[i]

            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
            }

            const quantity = item.quantity || 1
            const itemTotal = (product.price || 0) * quantity
            total += itemTotal

            orderItems.push({
                productId: item.productId,
                title: product.name || 'Product',
                quantity: quantity,
                price: product.price || 0,
                image: (product.images && product.images[0]) ? product.images[0] : null
            })
        }

        const orderData = {
            userId: userId,
            userName: user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User',
            userEmail: user.emailAddresses[0]?.emailAddress || '',
            storeId: 'admin-store',
            shippingAddress: shippingAddress,
            total,
            status: 'ORDER_PLACED',
            paymentMethod,
            isPaid: false,
            items: orderItems,
            createdAt: new Date().toISOString()
        }

        const orderId = await createDocumentOnEdge('orders', orderData)

        // Clear user cart? User table in DB? 
        // Logic for clearing cart would imply updating User doc.
        // If using Clerk metadata for cart: await clerkClient.users.updateUserMetadata(...)
        // If using Firestore users collection:
        try {
            // Optimistically update user cart to empty if user doc exists
            await updateDocumentOnEdge('users', userId, { cart: {} })
        } catch (e) {
            // Ignore if user doc doesn't exist
        }

        return NextResponse.json({
            orderId: orderId,
            total: orderData.total,
            status: orderData.status
        })

    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}

// PUT - Update Order (Admin)
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
        const { id, status, shipping_status, courier_name } = body

        if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 })

        const updates: any = {}
        if (status) updates.status = status
        if (shipping_status) updates.shippingStatus = shipping_status
        if (courier_name) updates.courierName = courier_name

        const result = await updateDocumentOnEdge('orders', id, updates)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Order Update Error", error)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }
}
