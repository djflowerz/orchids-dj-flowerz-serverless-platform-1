import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Product } from '@prisma/client'
import { auth } from '@/lib/auth-server'

export const runtime = 'edge'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const trending = searchParams.get('trending') === 'true'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    try {
        const where: any = {}

        if (trending) {
            where.isTrending = true
        }

        if (category) {
            where.category = category
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }

        const products = await prisma.product.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            include: {
                store: {
                    select: { name: true, username: true }
                },
                rating: true
            }
        })

        // Map to frontend interface
        const mappedProducts = products.map(p => {
            const ratings = p.rating || []
            const averageRating = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : 0

            const stockCount = Number(p.inStock) || 0

            return {
                id: p.id,
                title: p.name,
                description: p.description,
                price: p.price,
                category: p.category,
                cover_images: p.images,
                image_url: p.images[0] || null,
                is_trending: p.isTrending,
                is_free: p.price === 0,
                in_stock: stockCount > 0,
                created_at: p.createdAt.toISOString(),
                store: p.store,
                average_rating: averageRating,
                review_count: ratings.length,
                popularity_score: stockCount + (ratings.length * 5) // Mock popularity
            }
        })

        return NextResponse.json(mappedProducts)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { store: true }
        })

        const isAdmin = user?.role === 'admin' || user?.email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (!user?.store) {
            return NextResponse.json({ error: 'Admin user must have a store profile to create products' }, { status: 400 })
        }

        const body = await request.json()

        // Basic validation
        if (!body.title || !body.price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const product = await prisma.product.create({
            data: {
                name: body.title,
                description: body.description || '',
                price: parseFloat(body.price),
                mrp: body.mrp ? parseFloat(body.mrp) : 0,
                category: body.category || 'Uncategorized',
                images: body.cover_images || [],
                inStock: body.stock !== undefined ? parseInt(body.stock) : 100, // Default stock
                storeId: user.store.id,
                // Add default properties if needed
                isTrending: false
            }
        })

        return NextResponse.json(product)

    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}
