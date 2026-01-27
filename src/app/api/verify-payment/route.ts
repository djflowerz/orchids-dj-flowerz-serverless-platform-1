import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Simple JWT encoding for service account (Edge-compatible)
function base64url(source: string | Uint8Array): string {
    let encodedSource = typeof source === 'string'
        ? btoa(source)
        : btoa(String.fromCharCode(...source))

    return encodedSource.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function getFirestoreAccessToken(): Promise<string> {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountKey)
    const now = Math.floor(Date.now() / 1000)

    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    }

    const encodedHeader = base64url(JSON.stringify(header))
    const encodedPayload = base64url(JSON.stringify(payload))
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    const encoder = new TextEncoder()
    const data = encoder.encode(unsignedToken)

    const privateKeyPem = serviceAccount.private_key
    const pemContents = privateKeyPem
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '')

    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

    const key = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)
    const encodedSignature = base64url(new Uint8Array(signature))
    const jwt = `${unsignedToken}.${encodedSignature}`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
}

async function updateFirestoreOrder(collection: string, docId: string, updates: Record<string, any>) {
    const token = await getFirestoreAccessToken()
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

    const fields: Record<string, any> = {}
    for (const [key, val] of Object.entries(updates)) {
        if (typeof val === 'string') {
            fields[key] = { stringValue: val }
        } else if (typeof val === 'number') {
            fields[key] = { integerValue: val.toString() }
        }
    }

    const updateMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&')
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?${updateMask}`

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Firestore update failed: ${error}`)
    }

    return response.json()
}

export async function POST(req: Request) {
    try {
        const { reference, orderId, expectedAmount, collection = 'orders' } = await req.json()
        const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK

        if (!secretKey) {
            console.error('PAYSTACK_SECRET_KEY is missing in environment variables')
            return NextResponse.json({ error: 'Server configuration error: Missing Secret Key' }, { status: 500 })
        }

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!data.status) {
            return NextResponse.json({ error: 'Verification failed from Paystack', details: data.message }, { status: 400 })
        }

        const paidAmount = data.data.amount

        if (expectedAmount && paidAmount !== expectedAmount) {
            return NextResponse.json({
                verified: false,
                message: 'Amount mismatch',
                expected: expectedAmount,
                paid: paidAmount
            }, { status: 400 })
        }

        // Update Status in Firestore
        // Logic to determine Document ID and Collection
        // In our checkout flow, we set reference = Firestore Document ID
        const docId = orderId || reference
        const meta = data.data.metadata || {}
        const collectionName = collection || (meta.type === 'subscription' ? 'subscriptions' : 'orders')

        // Update Status in Firestore
        if (docId) {
            try {
                await updateFirestoreOrder(collectionName, docId, {
                    status: collectionName === 'subscriptions' ? 'active' : 'paid',
                    payment_status: 'success',
                    payment_ref: reference,
                    payment_method: data.data.channel,
                    updated_at: new Date().toISOString()
                })
                console.log(`Document ${docId} in ${collectionName} updated (via verify-payment)`)
            } catch (dbError) {
                console.error('Error updating document status:', dbError)
                // Continue, as payment is verified
            }
        }

        return NextResponse.json({ verified: true, data: data.data })

    } catch (error) {
        console.error('Verification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
