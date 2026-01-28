import * as React from 'react';

interface BookingConfirmationEmailProps {
    customerName: string;
    sessionName: string;
    bookingDate: string;
    bookingTime: string;
    locationType: string;
    totalPrice: number;
    bookingId: string;
}

export const BookingConfirmationEmail: React.FC<BookingConfirmationEmailProps> = ({
    customerName,
    sessionName,
    bookingDate,
    bookingTime,
    locationType,
    totalPrice,
    bookingId,
}) => (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#7c3aed', padding: '20px', textAlign: 'center' }}>
                <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>Booking Confirmed!</h1>
            </div>

            <div style={{ padding: '30px', backgroundColor: '#fff' }}>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    Hi <strong>{customerName}</strong>,
                </p>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    Your recording session booking has been received and is currently <strong>PENDING</strong> payment/confirmation.
                </p>

                <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#7c3aed' }}>Session Details</h3>
                    <p style={{ margin: '5px 0' }}><strong>Session:</strong> {sessionName}</p>
                    <p style={{ margin: '5px 0' }}><strong>Date:</strong> {bookingDate}</p>
                    <p style={{ margin: '5px 0' }}><strong>Time:</strong> {bookingTime}</p>
                    <p style={{ margin: '5px 0' }}><strong>Location:</strong> {locationType.replace('_', ' ')}</p>
                    <p style={{ margin: '5px 0' }}><strong>Total Price:</strong> KES {totalPrice.toLocaleString()}</p>
                    <p style={{ margin: '5px 0' }}><strong>Booking ID:</strong> {bookingId}</p>
                </div>

                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    Please ensure payment is completed via M-Pesa (if you haven't already) to secure your slot.
                </p>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/my-recordings`} style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
                        View Booking Status
                    </a>
                </div>
            </div>

            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                <p>DJ Flowerz Studios</p>
                <p>This is an automated message.</p>
            </div>
        </div>
    </div>
);

export default BookingConfirmationEmail;
