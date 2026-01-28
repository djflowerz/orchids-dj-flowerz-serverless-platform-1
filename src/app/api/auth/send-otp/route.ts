import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp';
import { getResend, FROM_EMAIL } from '@/lib/resend';

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): boolean {
    const now = Date.now();
    const limit = rateLimitMap.get(email);

    if (!limit || now > limit.resetTime) {
        rateLimitMap.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 minutes
        return true;
    }

    if (limit.count >= 3) {
        return false;
    }

    limit.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check rate limit
        if (!checkRateLimit(email)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again in 15 minutes.' },
                { status: 429 }
            );
        }

        // Find user by email
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

        // Generate OTP
        const otp = generateOTP();
        const hashedOTP = await hashOTP(otp);
        const expiresAt = getOTPExpiry();

        // Update user with OTP
        await prisma.user.update({
            where: { email },
            data: {
                emailVerificationOtp: hashedOTP,
                otpExpiresAt: expiresAt,
            },
        });

        // Send email
        try {
            await getResend().emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Verify Your Email - DJ FLOWERZ',
                html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎧 DJ FLOWERZ</h1>
                  <p>Email Verification</p>
                </div>
                <div class="content">
                  <h2>Welcome to DJ FLOWERZ!</h2>
                  <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
                  
                  <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                  </div>
                  
                  <p><strong>This code will expire in 10 minutes.</strong></p>
                  
                  <p>If you didn't request this code, please ignore this email.</p>
                  
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} DJ FLOWERZ. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            return NextResponse.json(
                { error: 'Failed to send verification email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'OTP sent successfully',
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
