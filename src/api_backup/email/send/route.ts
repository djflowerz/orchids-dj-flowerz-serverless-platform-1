import { NextRequest, NextResponse } from 'next/server'
import { 
  sendEmail, 
  getSubscriptionWelcomeEmail, 
  getOrderConfirmationEmail, 
  getSubscriptionExpiryEmail,
  getDownloadLinkEmail,
  getBookingResponseEmail
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, email, data } = body

    if (!email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let emailContent: { subject: string; html: string }

    switch (type) {
      case 'subscription_welcome':
        emailContent = getSubscriptionWelcomeEmail(data.tier, data.endDate)
        break
      case 'order_confirmation':
        emailContent = getOrderConfirmationEmail(data)
        break
      case 'subscription_expiry':
        emailContent = getSubscriptionExpiryEmail(data.tier, data.daysRemaining)
        break
      case 'download_link':
        emailContent = getDownloadLinkEmail(data.downloadUrl, data.itemTitle)
        break
      case 'booking_response':
        emailContent = getBookingResponseEmail(data)
        break
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    const success = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
