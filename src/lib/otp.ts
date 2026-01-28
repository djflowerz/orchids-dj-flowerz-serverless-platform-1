/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP for secure storage using SHA-256
 */
export async function hashOTP(otp: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify an OTP against its hash
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
    const computed = await hashOTP(otp);
    return computed === hash;
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
}
