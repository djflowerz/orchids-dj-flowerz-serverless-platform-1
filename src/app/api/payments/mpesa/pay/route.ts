import { NextResponse } from 'next/server';
import { runQueryOnEdge, updateDocumentOnEdge } from '@/lib/firestore-edge';
import { initiateStkPush } from '@/lib/mpesa';
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'edge';

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

        // Find booking
        const query = {
            from: [{ collectionId: 'recording_bookings' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'id' },
                    op: 'EQUAL',
                    value: { stringValue: bookingId }
                }
            },
            limit: 1
        };

        const bookings = await runQueryOnEdge('recording_bookings', query);
        const booking = bookings[0] || null;

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Ensure the user owns the booking
        if (booking.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (booking.is_paid) {
            return NextResponse.json(
                { error: 'Booking is already paid' },
                { status: 400 }
            );
        }

        // Fetch session details
        let sessionName = 'Recording Session';
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
            if (sessions[0]) {
                sessionName = sessions[0].name || sessionName;
            }
        }

        // Construct Callback URL - MUST be https
        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://djflowerz-site.pages.dev';
        const callbackUrl = `${origin}/api/payments/mpesa/callback`;

        // Initiate STK Push
        const stkResponse = await initiateStkPush({
            phoneNumber,
            amount: booking.total_price,
            accountReference: sessionName.substring(0, 12), // Max 12 chars
            transactionDesc: `Pay for Booking ${booking.id.substring(0, 8)}`,
            callbackUrl,
        });

        // Store CheckoutRequestID in paymentReference temporarily
        await updateDocumentOnEdge('recording_bookings', bookingId, {
            payment_reference: stkResponse.CheckoutRequestID,
            payment_method: 'MPESA'
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
