'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OtpInput } from '@/components/auth/OtpInput';
import { toast } from 'sonner';
import { Mail, CheckCircle } from 'lucide-react';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (!email) {
            toast.error('Email not provided');
            router.push('/signup');
        }
    }, [email, router]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleVerify = async (otpValue: string) => {
        if (!email) return;

        setLoading(true);

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpValue }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Verification failed');
                setOtp('');
                setLoading(false);
                return;
            }

            setVerified(true);
            toast.success('Email verified successfully!');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('An error occurred. Please try again.');
            setOtp('');
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email || resendCooldown > 0) return;

        setResendLoading(true);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Failed to resend OTP');
                setResendLoading(false);
                return;
            }

            toast.success('OTP sent! Check your email.');
            setResendCooldown(60); // 60 seconds cooldown
        } catch (error) {
            console.error('Resend error:', error);
            toast.error('Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    if (verified) {
        return (
            <AuthLayout
                title="Email Verified!"
                subtitle="Your email has been successfully verified"
            >
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <p className="text-gray-600 mb-4">Redirecting you to login...</p>
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Verify Your Email"
            subtitle={`We sent a code to ${email}`}
        >
            <div className="space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                        <Mail className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-gray-600 text-sm">
                        Enter the 6-digit code we sent to your email
                    </p>
                </div>

                <div className="py-4">
                    <OtpInput
                        length={6}
                        value={otp}
                        onChange={setOtp}
                        onComplete={handleVerify}
                        disabled={loading}
                    />
                </div>

                {loading && (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-gray-600">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Verifying...</span>
                        </div>
                    </div>
                )}

                <div className="text-center space-y-3">
                    <p className="text-sm text-gray-600">
                        Didn't receive the code?
                    </p>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading || resendCooldown > 0}
                        className="text-sm font-semibold text-black hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {resendLoading ? (
                            'Sending...'
                        ) : resendCooldown > 0 ? (
                            `Resend in ${resendCooldown}s`
                        ) : (
                            'Resend Code'
                        )}
                    </button>
                </div>

                <div className="pt-4 text-center">
                    <button
                        type="button"
                        onClick={() => router.push('/signup')}
                        className="text-sm text-gray-600 hover:text-black transition-colors"
                    >
                        ← Back to Sign Up
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <AuthLayout title="Loading..." subtitle="Please wait">
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
                </div>
            </AuthLayout>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
