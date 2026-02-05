
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { runQueryOnEdge, createDocumentOnEdge, updateDocumentOnEdge, deleteDocumentOnEdge } from '@/lib/firestore-edge'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const all = searchParams.get('all') === 'true'
        const limitStr = searchParams.get('limit')
        const limit = limitStr ? parseInt(limitStr) : 50

        const structuredQuery: any = {
            from: [{ collectionId: 'mixtapes' }],
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
            limit: limit
        }

        if (!all) {
            structuredQuery.where = {
                fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'active' }
                }
            }
        }

        const mixtapes = await runQueryOnEdge('mixtapes', structuredQuery)

        // Map to frontend format
        const formattedMixtapes = mixtapes.map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            coverImage: m.coverImage,
            cover_image: m.coverImage,
            mixLink: m.mixLink,
            audio_url: m.audioUrl,
            video_url: m.videoUrl,
            genre: m.genre,
            price: m.price,
            isFree: m.isFree,
            plays: m.plays || 0,
            status: m.status,
            created_at: m.createdAt,
            audio_download_url: m.audioDownloadUrl,
            video_download_url: m.videoDownloadUrl,
            embed_url: m.embedUrl,
            is_hot: m.isHot,
            is_new_arrival: m.isNewArrival
        }))

        return NextResponse.json(formattedMixtapes)

    } catch (error) {
        console.error('Error fetching mixtapes:', error)
        return NextResponse.json({ error: 'Failed to fetch mixtapes' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const {
            title, description, coverImage, mixLink, audioUrl, videoUrl,
            genre, price, isFree, status, audioDownloadUrl,
            videoDownloadUrl, embedUrl, isHot, isNewArrival
        } = body

        const data = {
            title,
            description,
            coverImage,
            mixLink,
            audioUrl,
            videoUrl,
            genre,
            price: price ? parseFloat(price) : 0,
            isFree: isFree !== undefined ? isFree : true,
            status: status || 'active',
            audioDownloadUrl,
            videoDownloadUrl,
            embedUrl,
            isHot: isHot || false,
            isNewArrival: isNewArrival || false,
            createdAt: new Date().toISOString(),
            plays: 0
        }

        const id = await createDocumentOnEdge('mixtapes', data)
        return NextResponse.json({ id, ...data })

    } catch (error: any) {
        console.error('Error creating mixtape:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create mixtape' },
            { status: error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) return NextResponse.json({ error: 'Mixtape ID is required' }, { status: 400 })

        // Clean data
        const data: any = {}
        const fields = [
            'title', 'description', 'coverImage', 'mixLink', 'audioUrl', 'videoUrl',
            'genre', 'price', 'isFree', 'status', 'audioDownloadUrl',
            'videoDownloadUrl', 'embedUrl', 'isHot', 'isNewArrival'
        ]

        for (const field of fields) {
            if (updateData[field] !== undefined) data[field] = updateData[field]
        }
        if (data.price) data.price = parseFloat(data.price)

        const updated = await updateDocumentOnEdge('mixtapes', id, data)
        return NextResponse.json(updated)

    } catch (error: any) {
        console.error('Error updating mixtape:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update mixtape' },
            { status: error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await requireAdmin()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Mixtape ID is required' }, { status: 400 })

        await deleteDocumentOnEdge('mixtapes', id)
        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error deleting mixtape:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete mixtape' },
            { status: error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}
