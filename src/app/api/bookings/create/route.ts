import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const ADMIN_EMAIL = 'djflowerz254@gmail.com'
const ADMIN_WHATSAPP = '+254789783258'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customer_name, 
      email, 
      phone, 
      event_type, 
      event_date, 
      event_time,
      location,
      notes,
      estimated_budget,
      tipjar_amount 
    } = body

    if (!customer_name || !email || !phone || !event_date || !event_time || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const docRef = await adminDb.collection('bookings').add({
      customer_name,
      email,
      phone,
      event_type: event_type || 'other',
      event_date,
      event_time,
      location,
      notes: notes || null,
      estimated_budget: estimated_budget || null,
      tipjar_amount: tipjar_amount || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    const doc = await docRef.get()
    const booking = { id: doc.id, ...doc.data() }

    if (tipjar_amount && tipjar_amount > 0) {
      await adminDb.collection('transactions').add({
        booking_id: booking.id,
        type: 'tip',
        amount: tipjar_amount,
        currency: 'KES',
        status: 'pending',
        notes: `TipJar from booking by ${customer_name}`,
        createdAt: new Date().toISOString()
      })
    }

    try {
      await sendAdminEmailNotification(booking)
    } catch (emailError) {
      console.error('Email notification error:', emailError)
    }

    try {
      await sendCustomerConfirmationEmail(booking)
    } catch (emailError) {
      console.error('Customer email error:', emailError)
    }

    try {
      await sendWhatsAppNotification(booking)
    } catch (whatsappError) {
      console.error('WhatsApp notification error:', whatsappError)
    }

    try {
      await sendTelegramNotification(booking)
    } catch (telegramError) {
      console.error('Telegram notification error:', telegramError)
    }

    return NextResponse.json({
      success: true,
      booking
    })
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

async function sendAdminEmailNotification(booking: any) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'DJ FLOWERZ <noreply@djflowerz.com>',
      to: ADMIN_EMAIL,
      subject: `New Booking Request: ${booking.event_type} - ${booking.customer_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f0abfc;">New Booking Request!</h1>
          <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; color: white;">
            <p><strong>Name:</strong> ${booking.customer_name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Phone:</strong> ${booking.phone}</p>
            <p><strong>Event Type:</strong> ${booking.event_type}</p>
            <p><strong>Date:</strong> ${booking.event_date}</p>
            <p><strong>Time:</strong> ${booking.event_time}</p>
            <p><strong>Location:</strong> ${booking.location}</p>
            ${booking.estimated_budget ? `<p><strong>Budget:</strong> KES ${booking.estimated_budget.toLocaleString()}</p>` : ''}
            ${booking.tipjar_amount > 0 ? `<p><strong>TipJar:</strong> KES ${booking.tipjar_amount.toLocaleString()}</p>` : ''}
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
        </div>
      `,
    }),
  })
}

async function sendCustomerConfirmationEmail(booking: any) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'DJ FLOWERZ <noreply@djflowerz.com>',
      to: booking.email,
      subject: 'Booking Confirmation - DJ FLOWERZ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f0abfc;">Booking Received!</h1>
          <p>Hi ${booking.customer_name},</p>
          <p>Thank you for booking DJ FLOWERZ for your ${booking.event_type} event!</p>
          <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; color: white; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Event:</strong> ${booking.event_type}</p>
            <p><strong>Date:</strong> ${booking.event_date}</p>
            <p><strong>Time:</strong> ${booking.event_time}</p>
            <p><strong>Location:</strong> ${booking.location}</p>
          </div>
          <p>We'll get back to you within 24 hours to confirm your booking.</p>
          <p>For urgent inquiries, contact us via WhatsApp: ${ADMIN_WHATSAPP}</p>
          <p>Best regards,<br/>DJ FLOWERZ Team</p>
        </div>
      `,
    }),
  })
}

async function sendWhatsAppNotification(booking: any) {
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_FROM
  
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_WHATSAPP) return

  const message = `
New Booking:
Name: ${booking.customer_name}
Phone: ${booking.phone}
Event: ${booking.event_type}
Date: ${booking.event_date} ${booking.event_time}
Location: ${booking.location}
TipJar: KES ${booking.tipjar_amount || 0}
Notes: ${booking.notes || 'None'}
  `.trim()

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: TWILIO_WHATSAPP,
      To: `whatsapp:${ADMIN_WHATSAPP}`,
      Body: message,
    }),
  })
}

async function sendTelegramNotification(booking: any) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
  
  if (!BOT_TOKEN || !CHAT_ID) return

  const message = `
<b>New Booking Request!</b>

<b>Name:</b> ${booking.customer_name}
<b>Email:</b> ${booking.email}
<b>Phone:</b> ${booking.phone}
<b>Event:</b> ${booking.event_type}
<b>Date:</b> ${booking.event_date} ${booking.event_time}
<b>Location:</b> ${booking.location}
<b>TipJar:</b> KES ${booking.tipjar_amount || 0}
${booking.notes ? `<b>Notes:</b> ${booking.notes}` : ''}
  `.trim()

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    }),
  })
}
