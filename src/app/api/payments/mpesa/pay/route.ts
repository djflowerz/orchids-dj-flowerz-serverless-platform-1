import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiateStkPush } from '@/lib/mpesa';
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId, phoneNumber } = await req.json();

        if (!bookingId || !phoneNumber) {
            return NextResponse.json(
                { error: 'Booking ID and phone number are required' },
                { status: 400 }
            );
        }

        const booking = await prisma.recordingBooking.findUnique({
            where: { id: bookingId },
            include: {
                session: true,
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Ensure the user owns the booking
        if (booking.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (booking.isPaid) {
            return NextResponse.json(
                { error: 'Booking is already paid' },
                { status: 400 }
            );
        }

        // Construct Callback URL - MUST be https
        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://djflowerz-site.pages.dev';
        const callbackUrl = `${origin}/api/payments/mpesa/callback`;

        // Initiate STK Push
        const stkResponse = await initiateStkPush({
            phoneNumber,
            amount: booking.totalPrice,
            accountReference: booking.session.name.substring(0, 12), // Max 12 chars
            transactionDesc: `Pay for Booking ${booking.id.substring(0, 8)}`,
            callbackUrl,
        });

        // Store CheckoutRequestID in paymentReference temporarily
        // We will update this to the actual Receipt Number on callback success
        await prisma.recordingBooking.update({
            where: { id: bookingId },
            data: {
                paymentReference: stkResponse.CheckoutRequestID,
                paymentMethod: 'MPESA',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'STK Push initiated',
            checkoutRequestId: stkResponse.CheckoutRequestID,
        });

    } catch (error: any) {
        console.error('Payment Initiation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initiate payment' },
            { status: 500 }
        );
    }
}
