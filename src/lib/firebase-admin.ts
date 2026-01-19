import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

let adminApp: App

function initializeFirebaseAdmin() {
  if (getApps().length) {
    return getApps()[0]
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  // Try Base64 encoded JSON first (safest for env variables)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const jsonStr = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8')
      const serviceAccount = JSON.parse(jsonStr)
      return initializeApp({
        credential: cert(serviceAccount),
        projectId,
      })
    } catch (error) {
      console.error('FIREBASE_ADMIN_INIT_ERROR (B64):', error)
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      return initializeApp({
        credential: cert(serviceAccount),
        projectId,
      })
    } catch (error) {
      console.error('FIREBASE_ADMIN_INIT_ERROR (JSON):', error)
    }
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        projectId,
      })
    } catch (error) {
      console.error('FIREBASE_ADMIN_INIT_ERROR (ENV):', error)
    }
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    })
  } catch {
    return initializeApp({ projectId })
  }
}

adminApp = initializeFirebaseAdmin()

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
export { adminApp }
