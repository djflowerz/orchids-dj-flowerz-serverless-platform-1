import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth, isAdmin } from "@/lib/auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth()
        const { id } = await params

        const booking = await prisma.recordingBooking.findUnique({
            where: { id },
            include: { session: true, user: true }
        })

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 })
        }

        // Allow owner or admin
        if (booking.userId !== user.id && !(await isAdmin(user))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        return NextResponse.json(booking)
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to fetch booking" },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth()
        const { id } = await params
        const body = await request.json()

        const booking = await prisma.recordingBooking.findUnique({ where: { id } })
        if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const isUserAdmin = await isAdmin(user)

        // User can only cancel pending bookings
        if (body.status === 'CANCELLED' && !isUserAdmin) {
            if (booking.userId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        } else if (isUserAdmin) {
            // Admin can update anything
        } else {
            // Regular user trying to change something other than cancelling
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const updated = await prisma.recordingBooking.update({
            where: { id },
            data: body
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update booking" },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        )
    }
}
