
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getDocument, updateDocumentOnEdge, deleteDocumentOnEdge } from "@/lib/firestore-edge"

export const runtime = 'edge'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getDocument(`recordingSessions/${id}`)

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
        const data: any = { ...body }
        if (data.basePrice) data.basePrice = parseFloat(data.basePrice)
        if (data.hourlyRate) data.hourlyRate = parseFloat(data.hourlyRate)
        if (data.duration) data.duration = parseInt(data.duration)
        if (data.maxParticipants) data.maxParticipants = parseInt(data.maxParticipants)

        // Remove id if present in body to avoid error
        delete data.id

        const session = await updateDocumentOnEdge('recordingSessions', id, data)

        return NextResponse.json(session)
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update session" },
            { status: error.message === 'Admin access required' ? 401 : 500 }
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

        await deleteDocumentOnEdge('recordingSessions', id)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to delete session" },
            { status: error.message === 'Admin access required' ? 401 : 500 }
        )
    }
}
