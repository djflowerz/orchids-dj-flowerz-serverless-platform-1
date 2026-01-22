import { NextResponse } from 'next/server'

export const runtime = 'edge'
// Ensure this route is not cached to serve fresh links
export const dynamic = 'force-dynamic'

// Simple JWT encoding for service account (Edge-compatible)
function base64url(source: string | Uint8Array): string {
    let encodedSource = typeof source === 'string'
        ? btoa(source)
        : btoa(String.fromCharCode(...source))

    return encodedSource.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// Get Access Token for Firestore REST API
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

async function getFirestoreDocument(collection: string, docId: string) {
    const token = await getFirestoreAccessToken()
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    })

    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Firestore fetch failed: ${response.statusText}`)

    const data = await response.json()

    // Parse Firestore format
    const parsed: Record<string, any> = { id: docId }
    if (data.fields) {
        for (const [key, val] of Object.entries(data.fields as Record<string, any>)) {
            if (val.stringValue) parsed[key] = val.stringValue
            else if (val.integerValue) parsed[key] = parseInt(val.integerValue)
            else if (val.doubleValue) parsed[key] = parseFloat(val.doubleValue)
            else if (val.booleanValue) parsed[key] = val.booleanValue
            else if (val.arrayValue) {
                // Simplified array parsing for items
                parsed[key] = val.arrayValue.values?.map((v: any) => {
                    const item: Record<string, any> = {}
                    if (v.mapValue && v.mapValue.fields) {
                        for (const [k, f] of Object.entries(v.mapValue.fields as Record<string, any>)) {
                            if (f.stringValue) item[k] = f.stringValue
                            else if (f.integerValue) item[k] = parseInt(f.integerValue)
                        }
                    }
                    return item
                }) || []
            }
        }
    }
    return parsed
}


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const orderId = searchParams.get('orderId')

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        const orderData = await getFirestoreDocument('orders', orderId)

        if (!orderData) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // 1. VERIFY PAYMENT STATUS
        if (orderData.status !== 'paid') {
            return NextResponse.json({ error: 'Order is not paid' }, { status: 403 })
        }

        // 2. FETCH SECURE DETAILS
        // We only return the sensitive download URL/password IF the order is paid
        const itemsWithDetails = await Promise.all((orderData.items || []).map(async (item: any) => {
            const detail = { ...item }

            try {
                if (item.product_id) {
                    const pData = await getFirestoreDocument('products', item.product_id)
                    if (pData) {
                        detail.download_url = pData.download_file_path
                        detail.download_password = pData.download_password
                        detail.product_type = pData.product_type
                    }
                } else if (item.mixtape_id) {
                    const mData = await getFirestoreDocument('mixtapes', item.mixtape_id)
                    if (mData) {
                        detail.download_url = mData.audio_download_url
                        detail.product_type = 'digital'
                    }
                }
            } catch (err) {
                console.error(`Error fetching details for item ${item.title}:`, err)
            }

            return detail
        }))

        return NextResponse.json({
            id: orderId,
            currency: orderData.currency,
            total_amount: orderData.total_amount,
            status: orderData.status,
            items: itemsWithDetails
        })

    } catch (error) {
        console.error('Order Delivery API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
