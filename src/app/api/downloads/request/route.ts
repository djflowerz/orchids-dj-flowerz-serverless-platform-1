import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
    try {
        const { productId, userId } = await req.json()

        if (!productId || !userId) {
            return NextResponse.json({ error: 'Product ID and User ID required' }, { status: 400 })
        }

        // Verify user authentication
        const authHeader = req.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        let decodedToken
        try {
            decodedToken = await adminAuth.verifyIdToken(token)
            if (decodedToken.uid !== userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Get product details
        const productDoc = await adminDb.collection('products').doc(productId).get()
        if (!productDoc.exists) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const product = productDoc.data()!

        // Check if product is published and digital
        if (product.status !== 'published' || product.product_type !== 'digital') {
            return NextResponse.json({ error: 'Product not available' }, { status: 404 })
        }

        // Get user's product access
        const userDoc = await adminDb.collection('users').doc(userId).get()
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userData = userDoc.data()!
        const productsAccess = userData.productsAccess || []

        // Find access for this product
        const productAccess = productsAccess.find((p: any) => p.productId === productId)

        if (!productAccess) {
            return NextResponse.json({
                error: 'Access denied. Please purchase this product first.',
                requiresPurchase: true
            }, { status: 403 })
        }

        // Check download limit
        if (productAccess.downloadsRemaining <= 0) {
            return NextResponse.json({
                error: 'Download limit reached. Please repurchase to download again.',
                requiresPurchase: true
            }, { status: 403 })
        }

        // Check subscription expiry if applicable
        if (productAccess.expiresAt) {
            const expiryDate = new Date(productAccess.expiresAt)
            if (expiryDate < new Date()) {
                return NextResponse.json({
                    error: 'Your subscription has expired. Please renew to download.',
                    requiresPurchase: true
                }, { status: 403 })
            }
        }

        // Generate signed download URL (valid for 10 minutes)
        const downloadToken = `${userId}_${productId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        await adminDb.collection('download_tokens').add({
            token: downloadToken,
            userId,
            productId,
            createdAt: FieldValue.serverTimestamp(),
            expiresAt: expiresAt.toISOString(),
            used: false
        })

        // Decrement downloads remaining
        const updatedAccess = productsAccess.map((p: any) =>
            p.productId === productId
                ? { ...p, downloadsRemaining: p.downloadsRemaining - 1, lastDownloadedAt: new Date().toISOString() }
                : p
        )

        await adminDb.collection('users').doc(userId).update({
            productsAccess: updatedAccess
        })

        // Log download activity
        await adminDb.collection('download_logs').add({
            userId,
            productId,
            productTitle: product.title,
            userEmail: userData.email,
            downloadedAt: FieldValue.serverTimestamp(),
            remainingDownloads: productAccess.downloadsRemaining - 1
        })

        return NextResponse.json({
            success: true,
            downloadUrl: product.download_file_path,
            token: downloadToken,
            expiresAt: expiresAt.toISOString(),
            remainingDownloads: productAccess.downloadsRemaining - 1,
            message: product.post_payment_message || 'Your download is ready!'
        })

    } catch (error) {
        console.error('Download validation error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
