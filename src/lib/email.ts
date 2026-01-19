const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'DJ FLOWERZ <noreply@djflowerz.com>'

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log('Email would be sent (no API key):', data.subject, 'to', data.to)
    return true
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export function getSubscriptionWelcomeEmail(tier: string, endDate: string): { subject: string; html: string } {
  const tierNames: Record<string, string> = {
    weekly: '1 Week',
    monthly: '1 Month',
    '3months': '3 Months',
    '6months': '6 Months',
    '12months': '12 Months (VIP)',
  }

  return {
    subject: `Welcome to DJ FLOWERZ Music Pool! 🎵`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { background: #111; border-radius: 16px; padding: 30px; margin-bottom: 30px; }
          h1 { color: #fff; margin-top: 0; }
          p { color: #a1a1aa; line-height: 1.6; }
          .highlight { background: linear-gradient(to right, #d946ef20, #06b6d420); border-radius: 12px; padding: 20px; margin: 20px 0; }
          .highlight h3 { color: #d946ef; margin-top: 0; }
          .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(to right, #d946ef, #06b6d4); color: #fff; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; color: #71717a; font-size: 12px; }
          ul { color: #a1a1aa; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DJ FLOWERZ</div>
          </div>
          <div class="content">
            <h1>Welcome to the Music Pool! 🎉</h1>
            <p>Your subscription has been activated successfully. You now have full access to our exclusive DJ tracks, edits, and remixes.</p>
            
            <div class="highlight">
              <h3>Your Subscription Details</h3>
              <p style="margin: 0;"><strong>Plan:</strong> ${tierNames[tier] || tier}</p>
              <p style="margin: 8px 0 0 0;"><strong>Valid Until:</strong> ${endDate}</p>
            </div>
            
            <h3>What You Get:</h3>
            <ul>
              <li>Unlimited downloads from the Music Pool</li>
              <li>Exclusive DJ edits and remixes</li>
              <li>Clean & Dirty versions</li>
              <li>BPM & Key tagged tracks</li>
              <li>New releases every week</li>
              <li>Access to our Telegram DJ community</li>
            </ul>
            
            <center>
              <a href="https://djflowerz.com/music-pool" class="btn">Access Music Pool</a>
            </center>
          </div>
          <div class="footer">
            <p>DJ FLOWERZ | Premium DJ Music Pool</p>
            <p>Questions? Reply to this email or join our Telegram.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export function getOrderConfirmationEmail(orderDetails: {
  items: Array<{ title: string; price: number }>
  total: number
  reference: string
}): { subject: string; html: string } {
  const itemsHtml = orderDetails.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #333;">${item.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">KSh ${item.price.toLocaleString()}</td>
    </tr>
  `).join('')

  return {
    subject: `Order Confirmed - DJ FLOWERZ #${orderDetails.reference.slice(-8)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { background: #111; border-radius: 16px; padding: 30px; margin-bottom: 30px; }
          h1 { color: #fff; margin-top: 0; }
          p { color: #a1a1aa; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #333; color: #71717a; }
          .total { font-size: 20px; color: #06b6d4; font-weight: bold; }
          .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(to right, #d946ef, #06b6d4); color: #fff; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DJ FLOWERZ</div>
          </div>
          <div class="content">
            <h1>Order Confirmed! ✓</h1>
            <p>Thank you for your purchase. Your order has been confirmed and is ready.</p>
            
            <table>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Price</th>
              </tr>
              ${itemsHtml}
              <tr>
                <td style="padding: 12px;"><strong>Total</strong></td>
                <td style="padding: 12px; text-align: right;" class="total">KSh ${orderDetails.total.toLocaleString()}</td>
              </tr>
            </table>
            
            <p style="color: #71717a; font-size: 12px;">Order Reference: ${orderDetails.reference}</p>
            
            <center>
              <a href="https://djflowerz.com/dashboard" class="btn">View Your Downloads</a>
            </center>
          </div>
          <div class="footer">
            <p>DJ FLOWERZ | Premium DJ Music Pool</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export function getSubscriptionExpiryEmail(tier: string, daysRemaining: number): { subject: string; html: string } {
  const isExpired = daysRemaining <= 0

  return {
    subject: isExpired 
      ? `Your DJ FLOWERZ Music Pool subscription has expired` 
      : `Your Music Pool subscription expires in ${daysRemaining} days`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { background: #111; border-radius: 16px; padding: 30px; margin-bottom: 30px; }
          h1 { color: #fff; margin-top: 0; }
          p { color: #a1a1aa; line-height: 1.6; }
          .warning { background: ${isExpired ? '#7f1d1d' : '#854d0e'}; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .warning h3 { color: ${isExpired ? '#fca5a5' : '#fde047'}; margin-top: 0; }
          .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(to right, #d946ef, #06b6d4); color: #fff; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DJ FLOWERZ</div>
          </div>
          <div class="content">
            <h1>${isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}</h1>
            
            <div class="warning">
              <h3>${isExpired ? '⚠️ Your access has ended' : `⏰ ${daysRemaining} days remaining`}</h3>
              <p style="margin: 0; color: #fff;">
                ${isExpired 
                  ? 'Your Music Pool subscription has expired. Renew now to continue accessing exclusive DJ tracks and edits.'
                  : 'Your Music Pool subscription is expiring soon. Renew now to avoid losing access to our exclusive content.'}
              </p>
            </div>
            
            <p>Don't miss out on:</p>
            <ul style="color: #a1a1aa;">
              <li>Weekly new releases</li>
              <li>Exclusive DJ edits</li>
              <li>Clean & Dirty versions</li>
              <li>Telegram community access</li>
            </ul>
            
            <center>
              <a href="https://djflowerz.com/music-pool" class="btn">Renew Subscription</a>
            </center>
          </div>
          <div class="footer">
            <p>DJ FLOWERZ | Premium DJ Music Pool</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export function getDownloadLinkEmail(downloadUrl: string, itemTitle: string): { subject: string; html: string } {
  return {
    subject: `Your download is ready - ${itemTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { background: #111; border-radius: 16px; padding: 30px; margin-bottom: 30px; }
          h1 { color: #fff; margin-top: 0; }
          p { color: #a1a1aa; line-height: 1.6; }
          .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(to right, #d946ef, #06b6d4); color: #fff; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }
          .note { background: #1c1c1c; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 12px; color: #71717a; }
          .footer { text-align: center; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DJ FLOWERZ</div>
          </div>
          <div class="content">
            <h1>Your Download is Ready!</h1>
            <p>Click the button below to download <strong>${itemTitle}</strong></p>
            
            <center>
              <a href="${downloadUrl}" class="btn">Download Now</a>
            </center>
            
            <div class="note">
              <strong>Note:</strong> This download link expires in 24 hours. If you have any issues, please contact support.
            </div>
          </div>
          <div class="footer">
            <p>DJ FLOWERZ | Premium DJ Music Pool</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export function getBookingResponseEmail(data: {
  customerName: string
  eventType: string
  eventDate: string
  message: string
}): { subject: string; html: string } {
  return {
    subject: `DJ FLOWERZ Booking Update - ${data.eventType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { background: #111; border-radius: 16px; padding: 30px; margin-bottom: 30px; }
          h1 { color: #fff; margin-top: 0; }
          p { color: #a1a1aa; line-height: 1.6; }
          .message-box { background: linear-gradient(to right, #d946ef20, #06b6d420); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #d946ef; }
          .message-box p { color: #fff; margin: 0; }
          .details { background: #1c1c1c; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .footer { text-align: center; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DJ FLOWERZ</div>
          </div>
          <div class="content">
            <h1>Booking Update</h1>
            <p>Hi ${data.customerName},</p>
            <p>Here's an update regarding your booking:</p>
            
            <div class="details">
              <p style="color: #71717a; margin: 0;">Event: <span style="color: #fff;">${data.eventType}</span></p>
              <p style="color: #71717a; margin: 8px 0 0 0;">Date: <span style="color: #fff;">${data.eventDate}</span></p>
            </div>
            
            <div class="message-box">
              <p>${data.message}</p>
            </div>
            
            <p>If you have any questions, feel free to reply to this email or contact us directly.</p>
          </div>
          <div class="footer">
            <p>DJ FLOWERZ | Professional DJ Services</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}
