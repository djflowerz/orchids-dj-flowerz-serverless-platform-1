const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || 'ik_bbd06f551be2c3e1ddd1cdff804eb445'
const INSFORGE_BASE_URL = 'https://api.insforge.dev'

export interface InsforgeUploadResponse {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface InsforgeDownloadOptions {
  expiresIn?: number
  filename?: string
}

export async function uploadToInsforge(
  file: Buffer | Blob,
  filename: string,
  bucket: string = 'music-files'
): Promise<InsforgeUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file instanceof Buffer ? new Blob([file]) : file, filename)
    formData.append('bucket', bucket)

    const response = await fetch(`${INSFORGE_BASE_URL}/api/storage/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    const data = await response.json()
    return { success: true, url: data.url, key: data.key }
  } catch (error) {
    console.error('Insforge upload error:', error)
    return { success: false, error: String(error) }
  }
}

export async function getSecureDownloadUrl(
  key: string,
  bucket: string = 'music-files',
  options: InsforgeDownloadOptions = {}
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      key,
      bucket,
      expiresIn: String(options.expiresIn || 3600),
    })
    
    if (options.filename) {
      params.append('filename', options.filename)
    }

    const response = await fetch(`${INSFORGE_BASE_URL}/api/storage/signed-url?${params}`, {
      headers: {
        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.signedUrl || data.url
  } catch (error) {
    console.error('Insforge signed URL error:', error)
    return null
  }
}

export async function deleteFromInsforge(
  key: string,
  bucket: string = 'music-files'
): Promise<boolean> {
  try {
    const response = await fetch(`${INSFORGE_BASE_URL}/api/storage/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, bucket }),
    })

    return response.ok
  } catch (error) {
    console.error('Insforge delete error:', error)
    return false
  }
}

export async function listInsforgeFiles(
  bucket: string = 'music-files',
  prefix?: string
): Promise<Array<{ key: string; size: number; lastModified: string }>> {
  try {
    const params = new URLSearchParams({ bucket })
    if (prefix) params.append('prefix', prefix)

    const response = await fetch(`${INSFORGE_BASE_URL}/api/storage/list?${params}`, {
      headers: {
        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
      },
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.files || data.objects || []
  } catch (error) {
    console.error('Insforge list error:', error)
    return []
  }
}
