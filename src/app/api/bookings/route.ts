import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth()

        const bookings = await prisma.recordingBooking.findMany({
            where: { userId: user.id },
            include: {
                session: true
            },
            orderBy: { scheduledDate: 'desc' }
        })

        return NextResponse.json(bookings)
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to fetch bookings" },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth()
        const body = await request.json()

        const {
            sessionId,
            scheduledDate,
            scheduledTime,
            duration,
            location,
            equipmentNeeds,
            notes,
            totalPrice,
            paymentMethod
        } = body

        // Verify session availability (basic check)
        // In a real app, we'd check for overlapping bookings here

        const booking = await prisma.recordingBooking.create({
            data: {
                userId: user.id,
                sessionId,
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                duration: parseInt(duration),
                location,
                equipmentNeeds: equipmentNeeds ? JSON.stringify(equipmentNeeds) : null,
                notes,
                totalPrice: parseFloat(totalPrice),
                paymentMethod,
                status: 'PENDING'
            }
        })

        // TODO: Init Payment (M-Pesa) here if needed

        return NextResponse.json(booking)
    } catch (error: any) {
        console.error("Booking error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create booking" },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        )
    }
}
