
interface ServiceAccount {
    client_email: string
    private_key: string
    project_id: string
}

function getServiceAccount(): ServiceAccount | null {
    if (typeof process === 'undefined' || !process.env) return null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        try {
            const decoded = atob(process.env.FIREBASE_SERVICE_ACCOUNT_B64)
            return JSON.parse(decoded)
        } catch (e) {
            console.error('Failed to parse service account B64', e)
        }
    }
    // Check individual vars
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        return {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        }
    }
    return null
}

function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i)
    }
    return buf
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64Lines = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '')
    const str = atob(b64Lines)
    return str2ab(str)
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
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

    const encodedHeader = arrayBufferToBase64Url(str2ab(JSON.stringify(header)))
    const encodedClaim = arrayBufferToBase64Url(str2ab(JSON.stringify(claim)))
    const input = `${encodedHeader}.${encodedClaim}`

    // Import Key
    const keyData = pemToArrayBuffer(sa.private_key)
    const importAlgo = {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' }
    }

    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        importAlgo,
        false,
        ['sign']
    )

    const signatureBuf = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        str2ab(input)
    )

    const signature = arrayBufferToBase64Url(signatureBuf)
    const jwt = `${input}.${signature}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Auth Token Error: ${txt}`)
    }

    const data = await res.json()
    return data.access_token
}

// Map JS values to Firestore Value types
function mapValue(val: any): any {
    if (val === null) return { nullValue: null }
    if (typeof val === 'string') return { stringValue: val }
    if (typeof val === 'number') {
        if (Number.isInteger(val)) return { integerValue: val.toString() }
        return { doubleValue: val }
    }
    if (typeof val === 'boolean') return { booleanValue: val }
    if (val instanceof Date) return { timestampValue: val.toISOString() }
    if (Array.isArray(val)) return { arrayValue: { values: val.map(mapValue) } }
    if (typeof val === 'object') {
        const fields: any = {}
        for (const k in val) fields[k] = mapValue(val[k])
        return { mapValue: { fields } }
    }
    return { stringValue: String(val) }
}

// Helper to unwrap Firestore JSON to JS Object
export function unwrap(fields: any): any {
    const obj: any = {}
    for (const key in fields) {
        const val = fields[key]
        if (val.stringValue !== undefined) obj[key] = val.stringValue
        else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue)
        else if (val.doubleValue !== undefined) obj[key] = val.doubleValue
        else if (val.booleanValue !== undefined) obj[key] = val.booleanValue
        else if (val.timestampValue !== undefined) obj[key] = val.timestampValue
        else if (val.mapValue !== undefined) obj[key] = unwrap(val.mapValue.fields)
        else if (val.arrayValue !== undefined) obj[key] = (val.arrayValue.values || []).map((v: any) => {
            if (v.stringValue !== undefined) return v.stringValue
            if (v.mapValue !== undefined) return unwrap(v.mapValue.fields)
            // simplified array handling - add more if needed
            return v
        })
        else if (val.nullValue !== undefined) obj[key] = null
    }
    return obj
}

export async function runQueryOnEdge(collection: string, structuredQuery: any) {
    const sa = getServiceAccount()
    if (!sa) throw new Error('Service Account not found')

    const token = await getAccessToken(sa)
    // Parent should be projects/{projectId}/databases/(default)/documents
    const parent = `projects/${sa.project_id}/databases/(default)/documents`
    const url = `https://firestore.googleapis.com/v1/${parent}:runQuery`

    // Provide 'from' clause if not present
    if (!structuredQuery.from) {
        structuredQuery.from = [{ collectionId: collection }]
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ structuredQuery })
    })

    if (!res.ok) {
        const err = await res.text()
        console.error('Firestore Query Error:', err)
        throw new Error(`Firestore REST Query Error: ${err}`)
    }

    const data = await res.json()
    // data is array of objects with 'document' or 'readTime'
    const results: any[] = []
    if (Array.isArray(data)) {
        for (const item of data) {
            if (item.document) {
                const id = item.document.name.split('/').pop()
                const props = item.document.fields ? unwrap(item.document.fields) : {}
                results.push({ id, ...props })
            }
        }
    }
    return results
}

export async function updateOrderOnEdge(orderId: string, updates: Record<string, any>) {
    return updateDocumentOnEdge('orders', orderId, updates)
}

export async function createTransactionOnEdge(data: Record<string, any>) {
    return createDocumentOnEdge('transactions', data)
}

export async function createDocumentOnEdge(collection: string, data: Record<string, any>) {
    const sa = getServiceAccount()
    if (!sa) throw new Error('Service Account not found')

    const token = await getAccessToken(sa)
    const fields: Record<string, any> = {}

    for (const [key, val] of Object.entries(data)) {
        fields[key] = mapValue(val)
    }

    const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}`

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
    })

    if (!res.ok) {
        const err = await res.text()
        console.error(`Firestore Create Error (${collection}):`, err)
        throw new Error(`Firestore REST Create Error: ${err}`)
    }
    const json = await res.json()
    // Return ID
    return json.name.split('/').pop()
}

export async function updateDocumentOnEdge(collection: string, docId: string, updates: Record<string, any>) {
    const sa = getServiceAccount()
    if (!sa) throw new Error('Service Account not found')

    const token = await getAccessToken(sa)
    const fields: Record<string, any> = {}

    for (const [key, val] of Object.entries(updates)) {
        fields[key] = mapValue(val)
    }

    const updateMask = Object.keys(fields).map(key => `updateMask.fieldPaths=${key}`).join('&')
    const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}/${docId}?${updateMask}`

    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: `projects/${sa.project_id}/databases/(default)/documents/${collection}/${docId}`, fields })
    })

    if (!res.ok) {
        const err = await res.text()
        console.error(`Firestore Update Error (${collection}/${docId}):`, err)
        throw new Error(`Firestore REST Update Error: ${err}`)
    }
    return await res.json()
}

export async function getDocument(path: string) {
    const sa = getServiceAccount()
    if (!sa) throw new Error('Service Account not found')

    const token = await getAccessToken(sa)
    const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${path}`

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (res.status === 404) return null

    if (!res.ok) {
        const err = await res.text()
        console.error('Firestore Get Error:', err)
        throw new Error(`Firestore REST Get Error: ${err}`)
    }

    const data = await res.json()

    if (data.fields) {
        return { id: data.name.split('/').pop(), ...unwrap(data.fields) }
    }
    return null
}

export async function deleteDocumentOnEdge(collection: string, docId: string) {
    const sa = getServiceAccount()
    if (!sa) throw new Error('Service Account not found')
    const token = await getAccessToken(sa)
    const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}/${docId}`
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) {
        const err = await res.text()
        console.error(`Firestore Delete Error (${collection}/${docId}):`, err)
        throw new Error(`Firestore REST Delete Error: ${err}`)
    }
    return true
}
