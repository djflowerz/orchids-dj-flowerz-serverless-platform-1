import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

interface TelegramChannel {
    id: string
    chatId: string
    name: string
}

async function removeUserFromChannels(telegramId: string, botToken: string, channels: TelegramChannel[]) {
    for (const channel of channels) {
        try {
            // banChatMember removes the user from the channel
            await fetch(`https://api.telegram.org/bot${botToken}/banChatMember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: channel.chatId,
                    user_id: telegramId
                })
            })

            // Unban immediately to allow them to rejoin in future (kick behavior)
            await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: channel.chatId,
                    user_id: telegramId
                })
            })

            console.log(`Removed user ${telegramId} from channel ${channel.chatId}`)
        } catch (error) {
            console.error(`Failed to remove user ${telegramId} from channel ${channel.chatId}:`, error)
        }
    }
}

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0]

        // 1. Get active subscriptions
        const snapshot = await adminDb.collection('subscriptions')
            .where('status', '==', 'active')
            .get()

        if (snapshot.empty) {
            return NextResponse.json({ message: 'No active subscriptions to check' })
        }

        const expiredDocs = snapshot.docs.filter(doc => {
            const data = doc.data()
            // Check if end_date is strictly before today (e.g. yesterday)
            return data.end_date < today
        })

        if (expiredDocs.length === 0) {
            return NextResponse.json({ message: 'No expired subscriptions found' })
        }

        // Get Settings for Telegram
        const settingsDoc = await adminDb.collection('settings').doc('site').get()
        const settings = settingsDoc.data()
        const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN
        const channels = settings?.telegramChannels || []

        const updates: Promise<any>[] = []

        for (const doc of expiredDocs) {
            const subData = doc.data()

            // Update Subscription Status
            updates.push(doc.ref.update({
                status: 'expired',
                updatedAt: FieldValue.serverTimestamp()
            }))

            // Update User Profile
            if (subData.user_id) {
                updates.push(adminDb.collection('users').doc(subData.user_id).update({
                    subscription_status: 'expired',
                    subscription_tier: null,
                    updatedAt: FieldValue.serverTimestamp()
                }))

                // Handle Telegram Removal
                if (botToken && channels.length > 0) {
                    updates.push((async () => {
                        try {
                            const userDoc = await adminDb.collection('users').doc(subData.user_id).get()
                            const userData = userDoc.data()
                            if (userData?.telegram_id) {
                                await removeUserFromChannels(userData.telegram_id, botToken, channels)
                            }
                        } catch (err) {
                            console.error('Error fetching user for telegram removal:', err)
                        }
                    })())
                }
            }
        }

        await Promise.all(updates)

        return NextResponse.json({
            success: true,
            processed: expiredDocs.length,
            message: `Expired ${expiredDocs.length} subscriptions and triggered removals`
        })

    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
