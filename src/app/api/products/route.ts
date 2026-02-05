
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { runQueryOnEdge, createDocumentOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

// Interface matching frontend expectations
interface ProductResult {
    id: string
    title: string
    description: string
    price: number
    category: string
    cover_images: string[]
    image_url: string | null
    is_trending: boolean
    is_free: boolean
    in_stock: boolean
    created_at: string
    store: any
    average_rating: number
    review_count: number
    popularity_score: number
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const trending = searchParams.get('trending') === 'true'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    try {
        const filters: any[] = []

        if (trending) {
            filters.push({
                fieldFilter: {
                    field: { fieldPath: 'isTrending' },
                    op: 'EQUAL',
                    value: { booleanValue: true }
                }
            })
        }

        if (category && category !== 'All') {
            filters.push({
                fieldFilter: {
                    field: { fieldPath: 'category' },
                    op: 'EQUAL',
                    value: { stringValue: category }
                }
            })
        }

        const structuredQuery: any = {
            from: [{ collectionId: 'products' }],
            limit: limit,
            offset: offset,
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

        // Search workaround: Firestore doesn't support basic substring search.
        // We will filter in memory if search is present, OR basic prefix if needed.
        // For now, ignoring search at query level, relying on client or simplified logic.

        const rawProducts = await runQueryOnEdge('products', structuredQuery)

        const mappedProducts: ProductResult[] = rawProducts.map((p: any) => {
            // Handle Denormalized store or fallback
            const store = p.store || { name: 'DJ Flowerz', username: 'djflowerz' }

            // Calculate fields
            const stockCount = typeof p.inStock === 'number' ? p.inStock : 100
            const ratings = p.ratings || [] // Assuming ratings might be array if small, or using subcollection (ignoring for list view)
            const avgRating = ratings.length ? ratings.reduce((a: number, b: any) => a + b.rating, 0) / ratings.length : 0

            return {
                id: p.id,
                title: p.name || p.title || 'Untitled',
                description: p.description || '',
                price: Number(p.price) || 0,
                category: p.category || 'Uncategorized',
                cover_images: Array.isArray(p.images) ? p.images : [],
                image_url: Array.isArray(p.images) ? p.images[0] : null,
                is_trending: !!p.isTrending,
                is_free: p.price === 0,
                in_stock: stockCount > 0,
                created_at: p.createdAt || new Date().toISOString(),
                store: store,
                average_rating: avgRating,
                review_count: ratings.length,
                popularity_score: stockCount // Simplified
            }
        })

        if (search) {
            // In-memory filter for search (simple)
            const lowerSearch = search.toLowerCase()
            const filtered = mappedProducts.filter(p =>
                p.title.toLowerCase().includes(lowerSearch) ||
                p.description.toLowerCase().includes(lowerSearch)
            )
            return NextResponse.json(filtered)
        }

        return NextResponse.json(mappedProducts)

    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = auth()
        const user = await currentUser()

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check using Clerk Metadata or Email
        const email = user.emailAddresses[0]?.emailAddress
        const isAdmin = user.publicMetadata?.role === 'admin' || email === 'ianmuriithiflowerz@gmail.com'

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()

        if (!body.title || !body.price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const productData = {
            name: body.title,
            description: body.description || '',
            price: parseFloat(body.price),
            mrp: body.mrp ? parseFloat(body.mrp) : 0,
            category: body.category || 'Uncategorized',
            images: body.cover_images || [],
            inStock: body.stock !== undefined ? parseInt(body.stock) : 100,
            storeId: 'admin-store', // Default or fetch from user metadata
            store: {
                name: 'DJ Flowerz Store',
                username: 'djflowerz'
            },
            isTrending: false,
            createdAt: new Date()
        }

        const newId = await createDocumentOnEdge('products', productData)

        return NextResponse.json({ id: newId, ...productData })

    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}
