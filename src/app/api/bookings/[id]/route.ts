import { runQueryOnEdge, updateDocumentOnEdge } from "@/lib/firestore-edge"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth"

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth()
        const { id } = await params

        const query = {
            from: [{ collectionId: 'recording_bookings' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'id' },
                    op: 'EQUAL',
                    value: { stringValue: id }
                }
            },
            limit: 1
        };

        const bookings = await runQueryOnEdge('recording_bookings', query);
        const booking = bookings[0] || null;

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 })
        }

        // Allow owner or admin
        const isUserAdmin = await requireAdmin().catch(() => false);
        if (booking.user_id !== user.id && !isUserAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Fetch session details
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
            booking.session = sessions[0] || null;
        }

        // Fetch user details
        if (booking.user_id) {
            const userQuery = {
                from: [{ collectionId: 'users' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'id' },
                        op: 'EQUAL',
                        value: { stringValue: booking.user_id }
                    }
                },
                limit: 1
            };
            const users = await runQueryOnEdge('users', userQuery);
            booking.user = users[0] || null;
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

        const query = {
            from: [{ collectionId: 'recording_bookings' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'id' },
                    op: 'EQUAL',
                    value: { stringValue: id }
                }
            },
            limit: 1
        };

        const bookings = await runQueryOnEdge('recording_bookings', query);
        const booking = bookings[0] || null;

        if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const isUserAdmin = await requireAdmin().catch(() => false);

        // User can only cancel pending bookings
        if (body.status === 'CANCELLED' && !isUserAdmin) {
            if (booking.user_id !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        } else if (isUserAdmin) {
            // Admin can update anything
        } else {
            // Regular user trying to change something other than cancelling
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const updated = await updateDocumentOnEdge('recording_bookings', id, body)

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update booking" },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        )
    }
}
