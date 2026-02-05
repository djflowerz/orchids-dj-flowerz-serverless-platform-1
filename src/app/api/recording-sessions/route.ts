
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { runQueryOnEdge, createDocumentOnEdge } from "@/lib/firestore-edge"

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationType = searchParams.get('locationType')
        const equipmentTier = searchParams.get('equipmentTier')

        const filters: any[] = []
        filters.push({
            fieldFilter: { field: { fieldPath: 'isActive' }, op: 'EQUAL', value: { booleanValue: true } }
        })

        if (locationType) {
            filters.push({
                fieldFilter: { field: { fieldPath: 'locationType' }, op: 'EQUAL', value: { stringValue: locationType } }
            })
        }
        if (equipmentTier) {
            filters.push({
                fieldFilter: { field: { fieldPath: 'equipmentTier' }, op: 'EQUAL', value: { stringValue: equipmentTier } }
            })
        }

        const structuredQuery = {
            from: [{ collectionId: 'recordingSessions' }],
            where: {
                compositeFilter: {
                    op: 'AND',
                    filters: filters
                }
            },
            orderBy: [{ field: { fieldPath: 'basePrice' }, direction: 'ASCENDING' }]
        }

        const sessions = await runQueryOnEdge('recordingSessions', structuredQuery)
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

        const data = {
            name,
            description,
            locationType,
            basePrice: parseFloat(basePrice),
            equipmentTier,
            duration: duration ? parseInt(duration) : null,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            includesEditing: includesEditing || false,
            includesMastering: includesMastering || false,
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : 1,
            isActive: true,
            createdAt: new Date().toISOString()
        }

        const id = await createDocumentOnEdge('recordingSessions', data)
        return NextResponse.json({ id, ...data })

    } catch (error: any) {
        console.error("Error creating recording session:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create session" },
            { status: error.message === 'Admin access required' ? 401 : 500 }
        )
    }
}
