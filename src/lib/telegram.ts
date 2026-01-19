import { getServerSupabase } from './auth'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

interface TelegramMessage {
  chat_id: string
  text: string
  parse_mode?: 'HTML' | 'Markdown'
}

export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token not configured')
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    return res.ok
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

export async function notifyAdmin(text: string): Promise<boolean> {
  if (!TELEGRAM_ADMIN_CHAT_ID) {
    console.warn('Telegram admin chat ID not configured')
    return false
  }

  return sendTelegramMessage({
    chat_id: TELEGRAM_ADMIN_CHAT_ID,
    text,
    parse_mode: 'HTML'
  })
}

export async function addUserToChannel(telegramUserId: string, channelId: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/unbanChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        user_id: telegramUserId,
        only_if_banned: true
      })
    })

    return res.ok
  } catch (error) {
    console.error('Failed to add user to channel:', error)
    return false
  }
}

export async function removeUserFromChannel(telegramUserId: string, channelId: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        user_id: telegramUserId,
        revoke_messages: false
      })
    })

    return res.ok
  } catch (error) {
    console.error('Failed to remove user from channel:', error)
    return false
  }
}

export async function syncUserTelegramAccess(userId: string): Promise<{ success: boolean; message: string }> {
  const supabase = getServerSupabase()

  const { data: user } = await supabase
    .from('users')
    .select('telegram_user_id, subscription_status, subscription_tier')
    .eq('id', userId)
    .single()

  if (!user?.telegram_user_id) {
    return { success: false, message: 'User has no Telegram linked' }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  const isActive = subscription && new Date(subscription.end_date) > new Date()

  const { data: channels } = await supabase
    .from('telegram_channels')
    .select('*')
    .eq('is_active', true)

  if (!channels?.length) {
    return { success: false, message: 'No active channels configured' }
  }

  for (const channel of channels) {
    const tierHierarchy: Record<string, number> = { basic: 1, pro: 2, unlimited: 3 }
    const userTierLevel = tierHierarchy[subscription?.tier || ''] || 0
    const channelTierLevel = tierHierarchy[channel.plan_tier] || 0

    const shouldHaveAccess = isActive && userTierLevel >= channelTierLevel

    const { data: existingAccess } = await supabase
      .from('telegram_access')
      .select('*')
      .eq('user_id', userId)
      .eq('channel_id', channel.id)
      .single()

    if (shouldHaveAccess && (!existingAccess || !existingAccess.access_granted)) {
      await addUserToChannel(user.telegram_user_id, channel.channel_id)
      
      if (existingAccess) {
        await supabase
          .from('telegram_access')
          .update({ access_granted: true, last_sync: new Date().toISOString() })
          .eq('id', existingAccess.id)
      } else {
        await supabase.from('telegram_access').insert({
          user_id: userId,
          channel_id: channel.id,
          access_granted: true,
          last_sync: new Date().toISOString()
        })
      }
    } else if (!shouldHaveAccess && existingAccess?.access_granted) {
      await removeUserFromChannel(user.telegram_user_id, channel.channel_id)
      
      await supabase
        .from('telegram_access')
        .update({ access_granted: false, last_sync: new Date().toISOString() })
        .eq('id', existingAccess.id)
    }
  }

  return { success: true, message: 'Access synced successfully' }
}

export async function syncAllExpiredSubscriptions(): Promise<number> {
  const supabase = getServerSupabase()

  const { data: expiredSubs } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')
    .lt('end_date', new Date().toISOString().split('T')[0])

  if (!expiredSubs?.length) return 0

  let syncedCount = 0

  for (const sub of expiredSubs) {
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', sub.user_id)
      .eq('status', 'active')

    await supabase
      .from('users')
      .update({ subscription_status: 'expired', role: 'user' })
      .eq('id', sub.user_id)

    await syncUserTelegramAccess(sub.user_id)
    syncedCount++
  }

  return syncedCount
}

export function formatOrderNotification(order: {
  id: string
  user_email: string
  amount: number
  type: string
  product_title?: string
}): string {
  return `
🛒 <b>New Order!</b>

📧 Customer: ${order.user_email}
📦 Product: ${order.product_title || 'N/A'}
💰 Amount: KSh ${(order.amount / 100).toLocaleString()}
📋 Type: ${order.type}
🆔 Order ID: ${order.id.slice(0, 8)}

<i>View in admin panel</i>
`.trim()
}

export function formatSubscriptionNotification(sub: {
  user_email: string
  tier: string
  months: number
  amount: number
}): string {
  return `
🎉 <b>New Subscription!</b>

📧 Customer: ${sub.user_email}
⭐ Tier: ${sub.tier.toUpperCase()}
📅 Duration: ${sub.months} month(s)
💰 Amount: KSh ${(sub.amount / 100).toLocaleString()}

<i>Remember to sync Telegram access</i>
`.trim()
}
