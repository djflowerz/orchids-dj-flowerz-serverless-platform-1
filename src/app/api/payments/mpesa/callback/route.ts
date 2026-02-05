import { NextResponse } from 'next/server';
import { runQueryOnEdge, updateDocumentOnEdge } from '@/lib/firestore-edge';

export const runtime = 'edge';

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

            // Find booking with matching CheckoutRequestID
            const query = {
                from: [{ collectionId: 'recording_bookings' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'payment_reference' },
                        op: 'EQUAL',
                        value: { stringValue: CheckoutRequestID }
                    }
                },
                limit: 1
            };

            const bookings = await runQueryOnEdge('recording_bookings', query);
            const booking = bookings[0] || null;

            if (booking) {
                // Update booking status
                await updateDocumentOnEdge('recording_bookings', booking.id, {
                    is_paid: true,
                    status: 'CONFIRMED',
                    payment_reference: mpesaReceiptNumber || CheckoutRequestID
                });

                console.log(`Booking ${booking.id} marked as paid.`);

                // Note: Email sending removed as Resend was removed from dependencies
                // You can implement email notifications using a different service if needed

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
