import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await prisma.recordingSession.findUnique({
            where: { id }
        })

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        return NextResponse.json(session)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await params
        const body = await request.json()

        // Clean up numeric fields
        if (body.basePrice) body.basePrice = parseFloat(body.basePrice)
        if (body.hourlyRate) body.hourlyRate = parseFloat(body.hourlyRate)
        if (body.duration) body.duration = parseInt(body.duration)
        if (body.maxParticipants) body.maxParticipants = parseInt(body.maxParticipants)

        const session = await prisma.recordingSession.update({
            where: { id },
            data: body
        })

        return NextResponse.json(session)
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update session" },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await params

        await prisma.recordingSession.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to delete session" },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        )
    }
}
