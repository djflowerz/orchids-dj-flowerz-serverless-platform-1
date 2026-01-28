import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        console.log('M-Pesa Callback Data:', JSON.stringify(data, null, 2));

        const { Body } = data;

        if (!Body || !Body.stkCallback) {
            console.error('Invalid M-Pesa Callback Data');
            return NextResponse.json({ error: 'Invalid Data' }, { status: 400 });
        }

        const { stkCallback } = Body;
        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

        if (ResultCode === 0) {
            // Payment Successful
            let mpesaReceiptNumber = '';

            // Extract Receipt Number
            if (CallbackMetadata && CallbackMetadata.Item) {
                const receiptItem = CallbackMetadata.Item.find(
                    (item: any) => item.Name === 'MpesaReceiptNumber'
                );
                if (receiptItem) {
                    mpesaReceiptNumber = receiptItem.Value;
                }
            }

            // Update Booking
            // We look for the booking with the matching CheckoutRequestID stored in paymentReference
            // This presumes we stored it there in the initialization step
            const booking = await prisma.recordingBooking.findFirst({
                where: {
                    paymentReference: CheckoutRequestID,
                },
            });

            if (booking) {
                // Find user to get email - need to fetch user relation
                const updatedBooking = await prisma.recordingBooking.update({
                    where: { id: booking.id },
                    data: {
                        isPaid: true,
                        status: 'CONFIRMED',
                        paymentReference: mpesaReceiptNumber || CheckoutRequestID,
                    },
                    include: {
                        user: true,
                        session: true,
                    }
                });

                console.log(`Booking ${booking.id} marked as paid.`);

                // Send Payment Received Email
                try {
                    const { resend, FROM_EMAIL } = await import('@/lib/resend');
                    const { PaymentReceivedEmail } = await import('@/emails/PaymentReceivedEmail');

                    await resend.emails.send({
                        from: FROM_EMAIL,
                        to: updatedBooking.user.email,
                        subject: 'Payment Received - DJ Flowerz Studios',
                        react: PaymentReceivedEmail({
                            customerName: updatedBooking.user.name || 'Valued Customer',
                            sessionName: updatedBooking.session.name,
                            bookingDate: new Date(updatedBooking.scheduledDate).toLocaleDateString(),
                            bookingTime: updatedBooking.scheduledTime,
                            amount: updatedBooking.totalPrice,
                            receiptNumber: mpesaReceiptNumber || CheckoutRequestID,
                        }),
                    });
                } catch (emailError) {
                    console.error('Failed to send payment email:', emailError);
                }

            } else {
                console.error(`Booking not found for CheckoutRequestID: ${CheckoutRequestID}`);
            }

        } else {
            // Payment Failed or Cancelled
            console.warn(`Payment failed for CheckoutRequestID: ${CheckoutRequestID}. Reason: ${ResultDesc}`);
            // Optional: Update booking status to 'CANCELLED' or logged failure
        }

        return NextResponse.json({ result: 'queued' });

    } catch (error) {
        console.error('M-Pesa Callback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
