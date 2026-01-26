
"use server"


import { redirect } from "next/navigation"
import { getDocument, createDocumentOnEdge } from "@/lib/firestore-edge"
import { getAuthenticatedUser } from "@/lib/firebase-auth-edge"

// Paystack API (Edge Compatible)
async function initializePaystackTransaction(email: string, amountInKobo: number, metadata: any, reference?: string) {
    const url = 'https://api.paystack.co/transaction/initialize'
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY missing')

    const body: any = {
        email,
        amount: amountInKobo,
        metadata,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://djflowerz-site.pages.dev'}/payment-success`
    }

    if (reference) {
        body.reference = reference
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const error = await res.text()
        console.error('Paystack Init Error:', error)
        throw new Error('Failed to initialize payment')
    }

    return await res.json()
}

export async function createCheckout(productId: string, userEmail?: string) {
    if (!productId) {
        throw new Error("Missing product ID")
    }

    try {
        // Prefer authenticated user data if available
        const authUser = await getAuthenticatedUser()
        const email = authUser?.email || userEmail
        const userId = authUser?.uid

        if (!email) {
            throw new Error("Email is required for checkout")
        }

        console.log(`[Checkout] Starting for ${productId} by ${email} (uid: ${userId || 'guest'})`)

        // 1. Fetch Product securely from Firestore (Server-Side)
        let product = await getDocument(`products/${productId}`)
        let type = 'product'

        if (!product) {
            // Try mixtape
            product = await getDocument(`mixtapes/${productId}`)
            type = 'mixtape'
        }

        if (!product) {
            throw new Error("Product not found")
        }

        // Use database type if available, otherwise fallback
        if (product.product_type === 'subscription') {
            type = 'subscription'
        }

        // 2. Calculate Amount (in Kobo)
        const price = product.price || 0
        if (price <= 0) {
            throw new Error("This item is free, no payment needed.")
        }
        const amountInKobo = Math.round(price * 100)

        // 3. Create Pending Record in Firestore
        let reference = ''
        const now = new Date().toISOString()

        if (type === 'subscription') {
            // Create pending subscription
            if (!userId) throw new Error("Please log in to subscribe")

            const subData = {
                user_email: email,
                user_id: userId,
                plan_id: productId,
                plan_name: product.title,
                status: 'pending',
                amount: price,
                created_at: now,
                updated_at: now
            }
            reference = await createDocumentOnEdge('subscriptions', subData)
        } else {
            // Create pending order
            const orderData = {
                email: email,
                user_id: userId || 'guest',
                items: [{
                    product_id: productId,
                    title: product.title,
                    amount: price,
                    quantity: 1,
                    type: type
                }],
                total_amount: price,
                currency: 'KES',
                status: 'pending',
                payment_status: 'pending',
                created_at: now,
                updated_at: now
            }
            reference = await createDocumentOnEdge('orders', orderData)
        }

        if (!reference) {
            throw new Error("Failed to create pending record")
        }

        // 4. Initialize Paystack Transaction with Reference
        const response = await initializePaystackTransaction(email, amountInKobo, {
            custom_fields: [
                { display_name: "Product ID", variable_name: "product_id", value: productId },
                { display_name: "Product Type", variable_name: "type", value: type }
            ],
            type: type,
            product_id: productId,
            user_id: userId // Critical for webhook updates
        }, reference)

        if (!response.status) {
            throw new Error("Paystack failed to initialize")
        }

        // 5. Redirect User
        redirect(response.data.authorization_url)

    } catch (error) {
        console.error("Checkout Action Error:", error)
        throw error
    }
}
