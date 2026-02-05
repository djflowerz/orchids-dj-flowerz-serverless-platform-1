
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

function arrayBufferToBase64Url(buffer: ArrayBuffer): string { // URL Safe Base64
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

function arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sign(input: string, privateKeyPem: string): Promise<ArrayBuffer> {
    const keyData = pemToArrayBuffer(privateKeyPem)
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

    return await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        str2ab(input)
    )
}

async function sha256Hex(str: string): Promise<string> {
    const enc = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(str))
    return arrayBufferToHex(hashBuffer)
}

/**
 * Generates a V4 Signed URL for Google Cloud Storage
 */
async function generateV4SignedUrl(
    bucket: string,
    objectName: string,
    method: 'GET' | 'PUT',
    expirationSeconds: number = 3600,
    contentType?: string
): Promise<string> {
    const sa = getServiceAccount()
    if (!sa) throw new Error('Service Account not found for Storage Signing')

    const now = new Date()
    const timestamp = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '') // YYYYMMDDTHHMMSSZ
    const dateStamp = timestamp.substring(0, 8) // YYYYMMDD

    const credentialScope = `${dateStamp}/auto/storage/goog4_request`
    const algorithm = 'GOOG4-RSA-SHA256'
    const expires = expirationSeconds.toString()

    const host = 'storage.googleapis.com'
    const canonicalUri = `/${bucket}/${objectName}`
    const canonicalQueryString = [
        `X-Goog-Algorithm=${algorithm}`,
        `X-Goog-Credential=${encodeURIComponent(sa.client_email + '/' + credentialScope)}`,
        `X-Goog-Date=${timestamp}`,
        `X-Goog-Expires=${expires}`,
        `X-Goog-SignedHeaders=host` // minimal headers
    ].join('&')

    // Canonical Headers
    const canonicalHeaders = `host:${host}\n`
    const signedHeaders = 'host'

    // Payload Hash (UNSIGNED-PAYLOAD for V4 Signed URLs)
    const payloadHash = 'UNSIGNED-PAYLOAD'

    const canonicalRequest = [
        method,
        canonicalUri,
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n')

    const hashedCanonicalRequest = await sha256Hex(canonicalRequest)

    const stringToSign = [
        algorithm,
        timestamp,
        credentialScope,
        hashedCanonicalRequest
    ].join('\n')

    const signatureBuffer = await sign(stringToSign, sa.private_key)
    const signatureHex = arrayBufferToHex(signatureBuffer)

    return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Goog-Signature=${signatureHex}`
}

export async function generateStorageSignedUpload(key: string, contentType: string): Promise<string> {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!bucket) throw new Error('Storage bucket not configured')

    return generateV4SignedUrl(bucket, key, 'PUT', 3600, contentType)
}

export async function generateStorageSignedDownload(key: string): Promise<string> {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!bucket) throw new Error('Storage bucket not configured')

    // For download, GET
    return generateV4SignedUrl(bucket, key, 'GET', 3600)
}
