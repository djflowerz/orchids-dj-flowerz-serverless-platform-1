import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"
import { emailOTP } from "better-auth/plugins"


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    },
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET || "default-secret-change-in-production",
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes
        }
    },
    advanced: {
        useSecureCookies: process.env.NODE_ENV === "production"
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }: { email: string, otp: string, type: "sign-in" | "email-verification" | "forget-password" }) {
                // Use fetch to call our API route for sending emails (avoids edge runtime issues if resend used directly here)
                try {
                    // Note: Ideally, use Resend SDK directly if environment allows. 
                    // For simplicity and context separation, we can print to console or use a helper. 
                    // But the user has a /api/auth/send-otp route we might want to leverage or just implement rudimentary sending here.
                    // Actually, we can just use Resend here if we import it.
                    // Let's assume we can use the same logic as the API route.
                    console.log(`[Email OTP] Sending ${otp} to ${email}`);

                    // We will rely on the verify-email page to trigger the actual send via API if needed, 
                    // OR we implement the actual sending here. 
                    // Since we are in the 'auth-server' file, we can standardly use fetch if polyfilled or just log for now as user asked to "fix" it.
                    // The browser research suggested implementing this function.

                    if (process.env.RESEND_API_KEY) {
                        const { Resend } = await import('resend');
                        const resend = new Resend(process.env.RESEND_API_KEY);
                        await resend.emails.send({
                            from: 'DJ Flowerz <onboarding@resend.dev>', // Update with verification domain
                            to: email,
                            subject: 'Verify your email address',
                            html: `<p>Your verification code is <strong>${otp}</strong></p>`
                        });
                    }
                } catch (e) {
                    console.error("Failed to send OTP", e);
                }
            }
        })
    ]
})
