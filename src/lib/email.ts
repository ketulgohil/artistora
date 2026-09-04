import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Artistora <hello@artistora.com>'

export async function sendBookingConfirmation(to: string, data: {
  name: string
  eventType: string
  eventDate: string
  location: string
}) {
  const eventLabels: Record<string, string> = {
    bridal: 'Legacy Booking',
    engagement: 'Engagement',
    'baby-shower': 'Baby Shower',
    'family-function': 'Family Function',
    festival: 'Festival',
    wedding: 'Wedding',
    corporate: 'Corporate Event',
    birthday: 'Birthday',
    other: 'Other',
  }

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #04224b;">
      <div style="background: linear-gradient(135deg, #ec6783, #d14a68); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Booking Request Received</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Artistora</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #f1d9dc; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${data.name}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #41506b;">
          Thank you for reaching out to Artistora! We've received your booking request and will get back to you within <strong>24 hours</strong> to confirm artist availability.
        </p>
        <div style="background: #fdeeee; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ec6783; font-weight: 600;">Booking Details</p>
          <table style="width: 100%; font-size: 14px; color: #04224b;">
            <tr><td style="padding: 4px 0; color: #7e8aa3;">Event Type</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${eventLabels[data.eventType] || data.eventType}</td></tr>
            <tr><td style="padding: 4px 0; color: #7e8aa3;">Event Date</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding: 4px 0; color: #7e8aa3;">Location</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${data.location}</td></tr>
          </table>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #41506b;">
          If you need to reach us sooner, feel free to call or WhatsApp us at <strong>+91 7405387720</strong>.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Request Received — ${eventLabels[data.eventType] || data.eventType}`,
    html,
  })
}

export async function sendBookingNotification(data: {
  name: string
  phone: string
  email?: string
  eventType: string
  eventDate: string
  location: string
  guestCount?: number
  message?: string
}) {
  const eventLabels: Record<string, string> = {
    bridal: 'Legacy Booking',
    engagement: 'Engagement',
    'baby-shower': 'Baby Shower',
    'family-function': 'Family Function',
    festival: 'Festival',
    wedding: 'Wedding',
    corporate: 'Corporate Event',
    birthday: 'Birthday',
    other: 'Other',
  }

  const notifyTo = process.env.RESEND_NOTIFY_EMAIL || 'hello@artistora.com'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #04224b;">
      <div style="background: #04224b; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ec6783; margin: 0; font-size: 18px;">New Booking Request</h1>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #f1d9dc; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; font-size: 14px; color: #04224b; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Name</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Phone</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
          ${data.email ? `<tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Email</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.email}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Event Type</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${eventLabels[data.eventType] || data.eventType}</td></tr>
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Event Date</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Location</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.location}</td></tr>
          ${data.guestCount ? `<tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Guest Count</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.guestCount}</td></tr>` : ''}
          ${data.message ? `<tr><td style="padding: 8px 0; color: #7e8aa3;">Message</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.message}</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://wa.me/91${data.phone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: white; padding: 10px 24px; border-radius: 24px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply on WhatsApp</a>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: notifyTo,
    subject: `New Booking: ${data.name} — ${eventLabels[data.eventType] || data.eventType}`,
    html,
  })
}

export async function sendCustomerWelcome(to: string, name: string) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #04224b;">
      <div style="background: linear-gradient(135deg, #ec6783, #d14a68); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to Artistora!</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #f1d9dc; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #41506b;">
          Your account has been created successfully. You can now browse our portfolio, explore artist services, and request quotes directly.
        </p>
        <div style="background: #fdeeee; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ec6783; font-weight: 600;">Quick Links</p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'}/get-quote" style="color: #d14a68; text-decoration: none; font-weight: 600;">Get a Quote</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'}/portfolio" style="color: #d14a68; text-decoration: none; font-weight: 600;">View Portfolio</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'}/services" style="color: #d14a68; text-decoration: none; font-weight: 600;">Explore Services</a></p>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #41506b;">
          Need help? Reach us at <strong>+91 7405387720</strong> or on WhatsApp.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Artistora!',
    html,
  })
}

export async function sendArtistWelcome(to: string, name: string) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #04224b;">
      <div style="background: linear-gradient(135deg, #031936, #04224b); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ec6783; margin: 0; font-size: 22px;">Welcome, Artist!</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Artistora Marketplace</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #f1d9dc; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #41506b;">
          Your artist account is ready! You can now set up your profile, showcase your work, and receive booking leads from customers across Ahmedabad.
        </p>
        <div style="background: #fdeeee; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ec6783; font-weight: 600;">Get Started</p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'}/dashboard" style="color: #d14a68; text-decoration: none; font-weight: 600;">Complete Your Profile</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'}/artists" style="color: #d14a68; text-decoration: none; font-weight: 600;">View Artist Directory</a></p>
        </div>
        <div style="background: #fdeeee; border-left: 3px solid #ec6783; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #41506b;">
            <strong>Tip:</strong> Complete your profile with photos, service details, and pricing to get more booking requests from customers.
          </p>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #41506b;">
          Questions? Contact us at <strong>+91 7405387720</strong> or on WhatsApp.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Artistora — Artist Dashboard',
    html,
  })
}

const EVENT_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement',
  'baby-shower': 'Baby Shower',
  birthday: 'Birthday',
  corporate: 'Corporate Event',
  festival: 'Festival',
  'family-function': 'Family Function',
  other: 'Other',
}

const BUDGET_LABELS: Record<string, string> = {
  'under-2000': 'Under ₹2,000',
  '2000-5000': '₹2,000 – ₹5,000',
  '5000-10000': '₹5,000 – ₹10,000',
  '10000-20000': '₹10,000 – ₹20,000',
  '20000-50000': '₹20,000 – ₹50,000',
  'above-50000': 'Above ₹50,000',
  unsure: 'Not sure yet',
}

export async function sendQuoteConfirmation(to: string, data: {
  customerName: string
  eventType: string
  eventDate: string
  eventLocation: string
}) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #04224b;">
      <div style="background: linear-gradient(135deg, #ec6783, #d14a68); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Quote Request Received</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Artistora Marketplace</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #f1d9dc; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${data.customerName}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #41506b;">
          Thank you for your quote request! We've received your details and will match you with up to <strong>3 verified artists</strong> who fit your event.
        </p>
        <div style="background: #fdeeee; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ec6783; font-weight: 600;">Request Details</p>
          <table style="width: 100%; font-size: 14px; color: #04224b;">
            <tr><td style="padding: 4px 0; color: #7e8aa3;">Event Type</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${EVENT_LABELS[data.eventType] || data.eventType}</td></tr>
            <tr><td style="padding: 4px 0; color: #7e8aa3;">Event Date</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding: 4px 0; color: #7e8aa3;">Location</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${data.eventLocation}</td></tr>
          </table>
        </div>
        <div style="background: #fdeeee; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #17856b;">
            <strong>What happens next?</strong><br/>
            We'll match you with artists and send quotes via WhatsApp within <strong>24 hours</strong>.
          </p>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #41506b;">
          Questions? Reach us at <strong>+91 7405387720</strong> or on WhatsApp.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Quote Request Received — ${EVENT_LABELS[data.eventType] || data.eventType}`,
    html,
  })
}

export async function sendQuoteNotification(data: {
  customerName: string
  customerPhone: string
  customerEmail?: string
  eventType: string
  eventDate: string
  eventLocation: string
  guestCount?: number
  budgetRange?: string
  designStyle?: string
  additionalNotes?: string
}) {
  const notifyTo = process.env.RESEND_NOTIFY_EMAIL || 'hello@artistora.com'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #04224b;">
      <div style="background: #04224b; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ec6783; margin: 0; font-size: 18px;">New Quote Request</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 13px;">Marketplace Lead</p>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #f1d9dc; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; font-size: 14px; color: #04224b; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Customer</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Phone</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;"><a href="tel:${data.customerPhone}" style="color: #ec6783;">${data.customerPhone}</a></td></tr>
          ${data.customerEmail ? `<tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Email</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.customerEmail}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Event Type</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${EVENT_LABELS[data.eventType] || data.eventType}</td></tr>
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Event Date</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Location</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.eventLocation}</td></tr>
          ${data.guestCount ? `<tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Guests</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.guestCount}</td></tr>` : ''}
          ${data.budgetRange ? `<tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Budget</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${BUDGET_LABELS[data.budgetRange] || data.budgetRange}</td></tr>` : ''}
          ${data.designStyle ? `<tr><td style="padding: 8px 0; color: #7e8aa3; border-bottom: 1px solid #f1d9dc;">Style</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1d9dc;">${data.designStyle}</td></tr>` : ''}
          ${data.additionalNotes ? `<tr><td style="padding: 8px 0; color: #7e8aa3;">Notes</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.additionalNotes}</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://wa.me/91${data.customerPhone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: white; padding: 10px 24px; border-radius: 24px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply on WhatsApp</a>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: notifyTo,
    subject: `New Quote Request: ${data.customerName} — ${EVENT_LABELS[data.eventType] || data.eventType}`,
    html,
  })
}

export async function sendArtistBookingEmail(to: string, data: {
  artistName: string
  customerName: string
  customerPhone: string
  eventType: string
  eventDate: string
  eventLocation: string
  guestCount?: number
  designStyle?: string
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #04224b;">
      <div style="background: linear-gradient(135deg, #04224b, #031936); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">New Booking Assigned!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Artistora Marketplace</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #f1d9dc; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${data.artistName}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #41506b;">
          Great news! You've been assigned a new booking. Please contact the customer to confirm the details.
        </p>
        <div style="background: #fdeeee; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ec6783; font-weight: 600;">Booking Details</p>
          <table style="width: 100%; font-size: 14px; color: #04224b;">
            <tr><td style="padding: 6px 0; color: #7e8aa3;">Customer</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.customerName}</td></tr>
            <tr><td style="padding: 6px 0; color: #7e8aa3;">Phone</td><td style="padding: 6px 0; text-align: right; font-weight: 600;"><a href="tel:${data.customerPhone}" style="color: #ec6783;">${data.customerPhone}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #7e8aa3;">Event Type</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${EVENT_LABELS[data.eventType] || data.eventType}</td></tr>
            <tr><td style="padding: 6px 0; color: #7e8aa3;">Event Date</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding: 6px 0; color: #7e8aa3;">Location</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.eventLocation}</td></tr>
            ${data.guestCount ? `<tr><td style="padding: 6px 0; color: #7e8aa3;">Guests</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.guestCount}</td></tr>` : ''}
            ${data.designStyle ? `<tr><td style="padding: 6px 0; color: #7e8aa3;">Style</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.designStyle}</td></tr>` : ''}
          </table>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://wa.me/91${data.customerPhone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: white; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-size: 14px; font-weight: 600;">Contact Customer on WhatsApp</a>
        </div>
        <div style="background: #fdeeee; border-left: 3px solid #ec6783; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #41506b;">
            <strong>Reminder:</strong> Please complete the booking on time and maintain the quality standards expected on our platform.
          </p>
        </div>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `New Booking: ${EVENT_LABELS[data.eventType] || data.eventType} on ${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
    html,
  })
}

// ── Artist Accepted Booking ──
export async function sendArtistAcceptedEmail(to: string, data: {
  artistName: string
  customerName: string
  eventType: string
  eventDate: string
  eventLocation: string
}) {
  const EVENT_LABELS: Record<string, string> = {
    wedding: 'Wedding',
    engagement: 'Engagement',
    'baby-shower': 'Baby Shower',
    birthday: 'Birthday',
    corporate: 'Corporate Event',
    festival: 'Festival',
    'family-function': 'Family Function',
    bridal: 'Legacy Booking',
    other: 'Other',
  }

  const html = `
    <div style="font-family: 'Manrope', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #f1d9dc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #04224B;">Booking Confirmed</h1>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        Hi ${data.artistName},
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        You have accepted the booking for <strong>${data.customerName}</strong>.
      </p>
      <div style="background: #fdeeee; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #04224B;"><strong>Event:</strong> ${EVENT_LABELS[data.eventType] || data.eventType}</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #04224B;"><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin: 0; font-size: 14px; color: #04224B;"><strong>Location:</strong> ${data.eventLocation}</p>
      </div>
      <p style="margin: 20px 0 0; font-size: 14px; color: #7e8aa3; line-height: 1.6;">
        Please prepare for the event. You can view booking details in your dashboard.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="https://www.artistora.com/dashboard" style="display: inline-block; padding: 12px 32px; background: #ec6783; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px;">View Dashboard</a>
      </div>
      <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Confirmed: ${EVENT_LABELS[data.eventType] || data.eventType} on ${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
    html,
  })
}

// ── Artist Declined Booking ──
export async function sendArtistDeclinedEmail(to: string, data: {
  artistName: string
  customerName: string
  eventType: string
  eventDate: string
  reason?: string
}) {
  const EVENT_LABELS: Record<string, string> = {
    wedding: 'Wedding',
    engagement: 'Engagement',
    'baby-shower': 'Baby Shower',
    birthday: 'Birthday',
    corporate: 'Corporate Event',
    festival: 'Festival',
    'family-function': 'Family Function',
    bridal: 'Legacy Booking',
    other: 'Other',
  }

  const html = `
    <div style="font-family: 'Manrope', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #f1d9dc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #04224B;">Booking Declined</h1>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        Hi ${data.artistName},
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        The booking for <strong>${data.customerName}</strong> has been declined.
      </p>
      <div style="background: #fdeeee; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #04224B;"><strong>Event:</strong> ${EVENT_LABELS[data.eventType] || data.eventType}</p>
        <p style="margin: 0; font-size: 14px; color: #04224B;"><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        ${data.reason ? `<p style="margin: 8px 0 0; font-size: 14px; color: #04224B;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
      </div>
      <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Declined: ${EVENT_LABELS[data.eventType] || data.eventType}`,
    html,
  })
}

// ── Booking Cancelled ──
export async function sendBookingCancelledEmail(to: string, data: {
  name: string
  eventType: string
  eventDate: string
  cancelledBy: string
  reason?: string
}) {
  const EVENT_LABELS: Record<string, string> = {
    wedding: 'Wedding',
    engagement: 'Engagement',
    'baby-shower': 'Baby Shower',
    birthday: 'Birthday',
    corporate: 'Corporate Event',
    festival: 'Festival',
    'family-function': 'Family Function',
    bridal: 'Legacy Booking',
    other: 'Other',
  }

  const html = `
    <div style="font-family: 'Manrope', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #f1d9dc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #04224B;">Booking Cancelled</h1>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        Hi ${data.name},
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        Your booking for <strong>${EVENT_LABELS[data.eventType] || data.eventType}</strong> has been cancelled.
      </p>
      <div style="background: #fdeeee; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #04224B;"><strong>Event:</strong> ${EVENT_LABELS[data.eventType] || data.eventType}</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #04224B;"><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #04224B;"><strong>Cancelled by:</strong> ${data.cancelledBy}</p>
        ${data.reason ? `<p style="margin: 0; font-size: 14px; color: #04224B;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
      </div>
      <p style="margin: 20px 0 0; font-size: 14px; color: #7e8aa3; line-height: 1.6;">
        If you have any questions, please contact us at <a href="mailto:support@artistora.com" style="color: #ec6783;">support@artistora.com</a>.
      </p>
      <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Cancelled: ${EVENT_LABELS[data.eventType] || data.eventType}`,
    html,
  })
}

// ── Review Request ──
export async function sendReviewRequestEmail(to: string, data: {
  customerName: string
  artistName: string
  eventType: string
  bookingId: number
}) {
  const EVENT_LABELS: Record<string, string> = {
    wedding: 'Wedding',
    engagement: 'Engagement',
    'baby-shower': 'Baby Shower',
    birthday: 'Birthday',
    corporate: 'Corporate Event',
    festival: 'Festival',
    'family-function': 'Family Function',
    bridal: 'Legacy Booking',
    other: 'Other',
  }

  const html = `
    <div style="font-family: 'Manrope', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #f1d9dc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #04224B;">How was your experience?</h1>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        Hi ${data.customerName},
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        Your <strong>${EVENT_LABELS[data.eventType] || data.eventType}</strong> session with <strong>${data.artistName}</strong> has been completed. We'd love to hear your feedback!
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #41506b; line-height: 1.6;">
        Your review helps other customers find the best artists and helps artists improve their services.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="https://www.artistora.com/my-bookings" style="display: inline-block; padding: 12px 32px; background: #ec6783; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px;">Leave a Review</a>
      </div>
      <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #f1d9dc; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #7e8aa3;">Artistora</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `How was your ${EVENT_LABELS[data.eventType] || data.eventType} with ${data.artistName}?`,
    html,
  })
}
