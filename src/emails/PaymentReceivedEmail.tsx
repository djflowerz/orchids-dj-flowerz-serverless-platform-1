import * as React from 'react';

interface PaymentReceivedEmailProps {
    customerName: string;
    sessionName: string;
    bookingDate: string;
    bookingTime: string;
    amount: number;
    receiptNumber: string;
}

export const PaymentReceivedEmail: React.FC<PaymentReceivedEmailProps> = ({
    customerName,
    sessionName,
    bookingDate,
    bookingTime,
    amount,
    receiptNumber,
}) => (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#10b981', padding: '20px', textAlign: 'center' }}>
                <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>Payment Received!</h1>
            </div>

            <div style={{ padding: '30px', backgroundColor: '#fff' }}>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    Hi <strong>{customerName}</strong>,
                </p>
                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    We have received your payment of <strong>KES {amount.toLocaleString()}</strong>. Your session is now <strong>CONFIRMED</strong>.
                </p>

                <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#10b981' }}>Receipt Details</h3>
                    <p style={{ margin: '5px 0' }}><strong>Receipt Number:</strong> {receiptNumber}</p>
                    <p style={{ margin: '5px 0' }}><strong>Session:</strong> {sessionName}</p>
                    <p style={{ margin: '5px 0' }}><strong>Date:</strong> {bookingDate}</p>
                    <p style={{ margin: '5px 0' }}><strong>Time:</strong> {bookingTime}</p>
                </div>

                <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    We look forward to creating magic with you!
                </p>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/my-recordings`} style={{ backgroundColor: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
                        View Booking
                    </a>
                </div>
            </div>

            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                <p>DJ Flowerz Studios</p>
            </div>
        </div>
    </div>
);

export default PaymentReceivedEmail;
