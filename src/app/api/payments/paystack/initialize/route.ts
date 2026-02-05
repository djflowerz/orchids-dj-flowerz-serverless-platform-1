import { NextRequest, NextResponse } from 'next/server';
import { runQueryOnEdge, updateDocumentOnEdge } from '@/lib/firestore-edge';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId, email } = await request.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
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

        if (booking.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (booking.is_paid) {
            return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
        }

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

        // Paystack Initialization
        const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK;
        if (!secretKey) throw new Error("Paystack Secret Key missing");

        // Amount is in KES. Paystack expects KES amounts in kobo/cents (x100)
        const amountInCents = Math.round(booking.total_price * 100);

        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://djflowerz-site.pages.dev';
        const callbackUrl = `${origin}/payment-success?bookingId=${booking.id}`;

        const userEmail = user.emailAddresses?.[0]?.emailAddress;

        const paystackBody = {
            email: email || userEmail,
            amount: amountInCents,
            currency: "KES",
            callback_url: callbackUrl,
            repo: "dj-flowerz-web",
            metadata: {
                booking_id: booking.id,
                user_id: user.id,
                type: 'booking',
                custom_fields: [
                    {
                        display_name: "Session Name",
                        variable_name: "session_name",
                        value: sessionName
                    }
                ]
            }
        };

        const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paystackBody)
        });

        const data = await res.json();

        if (!data.status) {
            throw new Error(data.message || 'Paystack initialization failed');
        }

        // Save reference
        await updateDocumentOnEdge('recording_bookings', bookingId, {
            payment_reference: data.data.reference,
            payment_method: 'PAYSTACK'
        });

        return NextResponse.json({
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference
        });

    } catch (error: any) {
        console.error("Paystack Init Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to initiate payment" },
            { status: 500 }
        );
    }
}
