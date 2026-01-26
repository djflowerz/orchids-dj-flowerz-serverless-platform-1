import { NextRequest } from 'next/server'
import { refreshCookiesWithIdToken } from 'next-firebase-auth-edge/lib/next/cookies'

export const runtime = 'edge'

const serverConfig = {
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

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json()

        if (!idToken) {
            return Response.json({ error: 'Missing idToken' }, { status: 400 })
        }

        const headers = new Headers()
        const cookies = request.cookies

        await refreshCookiesWithIdToken(idToken, headers, cookies, serverConfig)

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
        })
    } catch (error) {
        console.error('Login error:', error)
        return Response.json({ error: 'Authentication failed' }, { status: 401 })
    }
}
