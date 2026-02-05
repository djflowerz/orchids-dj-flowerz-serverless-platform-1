import { NextRequest, NextResponse } from 'next/server'
import { runQueryOnEdge, createDocumentOnEdge, updateDocumentOnEdge, deleteDocumentOnEdge } from '@/lib/firestore-edge'
import { requireAdmin, getCurrentUser } from '@/lib/auth'

export const runtime = 'edge';

// GET /api/music-pool - List music pool tracks
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const all = searchParams.get('all') === 'true'
        const tier = searchParams.get('tier')
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
        const active = searchParams.get('active') === 'true'

        const filters: any[] = []

        if (!all) {
            filters.push({
                fieldFilter: {
                    field: { fieldPath: 'is_active' },
                    op: 'EQUAL',
                    value: { booleanValue: true }
                }
            })
        }

        if (tier && tier !== 'All') {
            filters.push({
                fieldFilter: {
                    field: { fieldPath: 'tier' },
                    op: 'EQUAL',
                    value: { stringValue: tier }
                }
            })
        }

        const query: any = {
            from: [{ collectionId: 'music_pool' }],
            orderBy: [{ field: { fieldPath: 'created_at' }, direction: 'DESCENDING' }]
        }

        if (filters.length > 0) {
            query.where = filters.length === 1 ? filters[0] : {
                compositeFilter: {
                    op: 'AND',
                    filters
                }
            }
        }

        if (limit) {
            query.limit = limit
        }

        const tracks = await runQueryOnEdge('music_pool', query)

        return NextResponse.json(tracks)
    } catch (error) {
        console.error('Error fetching music pool tracks:', error)
        return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 })
    }
}

// POST /api/music-pool - Create new track (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const {
            title, artist, genre, bpm, trackLink, coverImage, tier,
            musicKey, version, isActive, releaseDate
        } = body

        if (!title || !artist || !trackLink || !tier) {
            return NextResponse.json({ error: 'Title, artist, track link, and tier are required' }, { status: 400 })
        }

        const track = await createDocumentOnEdge('music_pool', {
            title,
            artist,
            genre,
            bpm: bpm ? parseInt(bpm) : 0,
            track_link: trackLink,
            audio_file_path: trackLink,
            cover_image: coverImage || '',
            tier,
            music_key: musicKey,
            version,
            is_active: isActive !== undefined ? isActive : true,
            release_date: releaseDate || null,
            downloads: 0,
            created_at: new Date().toISOString()
        })

        return NextResponse.json(track)
    } catch (error: any) {
        console.error('Error creating track:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create track' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

// PUT /api/music-pool - Update track (admin only)
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
        }

        const firestoreData: any = {}
        if (updateData.title !== undefined) firestoreData.title = updateData.title
        if (updateData.artist !== undefined) firestoreData.artist = updateData.artist
        if (updateData.genre !== undefined) firestoreData.genre = updateData.genre
        if (updateData.bpm !== undefined) firestoreData.bpm = parseInt(updateData.bpm)
        if (updateData.trackLink !== undefined) {
            firestoreData.track_link = updateData.trackLink
            firestoreData.audio_file_path = updateData.trackLink
        }
        if (updateData.coverImage !== undefined) firestoreData.cover_image = updateData.coverImage
        if (updateData.tier !== undefined) firestoreData.tier = updateData.tier
        if (updateData.musicKey !== undefined) firestoreData.music_key = updateData.musicKey
        if (updateData.version !== undefined) firestoreData.version = updateData.version
        if (updateData.isActive !== undefined) firestoreData.is_active = updateData.isActive
        if (updateData.releaseDate !== undefined) firestoreData.release_date = updateData.releaseDate

        const track = await updateDocumentOnEdge('music_pool', id, firestoreData)

        return NextResponse.json(track)
    } catch (error: any) {
        console.error('Error updating track:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update track' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

// DELETE /api/music-pool - Delete track (admin only)
export async function DELETE(request: NextRequest) {
    try {
        await requireAdmin()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
        }

        await deleteDocumentOnEdge('music_pool', id)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting track:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete track' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}
