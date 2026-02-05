
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getDocument, updateDocumentOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

export async function GET(request: Request) {
    try {
        const { userId } = auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userDoc = await getDocument(`users/${userId}`)
        const cart = (userDoc && userDoc.cart) ? userDoc.cart : {}

        return NextResponse.json({ cart })
    } catch (error) {
        console.error('Error fetching cart:', error)
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { productId, quantity = 1 } = body

        if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

        // Check Product existence
        const product = await getDocument(`products/${productId}`)
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

        const userDoc = await getDocument(`users/${userId}`)
        const cart = (userDoc && userDoc.cart) ? userDoc.cart : {}

        if (cart[productId]) {
            cart[productId].quantity += quantity
        } else {
            cart[productId] = {
                id: productId,
                name: product.name || product.title,
                price: product.price,
                image: (product.images && product.images[0]) ? product.images[0] : null,
                quantity
            }
        }

        await updateDocumentOnEdge('users', userId, { cart })

        return NextResponse.json({ cart })
    } catch (error) {
        console.error('Error adding to cart:', error)
        return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { userId } = auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { productId, quantity } = body

        if (!productId || quantity === undefined) {
            return NextResponse.json({ error: 'Product ID and quantity required' }, { status: 400 })
        }

        const userDoc = await getDocument(`users/${userId}`)
        const cart = (userDoc && userDoc.cart) ? userDoc.cart : {}

        if (quantity <= 0) {
            delete cart[productId]
        } else {
            if (cart[productId]) {
                cart[productId].quantity = quantity
            }
        }

        await updateDocumentOnEdge('users', userId, { cart })
        return NextResponse.json({ cart })

    } catch (error) {
        console.error('Error updating cart:', error)
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { userId } = auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        const userDoc = await getDocument(`users/${userId}`)
        let cart = (userDoc && userDoc.cart) ? userDoc.cart : {}

        if (productId) {
            delete cart[productId]
        } else {
            cart = {}
        }

        await updateDocumentOnEdge('users', userId, { cart })
        return NextResponse.json({ cart })

    } catch (error) {
        console.error('Error deleting from cart:', error)
        return NextResponse.json({ error: 'Failed to delete from cart' }, { status: 500 })
    }
}
