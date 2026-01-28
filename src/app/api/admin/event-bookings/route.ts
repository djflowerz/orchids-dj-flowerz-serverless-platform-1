
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const booking = await prisma.eventBooking.findUnique({
                where: { id }
            });
            return NextResponse.json(booking);
        }

        const bookings = await prisma.eventBooking.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Map fields to match frontend expectation (snake_case)
        const formattedBookings = bookings.map(b => ({
            id: b.id,
            customer_name: b.customerName,
            email: b.email,
            phone: b.phone,
            event_type: b.eventType,
            event_date: b.eventDate.toISOString(),
            event_time: b.eventTime,
            location: b.location,
            status: b.status,
            amount: b.amount,
            notes: b.notes,
            assigned_dj: b.assignedDj,
            created_at: b.createdAt.toISOString()
        }));

        return NextResponse.json(formattedBookings);
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

        // Convert snake_case from frontend to camelCase for Prisma
        const data = {
            customerName: body.customer_name,
            email: body.email,
            phone: body.phone,
            eventType: body.event_type,
            eventDate: new Date(body.event_date),
            eventTime: body.event_time,
            location: body.location,
            status: body.status || 'pending',
            amount: parseFloat(body.amount),
            notes: body.notes,
            assignedDj: body.assigned_dj
        };

        const booking = await prisma.eventBooking.create({
            data
        });

        const formatted = {
            id: booking.id,
            customer_name: booking.customerName,
            email: booking.email,
            phone: booking.phone,
            event_type: booking.eventType,
            event_date: booking.eventDate.toISOString(),
            event_time: booking.eventTime,
            location: booking.location,
            status: booking.status,
            amount: booking.amount,
            notes: booking.notes,
            assigned_dj: booking.assignedDj,
            created_at: booking.createdAt.toISOString()
        };

        return NextResponse.json(formatted);
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

        // Map updates
        const data: any = {};
        if (updateData.customer_name) data.customerName = updateData.customer_name;
        if (updateData.email) data.email = updateData.email;
        if (updateData.phone) data.phone = updateData.phone;
        if (updateData.event_type) data.eventType = updateData.event_type;
        if (updateData.event_date) data.eventDate = new Date(updateData.event_date);
        if (updateData.event_time) data.eventTime = updateData.event_time;
        if (updateData.location) data.location = updateData.location;
        if (updateData.status) data.status = updateData.status;
        if (updateData.amount) data.amount = parseFloat(updateData.amount);
        if (updateData.notes) data.notes = updateData.notes;
        if (updateData.assigned_dj) data.assignedDj = updateData.assigned_dj;

        const booking = await prisma.eventBooking.update({
            where: { id },
            data
        });

        const formatted = {
            id: booking.id,
            customer_name: booking.customerName,
            email: booking.email,
            phone: booking.phone,
            event_type: booking.eventType,
            event_date: booking.eventDate.toISOString(),
            event_time: booking.eventTime,
            location: booking.location,
            status: booking.status,
            amount: booking.amount,
            notes: booking.notes,
            assigned_dj: booking.assignedDj,
            created_at: booking.createdAt.toISOString()
        };

        return NextResponse.json(formatted);

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

        await prisma.eventBooking.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Event Delete Error]", error);
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
