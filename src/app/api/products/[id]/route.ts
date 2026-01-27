import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Product } from '@prisma/client'

export const runtime = 'edge'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: params.id },
            include: {
                store: {
                    select: {
                        name: true,
                        username: true,
                        logo: true,
                        email: true
                    }
                },
                ratings: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        userId: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // Map to frontend interface
        const mappedProduct = {
            id: product.id,
            title: product.name,
            description: product.description,
            price: product.price,
            mrp: product.mrp,
            category: product.category,
            cover_images: product.images,
            image_url: product.images[0] || null,
            is_trending: product.isTrending,
            is_free: product.price === 0,
            in_stock: product.inStock,
            created_at: product.createdAt.toISOString(),
            store: product.store,
            ratings: product.ratings,
            average_rating: product.ratings.length > 0
                ? product.ratings.reduce((sum, r) => sum + r.rating, 0) / product.ratings.length
                : 0,
            review_count: product.ratings.length
        }

        return NextResponse.json(mappedProduct)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }
}
