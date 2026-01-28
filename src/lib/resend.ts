// import { Resend } from 'resend'; // Removed for Edge compatibility

let resendInstance: any = null;

export function getResend() {
    if (!resendInstance) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not defined in environment variables');
        }

        const apiKey = process.env.RESEND_API_KEY;

        resendInstance = {
            emails: {
                send: async (payload: any) => {
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error('Resend API Error:', errorText);
                        throw new Error(`Resend API Error: ${res.status} ${res.statusText}`);
                    }

                    return await res.json();
                }
            }
        };
    }
    return resendInstance;
}

export const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
