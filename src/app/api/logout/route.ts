import { NextRequest } from 'next/server'
import { removeAuthCookies } from 'next-firebase-auth-edge/lib/next/cookies'

export const runtime = 'edge'

const serverConfig = {
    cookieName: 'AuthToken',
    cookieSerializeOptions: {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 12 * 60 * 60 * 24,
    },
}

export async function POST(request: NextRequest) {
    const headers = new Headers()

    const response = removeAuthCookies(headers, serverConfig)

    return response
}
