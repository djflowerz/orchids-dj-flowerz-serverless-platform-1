
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getDocument, updateDocumentOnEdge, deleteDocumentOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params as Promise in Next 15+
) {
    try {
        const { id } = await params
        const product = await getDocument(`products/${id}`)

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const store = product.store || { name: 'DJ Flowerz', username: 'djflowerz', logo: null, email: null }
        const ratings = product.ratings || []
        const avgRating = ratings.length > 0 ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length : 0

        const mappedProduct = {
            id: product.id,
            title: product.name,
            description: product.description,
            price: product.price,
            mrp: product.mrp,
            category: product.category,
            cover_images: product.images,
            image_url: (product.images && product.images[0]) ? product.images[0] : null,
            is_trending: product.isTrending,
            is_free: product.price === 0,
            in_stock: product.inStock,
            created_at: product.createdAt,
            store: store,
            ratings: ratings, // Returning array of ratings (might be large if not careful)
            average_rating: avgRating,
            review_count: ratings.length
        }

        return NextResponse.json(mappedProduct)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        const body = await request.json()

        const updates: any = {}
        if (body.title) updates.name = body.title
        if (body.description) updates.description = body.description
        if (body.price !== undefined) updates.price = parseFloat(body.price)
        if (body.mrp !== undefined) updates.mrp = parseFloat(body.mrp)
        if (body.category) updates.category = body.category
        if (body.cover_images) updates.images = body.cover_images
        if (body.stock !== undefined) updates.inStock = parseInt(body.stock)

        const product = await updateDocumentOnEdge('products', id, updates)

        return NextResponse.json(product)

    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        await deleteDocumentOnEdge('products', id)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
