import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, redirectToLogin } from 'next-firebase-auth-edge'

const commonOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    cookieName: 'AuthToken',
    cookieSignatureKeys: [process.env.COOKIE_SECRET_CURRENT!, process.env.COOKIE_SECRET_PREVIOUS!],
    cookieSerializeOptions: {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 12 * 60 * 60 * 24, // 12 days
    },
    serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
    },
}

export async function middleware(request: NextRequest) {
    return authMiddleware(request, {
        loginPath: '/api/login',
        logoutPath: '/api/logout',
        ...commonOptions,
        handleValidToken: async ({ token, decodedToken }, headers) => {
            const path = request.nextUrl.pathname

            // Admin route protection
            if (path.startsWith('/admin')) {
                const isAdmin = decodedToken.email === 'ianmuriithiflowerz@gmail.com' ||
                    (decodedToken as any).role === 'admin'

                if (!isAdmin) {
                    return NextResponse.redirect(new URL('/', request.url))
                }
            }

            // Protected user routes
            if (path.startsWith('/downloads') || path.startsWith('/music-pool')) {
                if (!decodedToken.email_verified) {
                    return NextResponse.redirect(new URL('/login?error=verify-email', request.url))
                }
            }

            // Protected API routes
            if (path.startsWith('/api/download') ||
                path.startsWith('/api/r2-download') ||
                path.startsWith('/api/admin')) {
                if (!token) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                }
            }

            return NextResponse.next({
                request: {
                    headers,
                },
            })
        },
        handleInvalidToken: async (reason) => {
            console.info('Missing or malformed credentials', { reason })

            const path = request.nextUrl.pathname

            // Redirect to login for protected routes
            if (path.startsWith('/admin') ||
                path.startsWith('/downloads') ||
                path.startsWith('/music-pool')) {
                return redirectToLogin(request, {
                    path: '/login',
                    publicPaths: ['/login', '/signup', '/forgot-password', '/reset-password'],
                })
            }

            // Return 401 for API routes
            if (path.startsWith('/api/download') ||
                path.startsWith('/api/r2-download') ||
                path.startsWith('/api/admin')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            return NextResponse.next()
        },
        handleError: async (error) => {
            console.error('Unhandled authentication error', { error })

            const path = request.nextUrl.pathname

            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
            }

            return redirectToLogin(request, {
                path: '/login',
                publicPaths: ['/login', '/signup', '/forgot-password', '/reset-password'],
            })
        },
    })
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/downloads/:path*',
        '/music-pool/:path*',
        '/api/download/:path*',
        '/api/r2-download/:path*',
        '/api/admin/:path*',
        '/api/login',
        '/api/logout',
    ],
}
