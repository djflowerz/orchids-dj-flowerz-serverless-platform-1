import { PrismaClient } from '@prisma/client'
import * as admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const prisma = new PrismaClient()

// Initialize Firebase Admin
if (getApps().length === 0) {
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json')
    const bakPath = path.join(process.cwd(), 'service-account.json.bak')

    // Check main path first, then bak, then env
    if (fs.existsSync(serviceAccountPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
        } catch (e) { console.warn('Failed to load local service-account.json', e) }
    }

    if (getApps().length === 0 && fs.existsSync(bakPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(bakPath, 'utf8'))
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
        } catch (e) { console.warn('Failed to load local service-account.json.bak', e) }
    }

    if (getApps().length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        try {
            const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'))
            admin.initializeApp({ credential: admin.credential.cert(sa) })
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_B64', e)
            process.exit(1)
        }
    }
}

const db = admin.firestore()

function parseDate(val: any): Date {
    if (!val) return new Date()
    if (val instanceof admin.firestore.Timestamp) return val.toDate()
    if (typeof val === 'string') return new Date(val)
    if (typeof val === 'number') return new Date(val)
    return new Date() // Fallback
}

async function migrateUsers() {
    console.log('Migrating users...')
    const snapshot = await db.collection('users').get()

    for (const doc of snapshot.docs) {
        const data = doc.data()
        try {
            await prisma.user.upsert({
                where: { id: doc.id },
                update: {
                    subscription_status: data.subscription_status || 'none',
                    subscription_tier: data.subscription_tier || null,
                    subscription_expires_at: data.subscription_expires_at ? parseDate(data.subscription_expires_at) : null,
                    account_status: data.account_status || 'active',
                    telegram_user_id: data.telegram_user_id || null,
                    telegram_username: data.telegram_username || null,
                    role: data.role || 'user',
                },
                create: {
                    id: doc.id,
                    name: data.name || data.displayName || 'Unknown',
                    email: data.email,
                    emailVerified: data.emailVerified || false,
                    image: data.image || data.photoURL || null,
                    role: data.role || 'user',
                    createdAt: data.created_at ? parseDate(data.created_at) : new Date(),
                    updatedAt: new Date(),
                    cart: data.cart || {},
                    subscription_status: data.subscription_status || 'none',
                    subscription_tier: data.subscription_tier || null,
                    subscription_expires_at: data.subscription_expires_at ? parseDate(data.subscription_expires_at) : null,
                    account_status: data.account_status || 'active',
                    telegram_user_id: data.telegram_user_id || null,
                    telegram_username: data.telegram_username || null,
                }
            })
            // console.log(`Migrated user: ${data.email}`)
        } catch (e) {
            console.error(`Failed to migrate user ${doc.id}:`, e)
        }
    }
}

async function migrateProducts() {
    console.log('Migrating products...')
    const snapshot = await db.collection('products').get()

    for (const doc of snapshot.docs) {
        const data = doc.data()
        const storeId = data.storeId || 'admin-store'

        // Auto-select trending
        const cat = (data.category || '').toLowerCase()
        const isTrending = cat.includes('laptop') || cat.includes('tech') || cat.includes('computer') || (data.stock > 5)

        try {
            const images = data.images || (data.image_url ? [data.image_url] : [])

            await prisma.product.upsert({
                where: { id: doc.id },
                update: {
                    isTrending: isTrending
                },
                create: {
                    id: doc.id,
                    name: data.title || data.name || 'Untitled',
                    description: data.description || '',
                    mrp: parseFloat(data.mrp || data.price || '0'),
                    price: parseFloat(data.price || '0'),
                    images: images,
                    category: data.category || 'General',
                    inStock: (data.stock === undefined || data.stock > 0),
                    storeId: storeId,
                    isTrending: isTrending,
                    createdAt: data.created_at ? parseDate(data.created_at) : new Date(),
                    updatedAt: new Date()
                }
            })
            // console.log(`Migrated product: ${data.name || data.title}`)
        } catch (e) {
            console.error(`Failed product ${doc.id}`, e)
        }
    }
}

async function migrateOrders() {
    console.log('Migrating orders...')
    const snapshot = await db.collection('orders').get()

    for (const doc of snapshot.docs) {
        const data = doc.data()

        if (!data.userId || !data.items || !Array.isArray(data.items)) {
            continue
        }

        try {
            let addressId = 'temp-addr-' + doc.id
            if (data.shippingDetails || data.address) {
                const shipping = data.shippingDetails || data.address
                const addr = await prisma.address.create({
                    data: {
                        userId: data.userId,
                        name: shipping.name || 'Unknown',
                        email: shipping.email || data.email || 'unknown@example.com',
                        street: shipping.address || shipping.street || '',
                        city: shipping.city || '',
                        state: shipping.state || '',
                        zip: shipping.zip || '',
                        country: shipping.country || 'Kenya',
                        phone: shipping.phone || '',
                        createdAt: data.createdAt ? parseDate(data.createdAt) : new Date()
                    }
                })
                addressId = addr.id
            } else {
                const addr = await prisma.address.create({
                    data: {
                        userId: data.userId,
                        name: 'Digital Delivery',
                        email: data.email || 'unknown@example.com',
                        street: 'N/A',
                        city: 'N/A',
                        state: 'N/A',
                        zip: '00000',
                        country: 'N/A',
                        phone: 'N/A'
                    }
                })
                addressId = addr.id
            }

            let status: any = 'ORDER_PLACED'
            if (data.status === 'completed') status = 'DELIVERED'
            if (data.status === 'processing') status = 'PROCESSING'
            if (data.status === 'shipped') status = 'SHIPPED'

            let paymentMethod: any = 'COD'
            if (data.paymentMethod === 'paystack') paymentMethod = 'PAYSTACK'

            // Filter valid items
            const orderItemsCreate = data.items
                .filter((item: any) => (item.id || item.productId))
                .map((item: any) => ({
                    productId: item.id || item.productId,
                    quantity: item.quantity || 1,
                    price: parseFloat(item.price || '0')
                }))

            if (orderItemsCreate.length === 0) continue

            await prisma.order.upsert({
                where: { id: doc.id },
                update: {},
                create: {
                    id: doc.id,
                    total: parseFloat(data.total || data.amount || '0'),
                    status: status,
                    userId: data.userId,
                    storeId: 'admin-store',
                    addressId: addressId,
                    isPaid: data.status === 'completed' || data.paid === true,
                    paymentMethod: paymentMethod,
                    createdAt: data.createdAt ? parseDate(data.createdAt) : new Date(),
                    updatedAt: new Date(),
                    orderItems: {
                        create: orderItemsCreate
                    }
                }
            })

        } catch (e) {
            console.error(`Failed order ${doc.id}`, e)
        }
    }
}

async function main() {
    try {
        await prisma.user.upsert({
            where: { id: 'admin-user' },
            update: { role: 'admin' },
            create: {
                id: 'admin-user',
                name: 'Admin',
                email: 'admin@djflowerz.com',
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                role: 'admin'
            }
        })

        await prisma.store.upsert({
            where: { id: 'admin-store' },
            update: {},
            create: {
                id: 'admin-store',
                userId: 'admin-user',
                name: 'DJ Flowerz Official',
                description: 'Official Merchandise',
                username: 'djflowerz',
                address: 'Kenya',
                logo: '',
                email: 'admin@djflowerz.com',
                contact: '+254...',
                isActive: true
            }
        })
    } catch (e) { console.log('Admin init failed', e) }

    await migrateUsers()
    await migrateProducts()
    await migrateOrders()

    console.log('Migration complete.')
    process.exit(0)
}

main()
