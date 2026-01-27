import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-server'

export const runtime = 'edge'

// GET /api/cart - Get user's cart
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { cart: true }
        })

        return NextResponse.json({ cart: user?.cart || {} })
    } catch (error) {
        console.error('Error fetching cart:', error)
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }
}

// POST /api/cart - Add item to cart
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { productId, quantity = 1 } = body

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Get current cart
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { cart: true }
        })

        const cart = (user?.cart as any) || {}

        // Add or update item
        if (cart[productId]) {
            cart[productId].quantity += quantity
        } else {
            cart[productId] = {
                id: productId,
                name: product.name,
                price: product.price,
                image: product.images[0] || null,
                quantity
            }
        }

        // Update user cart
        await prisma.user.update({
            where: { id: session.user.id },
            data: { cart: cart }
        })

        return NextResponse.json({ cart })
    } catch (error) {
        console.error('Error adding to cart:', error)
        return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
    }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { productId, quantity } = body

        if (!productId || quantity === undefined) {
            return NextResponse.json({ error: 'Product ID and quantity required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { cart: true }
        })

        const cart = (user?.cart as any) || {}

        if (quantity <= 0) {
            delete cart[productId]
        } else {
            if (cart[productId]) {
                cart[productId].quantity = quantity
            }
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { cart: cart }
        })

        return NextResponse.json({ cart })
    } catch (error) {
        console.error('Error updating cart:', error)
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
    }
}

// DELETE /api/cart - Clear cart or remove item
export async function DELETE(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { cart: true }
        })

        let cart = (user?.cart as any) || {}

        if (productId) {
            // Remove specific item
            delete cart[productId]
        } else {
            // Clear entire cart
            cart = {}
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { cart: cart }
        })

        return NextResponse.json({ cart })
    } catch (error) {
        console.error('Error deleting from cart:', error)
        return NextResponse.json({ error: 'Failed to delete from cart' }, { status: 500 })
    }
}
