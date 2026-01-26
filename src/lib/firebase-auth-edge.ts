import { getTokens } from 'next-firebase-auth-edge'
import { cookies } from 'next/headers'

const serverConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
    },
}

export async function getAuthenticatedUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('AuthToken')?.value

    if (!token) {
        return null
    }

    try {
        const tokens = await getTokens(cookieStore, {
            apiKey: serverConfig.apiKey,
            cookieName: 'AuthToken',
            cookieSignatureKeys: [process.env.COOKIE_SECRET_CURRENT!, process.env.COOKIE_SECRET_PREVIOUS!],
            serviceAccount: serverConfig.serviceAccount,
        })

        if (!tokens) {
            return null
        }

        return {
            uid: tokens.decodedToken.uid,
            email: tokens.decodedToken.email,
            emailVerified: tokens.decodedToken.email_verified,
            customClaims: tokens.decodedToken,
        }
    } catch (error) {
        console.error('Error verifying auth token:', error)
        return null
    }
}

export async function requireAuth() {
    const user = await getAuthenticatedUser()
    if (!user) {
        throw new Error('Unauthorized')
    }
    return user
}

export async function requireAdmin() {
    const user = await requireAuth()
    const isAdmin = user.email === 'ianmuriithiflowerz@gmail.com' || user.customClaims.role === 'admin'

    if (!isAdmin) {
        throw new Error('Forbidden: Admin access required')
    }

    return user
}
