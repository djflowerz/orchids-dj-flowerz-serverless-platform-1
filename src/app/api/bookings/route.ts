import { runQueryOnEdge, createDocumentOnEdge } from "@/lib/firestore-edge"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth()

        const query = {
            from: [{ collectionId: 'recording_bookings' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'user_id' },
                    op: 'EQUAL',
                    value: { stringValue: user.id }
                }
            },
            orderBy: [{ field: { fieldPath: 'scheduled_date' }, direction: 'DESCENDING' }]
        };

        const bookings = await runQueryOnEdge('recording_bookings', query)

        // Fetch session details for each booking
        const bookingsWithSessions = await Promise.all(
            bookings.map(async (booking) => {
                if (booking.session_id) {
                    const sessionQuery = {
                        from: [{ collectionId: 'recording_sessions' }],
                        where: {
                            fieldFilter: {
                                field: { fieldPath: 'id' },
                                op: 'EQUAL',
                                value: { stringValue: booking.session_id }
                            }
                        },
                        limit: 1
                    };
                    const sessions = await runQueryOnEdge('recording_sessions', sessionQuery);
                    return { ...booking, session: sessions[0] || null };
                }
                return booking;
            })
        );

        return NextResponse.json(bookingsWithSessions)
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

        const booking = await createDocumentOnEdge('recording_bookings', {
            user_id: user.id,
            session_id: sessionId,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            duration: parseInt(duration),
            location,
            equipment_needs: equipmentNeeds ? JSON.stringify(equipmentNeeds) : null,
            notes,
            total_price: parseFloat(totalPrice),
            payment_method: paymentMethod,
            status: 'PENDING',
            created_at: new Date().toISOString()
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
