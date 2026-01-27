import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Product } from '@prisma/client'

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
                }
            }
        })

        // Map to frontend interface
        const mappedProducts = products.map(p => ({
            id: p.id,
            title: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            cover_images: p.images,
            image_url: p.images[0] || null,
            is_trending: p.isTrending,
            is_free: p.price === 0,
            in_stock: p.inStock,
            created_at: p.createdAt.toISOString(),
            store: p.store
        }))

        return NextResponse.json(mappedProducts)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}
