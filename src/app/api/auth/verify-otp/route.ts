import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOTP, isOTPExpired } from '@/lib/otp';

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { error: 'Email already verified' },
                { status: 400 }
            );
        }

        // Check if OTP exists
        if (!user.emailVerificationOtp || !user.otpExpiresAt) {
            return NextResponse.json(
                { error: 'No OTP found. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check if OTP expired
        if (isOTPExpired(user.otpExpiresAt)) {
            return NextResponse.json(
                { error: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Verify OTP
        const isValid = await verifyOTP(otp, user.emailVerificationOtp);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // Update user - mark as verified and clear OTP
        await prisma.user.update({
            where: { email },
            data: {
                emailVerified: true,
                emailVerificationOtp: null,
                otpExpiresAt: null,
            },
        });

        return NextResponse.json({
            message: 'Email verified successfully',
            success: true,
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
