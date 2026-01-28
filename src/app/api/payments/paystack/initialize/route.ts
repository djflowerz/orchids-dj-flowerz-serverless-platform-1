import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { bookingId, email } = await request.json();

        if (!bookingId) {
            return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
        }

        const booking = await prisma.recordingBooking.findUnique({
            where: { id: bookingId },
            include: { session: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (booking.isPaid) {
            return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
        }

        // Paystack Initialization
        const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK;
        if (!secretKey) throw new Error("Paystack Secret Key missing");

        // Amount is in KES. Paystack expects KES amounts in kobo/cents (x100) if currency is NGN/GHS/ZAR, 
        // BUT for KES, Paystack documentation says: "Amount should be in the subunit of the supported currency".
        // 1 KES = 100 cents. So yes, multiply by 100.
        const amountInCents = Math.round(booking.totalPrice * 100);

        // Callback URL: We want to perform verification or show success.
        // If user has a set callback URL, we can use that, or override.
        // Let's redirect back to the user's bookings page with a success flag, 
        // OR a verification intermediate page.
        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://djflowerz-site.pages.dev';
        const callbackUrl = `${origin}/payment-success?bookingId=${booking.id}`;
        // Or utilize the provided live callback if strictly enforced, but usually override works.

        const paystackBody = {
            email: email || user.email,
            amount: amountInCents,
            currency: "KES",
            callback_url: callbackUrl,
            repo: "dj-flowerz-web", // custom field mainly for internal tracking
            metadata: {
                booking_id: booking.id,
                user_id: user.id,
                type: 'booking', // Key for webhook to identify
                custom_fields: [
                    {
                        display_name: "Session Name",
                        variable_name: "session_name",
                        value: booking.session.name
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
        await prisma.recordingBooking.update({
            where: { id: booking.id },
            data: {
                paymentReference: data.data.reference,
                paymentMethod: 'PAYSTACK'
            }
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
