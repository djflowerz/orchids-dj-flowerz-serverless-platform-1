import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-server'

export const runtime = 'edge'

// GET /api/orders - Get user's orders (or all for admin)
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch user role from DB to be safe
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true }
        })

        const isAdmin = user?.role === 'admin' || user?.email === 'ianmuriithiflowerz@gmail.com'

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const viewAll = searchParams.get('all') === 'true'

        // If admin and ?all=true, show all orders. Otherwise show user's orders
        const where: any = (isAdmin && viewAll) ? {} : { userId: session.user.id }

        if (status) {
            where.status = status
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                images: true,
                                price: true
                            }
                        }
                    }
                },
                address: true,
                user: { // Include user details for admin view
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Map to frontend format
        const mappedOrders = orders.map(order => ({
            id: order.id,
            user_id: order.userId,
            user_name: order.user?.name || 'Unknown',
            user_email: order.user?.email || 'Unknown',
            items: order.orderItems.map(item => ({
                product_id: item.productId,
                title: item.product.name,
                quantity: item.quantity,
                price: item.price,
                image: item.product.images[0] || null
            })),
            total: order.total,
            status: order.status,
            shipping_address: order.address ? {
                name: order.address.name,
                street: order.address.street,
                city: order.address.city,
                state: order.address.state,
                zip: order.address.zip,
                country: order.address.country,
                phone: order.address.phone
            } : null,
            created_at: order.createdAt.toISOString()
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
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
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

        // Calculate total
        let total = 0
        const orderItems = []

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            })

            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
            }

            total += product.price * item.quantity
            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            })
        }

        // Create address
        const address = await prisma.address.create({
            data: {
                userId: session.user.id,
                name: shippingAddress.name,
                email: shippingAddress.email || session.user.email,
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zip: shippingAddress.zip,
                country: shippingAddress.country || 'Kenya',
                phone: shippingAddress.phone
            }
        })

        // Create order
        const order = await prisma.order.create({
            data: {
                userId: session.user.id,
                storeId: 'admin-store', // Default store
                addressId: address.id,
                total,
                status: 'ORDER_PLACED',
                paymentMethod,
                isPaid: false,
                orderItems: {
                    create: orderItems
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                address: true
            }
        })

        // Clear user's cart after order
        await prisma.user.update({
            where: { id: session.user.id },
            data: { cart: {} }
        })

        return NextResponse.json({
            orderId: order.id,
            total: order.total,
            status: order.status
        })
    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
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

        // Check admin
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true }
        })
        const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { id, status, shipping_status, courier_name } = body

        if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 })

        const data: any = {}
        if (status) data.status = status
        if (shipping_status) data.shippingStatus = shipping_status
        if (courier_name) data.courierName = courier_name

        const order = await prisma.order.update({
            where: { id },
            data
        })

        return NextResponse.json(order)
    } catch (error) {
        console.error("Order Update Error", error)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }
}
