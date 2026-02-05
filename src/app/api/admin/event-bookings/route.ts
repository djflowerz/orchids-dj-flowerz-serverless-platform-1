import { NextResponse } from "next/server";
import { runQueryOnEdge, createDocumentOnEdge, updateDocumentOnEdge, deleteDocumentOnEdge } from "@/lib/firestore-edge";
import { requireAdmin } from "@/lib/auth";

export const runtime = 'edge';

export async function GET(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const query = {
                from: [{ collectionId: 'event_bookings' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'id' },
                        op: 'EQUAL',
                        value: { stringValue: id }
                    }
                },
                limit: 1
            };
            const results = await runQueryOnEdge('event_bookings', query);
            return NextResponse.json(results[0] || null);
        }

        const query = {
            from: [{ collectionId: 'event_bookings' }],
            orderBy: [{ field: { fieldPath: 'created_at' }, direction: 'DESCENDING' }]
        };

        const bookings = await runQueryOnEdge('event_bookings', query);

        return NextResponse.json(bookings);
    } catch (error: any) {
        console.error("[Event Bookings API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const data = {
            customer_name: body.customer_name,
            email: body.email,
            phone: body.phone,
            event_type: body.event_type,
            event_date: body.event_date,
            event_time: body.event_time,
            location: body.location,
            status: body.status || 'pending',
            amount: parseFloat(body.amount),
            notes: body.notes,
            assigned_dj: body.assigned_dj,
            created_at: new Date().toISOString()
        };

        const booking = await createDocumentOnEdge('event_bookings', data);

        return NextResponse.json(booking);
    } catch (error: any) {
        console.error("[Event Create Error]", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const data: any = {};
        if (updateData.customer_name) data.customer_name = updateData.customer_name;
        if (updateData.email) data.email = updateData.email;
        if (updateData.phone) data.phone = updateData.phone;
        if (updateData.event_type) data.event_type = updateData.event_type;
        if (updateData.event_date) data.event_date = updateData.event_date;
        if (updateData.event_time) data.event_time = updateData.event_time;
        if (updateData.location) data.location = updateData.location;
        if (updateData.status) data.status = updateData.status;
        if (updateData.amount) data.amount = parseFloat(updateData.amount);
        if (updateData.notes) data.notes = updateData.notes;
        if (updateData.assigned_dj) data.assigned_dj = updateData.assigned_dj;

        const booking = await updateDocumentOnEdge('event_bookings', id, data);

        return NextResponse.json(booking);

    } catch (error: any) {
        console.error("[Event Update Error]", error);
        return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await deleteDocumentOnEdge('event_bookings', id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Event Delete Error]", error);
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
