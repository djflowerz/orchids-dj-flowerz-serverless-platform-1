import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/mixtapes - List all mixtapes (public) or admin view
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const all = searchParams.get('all') === 'true'
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

        const where: any = all ? {} : { status: 'active' }

        const mixtapes = await prisma.mixtape.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            ...(limit ? { take: limit } : {})
        })

        // Map to frontend format (camelCase to snake_case for compatibility)
        const formattedMixtapes = mixtapes.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            coverImage: m.coverImage,
            cover_image: m.coverImage, // Alias for compatibility
            mixLink: m.mixLink,
            audio_url: m.audioUrl,
            video_url: m.videoUrl,
            genre: m.genre,
            price: m.price,
            isFree: m.isFree,
            plays: m.plays,
            status: m.status,
            created_at: m.createdAt.toISOString(),
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

// POST /api/mixtapes - Create new mixtape (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const {
            title,
            description,
            coverImage,
            mixLink,
            audioUrl,
            videoUrl,
            genre,
            price,
            isFree,
            status,
            audioDownloadUrl,
            videoDownloadUrl,
            embedUrl,
            isHot,
            isNewArrival
        } = body

        const mixtape = await prisma.mixtape.create({
            data: {
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
                isNewArrival: isNewArrival || false
            }
        })

        return NextResponse.json(mixtape)
    } catch (error: any) {
        console.error('Error creating mixtape:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create mixtape' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

// PUT /api/mixtapes - Update mixtape (admin only)
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Mixtape ID is required' }, { status: 400 })
        }

        // Convert camelCase fields if needed
        const prismaData: any = {}
        if (updateData.title !== undefined) prismaData.title = updateData.title
        if (updateData.description !== undefined) prismaData.description = updateData.description
        if (updateData.coverImage !== undefined) prismaData.coverImage = updateData.coverImage
        if (updateData.mixLink !== undefined) prismaData.mixLink = updateData.mixLink
        if (updateData.audioUrl !== undefined) prismaData.audioUrl = updateData.audioUrl
        if (updateData.videoUrl !== undefined) prismaData.videoUrl = updateData.videoUrl
        if (updateData.genre !== undefined) prismaData.genre = updateData.genre
        if (updateData.price !== undefined) prismaData.price = parseFloat(updateData.price)
        if (updateData.isFree !== undefined) prismaData.isFree = updateData.isFree
        if (updateData.status !== undefined) prismaData.status = updateData.status
        if (updateData.audioDownloadUrl !== undefined) prismaData.audioDownloadUrl = updateData.audioDownloadUrl
        if (updateData.videoDownloadUrl !== undefined) prismaData.videoDownloadUrl = updateData.videoDownloadUrl
        if (updateData.embedUrl !== undefined) prismaData.embedUrl = updateData.embedUrl
        if (updateData.isHot !== undefined) prismaData.isHot = updateData.isHot
        if (updateData.isNewArrival !== undefined) prismaData.isNewArrival = updateData.isNewArrival

        const mixtape = await prisma.mixtape.update({
            where: { id },
            data: prismaData
        })

        return NextResponse.json(mixtape)
    } catch (error: any) {
        console.error('Error updating mixtape:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update mixtape' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}

// DELETE /api/mixtapes - Delete mixtape (admin only)
export async function DELETE(request: NextRequest) {
    try {
        await requireAdmin()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Mixtape ID is required' }, { status: 400 })
        }

        await prisma.mixtape.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting mixtape:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete mixtape' },
            { status: error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 401 : 500 }
        )
    }
}
