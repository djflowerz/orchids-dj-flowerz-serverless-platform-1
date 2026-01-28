import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/auth'

// GET /api/music-pool - List music pool tracks
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const all = searchParams.get('all') === 'true'
        const tier = searchParams.get('tier')
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
        const active = searchParams.get('active') === 'true'

        let where: any = {}

        if (!all) {
            where.isActive = true
        }

        if (tier && tier !== 'All') {
            where.tier = tier
        }

        const tracks = await prisma.musicPoolTrack.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            ...(limit ? { take: limit } : {})
        })

        // Map to frontend format
        const formattedTracks = tracks.map((t: typeof tracks[number]) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            genre: t.genre,
            bpm: t.bpm,
            trackLink: t.trackLink,
            audio_file_path: t.trackLink, // For compatibility
            coverImage: t.coverImage,
            cover_image: t.coverImage, // For compatibility
            tier: t.tier,
            downloads: t.downloads,
            music_key: t.musicKey,
            version: t.version,
            is_active: t.isActive,
            release_date: t.releaseDate?.toISOString(),
            created_at: t.createdAt.toISOString()
        }))

        return NextResponse.json(formattedTracks)
    } catch (error) {
        console.error('Error fetching music pool tracks:', error)
        return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 })
    }
}

// POST /api/music-pool - Create new track (admin only)
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

        const track = await prisma.musicPoolTrack.create({
            data: {
                title,
                artist,
                genre,
                bpm: bpm ? parseInt(bpm) : 0,
                trackLink,
                coverImage: coverImage || '',
                tier,
                musicKey,
                version,
                isActive: isActive !== undefined ? isActive : true,
                releaseDate: releaseDate ? new Date(releaseDate) : undefined
            }
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
// PUT /api/music-pool - Update track (admin only)
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
        }

        const prismaData: any = {}
        if (updateData.title !== undefined) prismaData.title = updateData.title
        if (updateData.artist !== undefined) prismaData.artist = updateData.artist
        if (updateData.genre !== undefined) prismaData.genre = updateData.genre
        if (updateData.bpm !== undefined) prismaData.bpm = parseInt(updateData.bpm)
        if (updateData.trackLink !== undefined) prismaData.trackLink = updateData.trackLink
        if (updateData.coverImage !== undefined) prismaData.coverImage = updateData.coverImage
        if (updateData.tier !== undefined) prismaData.tier = updateData.tier
        if (updateData.musicKey !== undefined) prismaData.musicKey = updateData.musicKey
        if (updateData.version !== undefined) prismaData.version = updateData.version
        if (updateData.isActive !== undefined) prismaData.isActive = updateData.isActive
        if (updateData.releaseDate !== undefined) prismaData.releaseDate = new Date(updateData.releaseDate)

        const track = await prisma.musicPoolTrack.update({
            where: { id },
            data: prismaData
        })

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

        await prisma.musicPoolTrack.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting track:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete track' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}
