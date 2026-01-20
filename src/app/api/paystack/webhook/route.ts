import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

// SUBSCRIPTION_PLANS removed - dynamic lookup used

async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!botToken || !chatId) return

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch (error) {
    console.error('Telegram notification error:', error)
  }
}

async function handleTelegramAccess(userId: string, action: 'add' | 'remove') {
  try {
    const settingsDoc = await adminDb.collection('settings').doc('site').get()
    const settings = settingsDoc.data()
    const botToken = process.env.TELEGRAM_BOT_TOKEN || settings?.telegramBotToken
    const channels = settings?.telegramChannels || []

    if (!botToken || channels.length === 0) return

    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const telegramId = userData?.telegram_id

    if (!telegramId) return

    for (const channel of channels) {
      try {
        if (action === 'remove') {
          await fetch(`https://api.telegram.org/bot${botToken}/banChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: channel.chatId, user_id: telegramId })
          })
          // Unban immediately to allow rejoin
          await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: channel.chatId, user_id: telegramId })
          })
        } else {
          // 'add' action: We ensure they are unbanned. 
          // We can also send an invite link if we can generate one, 
          // or assume they will click the channel link in the Dashboard.
          await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: channel.chatId, user_id: telegramId })
          })

          // Send a message to the user with the link?
          // This requires the bot to have messaged the user first appropriately.
          try {
            const inviteLinkRes = await fetch(`https://api.telegram.org/bot${botToken}/createChatInviteLink`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channel.chatId,
                member_limit: 1,
                expire_date: Math.floor(Date.now() / 1000) + 3600 // 1 hour
              })
            })
            const inviteData = await inviteLinkRes.json()
            if (inviteData.ok && inviteData.result?.invite_link) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: telegramId,
                  text: `subscription Active! Here is your link for ${channel.name}: ${inviteData.result.invite_link}`
                })
              })
            }
          } catch (e) {
            console.log('Could not send invite link', e)
          }
        }
      } catch (err) {
        console.error(`Error handling Telegram access (${action}) for ${channel.name}:`, err)
      }
    }
  } catch (error) {
    console.error('handleTelegramAccess error:', error)
  }
}

async function sendWelcomeEmail(email: string, tier: string, endDate: Date) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'subscription_welcome',
        email,
        data: { tier, endDate: endDate.toLocaleDateString() }
      })
    })
  } catch (error) {
    console.error('Email notification error:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid Paystack signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Paystack webhook event:', event.event)

    if (event.event === 'charge.success') {
      const { reference, amount, customer, metadata, channel } = event.data
      const email = customer?.email
      const amountKes = amount / 100

      let subscriptionTier: string | null = null
      let durationDays = 0

      if (metadata?.plan_id) {
        const planDoc = await adminDb.collection('plans').doc(metadata.plan_id).get()
        if (planDoc.exists) {
          const planData = planDoc.data()
          subscriptionTier = planData?.tier || 'basic'
          const duration = planData?.duration
          if (duration === 'year') {
            durationDays = 365
          } else if (duration === 'week') {
            durationDays = 7
          } else {
            durationDays = 30 // Month default
          }
        }
      }

      if (!subscriptionTier) {
        if (amountKes >= 6000) {
          subscriptionTier = '12months'
          durationDays = 365
        } else if (amountKes >= 3500) {
          subscriptionTier = '6months'
          durationDays = 180
        } else if (amountKes >= 1800) {
          subscriptionTier = '3months'
          durationDays = 90
        } else if (amountKes >= 700) {
          subscriptionTier = 'monthly'
          durationDays = 30
        } else if (amountKes >= 200) {
          subscriptionTier = 'weekly'
          durationDays = 7
        }
      }

      const usersSnapshot = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get()

      const existingUser = usersSnapshot.empty ? null : { id: usersSnapshot.docs[0].id, ...usersSnapshot.docs[0].data() } as any

      if (subscriptionTier && durationDays > 0) {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + durationDays)

        let userId = existingUser?.id

        if (existingUser) {
          await adminDb.collection('users').doc(existingUser.id).update({
            subscription_status: 'active',
            subscription_tier: subscriptionTier,
            updatedAt: FieldValue.serverTimestamp()
          })

          const existingSubSnapshot = await adminDb.collection('subscriptions')
            .where('user_id', '==', existingUser.id)
            .where('status', '==', 'active')
            .limit(1)
            .get()

          if (!existingSubSnapshot.empty) {
            const existingSub = existingSubSnapshot.docs[0]
            const currentEndDate = new Date(existingSub.data().end_date)
            const newEndDate = currentEndDate > new Date()
              ? new Date(currentEndDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
              : endDate

            await existingSub.ref.update({
              tier: subscriptionTier,
              end_date: newEndDate.toISOString().split('T')[0],
              amount: amountKes,
              transaction_id: reference,
              updatedAt: FieldValue.serverTimestamp()
            })
          } else {
            await adminDb.collection('subscriptions').add({
              user_id: existingUser.id,
              tier: subscriptionTier,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              status: 'active',
              auto_renew: false,
              payment_method: channel || 'paystack',
              transaction_id: reference,
              amount: amountKes,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            })
          }
        } else {
          const newUserRef = await adminDb.collection('users').add({
            email,
            name: customer?.first_name ? `${customer.first_name} ${customer.last_name || ''}`.trim() : null,
            subscription_status: 'active',
            subscription_tier: subscriptionTier,
            role: 'user',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          })
          userId = newUserRef.id

          await adminDb.collection('subscriptions').add({
            user_id: newUserRef.id,
            tier: subscriptionTier,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'active',
            auto_renew: false,
            payment_method: channel || 'paystack',
            transaction_id: reference,
            amount: amountKes,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          })
        }

        // Handle Telegram Access
        if (userId) {
          await handleTelegramAccess(userId, 'add')
        }

        await adminDb.collection('transactions').add({
          user_id: existingUser?.id || userId || null, // Ensure userId is captured
          type: 'subscription',
          amount: amountKes,
          currency: 'KES',
          payment_method: channel || 'paystack',
          transaction_reference: reference,
          status: 'completed',
          notes: `Music Pool ${subscriptionTier} subscription via Paystack Shop`,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        })

        await sendTelegramNotification(
          `🎉 <b>New Subscription!</b>\n\n` +
          `📧 Email: ${email}\n` +
          `💰 Amount: KSh ${amountKes.toLocaleString()}\n` +
          `📦 Plan: ${subscriptionTier} (${durationDays} days)\n` +
          `📅 Valid until: ${endDate.toLocaleDateString()}\n` +
          `🔗 Ref: ${reference}`
        )

        await sendWelcomeEmail(email, subscriptionTier, endDate)

        console.log(`Subscription activated for ${email}: ${subscriptionTier} until ${endDate}`)
      } else {
        await adminDb.collection('transactions').add({
          user_id: existingUser?.id || null,
          type: 'payment',
          amount: amountKes,
          currency: 'KES',
          payment_method: channel || 'paystack',
          transaction_reference: reference,
          status: 'completed',
          notes: `Payment via Paystack`,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        })

        await sendTelegramNotification(
          `💰 <b>Payment Received</b>\n\n` +
          `📧 Email: ${email}\n` +
          `💵 Amount: KSh ${amountKes.toLocaleString()}\n` +
          `🔗 Ref: ${reference}`
        )
      }
    }

    if (event.event === 'subscription.create') {
      const { customer, plan, subscription_code } = event.data
      await sendTelegramNotification(
        `📋 <b>Subscription Created</b>\n\n` +
        `📧 ${customer?.email}\n` +
        `📦 Plan: ${plan?.name || 'Unknown'}\n` +
        `🔗 Code: ${subscription_code}`
      )
    }

    if (event.event === 'invoice.payment_failed') {
      const { customer, subscription } = event.data
      await sendTelegramNotification(
        `⚠️ <b>Payment Failed</b>\n\n` +
        `📧 ${customer?.email}\n` +
        `📦 Subscription: ${subscription?.subscription_code || 'Unknown'}`
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
