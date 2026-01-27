import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-server'

export const runtime = 'edge'

// GET /api/orders - Get user's orders
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const where: any = { userId: session.user.id }
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
                address: true
            },
            orderBy: { createdAt: 'desc' }
        })

        // Map to frontend format
        const mappedOrders = orders.map(order => ({
            id: order.id,
            user_id: order.userId,
            items: order.orderItems.map(item => ({
                product_id: item.productId,
                title: item.product.name,
                quantity: item.quantity,
                price: item.price
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
            tracking_number: order.trackingNumber || null,
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
