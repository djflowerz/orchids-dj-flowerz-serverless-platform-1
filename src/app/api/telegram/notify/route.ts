import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
const PUBLIC_CHANNEL_ID = process.env.TELEGRAM_PUBLIC_CHANNEL_ID

async function sendTelegramMessage(chatId: string, message: string, parseMode: string = 'HTML') {
  if (!BOT_TOKEN) return { ok: false, error: 'Bot token not configured' }

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: parseMode
    })
  })

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { type, message, chatId, data } = await request.json()

    let targetChatId = chatId || ADMIN_CHAT_ID
    let formattedMessage = message

    if (type === 'new_release') {
      targetChatId = PUBLIC_CHANNEL_ID || ADMIN_CHAT_ID
      formattedMessage = `🎵 <b>NEW RELEASE!</b>\n\n` +
        `${data?.title || 'New Track'}\n` +
        `${data?.artist ? `Artist: ${data.artist}\n` : ''}` +
        `${data?.genre ? `Genre: ${data.genre}\n` : ''}` +
        `\n🔗 Listen now: ${data?.url || 'https://djflowerz.com/music-pool'}`
    } else if (type === 'new_mixtape') {
      targetChatId = PUBLIC_CHANNEL_ID || ADMIN_CHAT_ID
      formattedMessage = `🔥 <b>NEW MIXTAPE DROP!</b>\n\n` +
        `📀 ${data?.title || 'New Mixtape'}\n` +
        `${data?.dj ? `🎧 DJ: ${data.dj}\n` : ''}` +
        `${data?.genre ? `🎵 Genre: ${data.genre}\n` : ''}` +
        `\n🔗 Download FREE: ${data?.url || 'https://djflowerz.com/mixtapes'}`
    } else if (type === 'subscription') {
      formattedMessage = `💰 <b>New Subscription!</b>\n\n` +
        `📧 ${data?.email}\n` +
        `📦 Plan: ${data?.tier}\n` +
        `💵 Amount: KSh ${data?.amount?.toLocaleString()}`
    } else if (type === 'booking') {
      formattedMessage = `📅 <b>New Booking Request!</b>\n\n` +
        `👤 ${data?.customerName}\n` +
        `📧 ${data?.email}\n` +
        `🎉 Event: ${data?.eventType}\n` +
        `📆 Date: ${data?.eventDate}`
    }

    if (!BOT_TOKEN || !targetChatId) {
      console.log('Telegram would send:', formattedMessage)
      return NextResponse.json({ success: true, simulated: true })
    }

    const result = await sendTelegramMessage(targetChatId, formattedMessage)

    if (!result.ok) {
      return NextResponse.json({ error: result.description }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Telegram error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
