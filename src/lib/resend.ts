import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResend(): Resend {
    if (!resendInstance) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not defined in environment variables');
        }
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

export const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
