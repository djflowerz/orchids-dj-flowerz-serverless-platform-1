import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Get the session token from cookies
    const sessionToken = request.cookies.get('better-auth.session_token')?.value ||
        request.cookies.get('session_token')?.value

    // 2. Define protected routes
    const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin')
    const isProtectedRoute = path.startsWith('/downloads') ||
        path.startsWith('/music-pool') ||
        path.startsWith('/api/download') ||
        path.startsWith('/api/r2-download')

    // 3. Handle Admin Routes (Strict Check)
    if (isAdminRoute) {
        if (!sessionToken) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // We can't verify the token signature easily in Edge middleware without external calls 
        // or complex crypto. 
        // For now, we rely on the server-side Page/API check for strict security.
        // BUT, we can check if the user is supposedly signed in.

        // Detailed Role/Email check happens in layout/page server-side or via Client Component
        // This middleware just ensures they have A session.
    }

    // 4. Handle Authenticated Routes
    if (isProtectedRoute) {
        if (!sessionToken) {
            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/downloads/:path*',
        '/music-pool/:path*',
        '/api/download/:path*',
        '/api/r2-download/:path*',
        '/api/admin/:path*',
    ],
}
