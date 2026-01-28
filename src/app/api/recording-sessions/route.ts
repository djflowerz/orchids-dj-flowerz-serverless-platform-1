import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationType = searchParams.get('locationType')
        const equipmentTier = searchParams.get('equipmentTier')

        const where: any = {
            isActive: true
        }

        if (locationType) where.locationType = locationType
        if (equipmentTier) where.equipmentTier = equipmentTier

        const sessions = await prisma.recordingSession.findMany({
            where,
            orderBy: {
                basePrice: 'asc'
            }
        })

        return NextResponse.json(sessions)
    } catch (error) {
        console.error("Error fetching recording sessions:", error)
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin()

        const body = await request.json()
        const {
            name,
            description,
            locationType,
            basePrice,
            equipmentTier,
            duration,
            hourlyRate,
            includesEditing,
            includesMastering,
            maxParticipants
        } = body

        const session = await prisma.recordingSession.create({
            data: {
                name,
                description,
                locationType,
                basePrice: parseFloat(basePrice),
                equipmentTier,
                duration: duration ? parseInt(duration) : null,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
                includesEditing: includesEditing || false,
                includesMastering: includesMastering || false,
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : 1
            }
        })

        return NextResponse.json(session)
    } catch (error: any) {
        console.error("Error creating recording session:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create session" },
            { status: error.message === 'Unauthorized' || error.message === 'Admin access required' ? 401 : 500 }
        )
    }
}
