import { headers } from 'next/headers';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'; // 'sandbox' or 'production'

const BASE_URL = MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

interface StkPushParams {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
    callbackUrl: string;
}

export async function getAccessToken(): Promise<string> {
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
        throw new Error('M-Pesa Consumer Key and Secret are required');
    }

    const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

    try {
        const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${credentials}`,
            },
            cache: 'no-store', // Don't cache the token request
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.errorMessage || 'Failed to get access token');
        }

        return data.access_token;
    } catch (error) {
        console.error('M-Pesa Access Token Error:', error);
        throw error;
    }
}

export async function initiateStkPush({ phoneNumber, amount, accountReference, transactionDesc, callbackUrl }: StkPushParams) {
    const token = await getAccessToken();

    // Format phone number: 254...
    let formattedPhone = phoneNumber.replace(/\+/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline', // or CustomerBuyGoodsOnline
        Amount: Math.ceil(amount), // Amount must be an integer
        PartyA: formattedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
    };

    try {
        const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('M-Pesa STK Push Error Response:', data);
            throw new Error(data.errorMessage || 'Failed to initiate STK Push');
        }

        return data;
    } catch (error) {
        console.error('M-Pesa STK Push Error:', error);
        throw error;
    }
}
