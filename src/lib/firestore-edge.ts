
import crypto from 'crypto'

interface ServiceAccount {
    client_email: string
    private_key: string
    project_id: string
}

function getServiceAccount(): ServiceAccount | null {
    // Logic from firebase-admin.ts simplified
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        } catch (e) { console.error('Error parsing service account key', e) }
    }
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        return {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        }
    }
    return null
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const claim = {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    }

    const header = { alg: 'RS256', typ: 'JWT' }
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url')

    const sign = crypto.createSign('RSA-SHA256')
    sign.update(`${encodedHeader}.${encodedClaim}`)
    const signature = sign.sign(sa.private_key, 'base64url')
    const jwt = `${encodedHeader}.${encodedClaim}.${signature}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    const data = await res.json()
    return data.access_token
}

export async function updateOrderOnEdge(orderId: string, updates: Record<string, any>) {
    const sa = getServiceAccount()
    if (!sa) throw new Error('Service Account not found')

    const token = await getAccessToken(sa)

    // Transform minimal updates to Firestore REST format
    // simplistic mapping for strings/numbers/etc
    const fields: Record<string, any> = {}

    for (const [key, val] of Object.entries(updates)) {
        if (typeof val === 'string') {
            fields[key] = { stringValue: val }
        } else if (typeof val === 'number') {
            fields[key] = { integerValue: val.toString() } // assuming ints mostly or doubleValue
        } else if (typeof val === 'boolean') {
            fields[key] = { booleanValue: val }
        } else if (val instanceof Date) {
            fields[key] = { timestampValue: val.toISOString() }
        } else if (typeof val === 'object') {
            fields[key] = { stringValue: JSON.stringify(val) } // Store objects as JSON strings to simplify
        }
    }

    const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/orders/${orderId}?updateMask.fieldPaths=${Object.keys(fields).join('&updateMask.fieldPaths=')}`

    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Firestore REST Error: ${err}`)
    }

    return await res.json()
}
