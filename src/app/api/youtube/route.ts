import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-server'

export const runtime = 'edge'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ''

// GET /api/youtube - Get all YouTube videos
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get('active') === 'true'

        const where = activeOnly ? { isActive: true } : {}

        const videos = await prisma.youTubeVideo.findMany({
            where,
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json(videos)
    } catch (error) {
        console.error('Error fetching YouTube videos:', error)
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
    }
}

// POST /api/youtube - Create new YouTube video
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        // Check if user is admin
        if (!session?.user || session.user.email !== 'ianmuriithiflowerz@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, videoId, embedUrl, thumbnail, description, isActive, order } = body

        if (!title || !videoId || !embedUrl) {
            return NextResponse.json({ error: 'Title, videoId, and embedUrl are required' }, { status: 400 })
        }

        const video = await prisma.youTubeVideo.create({
            data: {
                title,
                videoId,
                embedUrl,
                thumbnail,
                description,
                isActive: isActive ?? true,
                order: order ?? 0
            }
        })

        return NextResponse.json(video)
    } catch (error) {
        console.error('Error creating YouTube video:', error)
        return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
    }
}

// PUT /api/youtube - Update YouTube video
export async function PUT(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user || session.user.email !== 'ianmuriithiflowerz@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, ...data } = body

        if (!id) {
            return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
        }

        const video = await prisma.youTubeVideo.update({
            where: { id },
            data
        })

        return NextResponse.json(video)
    } catch (error) {
        console.error('Error updating YouTube video:', error)
        return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
    }
}

// DELETE /api/youtube - Delete YouTube video
export async function DELETE(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session?.user || session.user.email !== 'ianmuriithiflowerz@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
        }

        await prisma.youTubeVideo.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting YouTube video:', error)
        return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
    }
}
