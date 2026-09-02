import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Shiva Mehndi Art <onboarding@resend.dev>'

export async function sendBookingConfirmation(to: string, data: {
  name: string
  eventType: string
  eventDate: string
  location: string
}) {
  const eventLabels: Record<string, string> = {
    bridal: 'Bridal Mehndi',
    engagement: 'Engagement Mehndi',
    'baby-shower': 'Baby Shower',
    'family-function': 'Family Function',
    festival: 'Festival',
    other: 'Other',
  }

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #2b1c10;">
      <div style="background: linear-gradient(135deg, #b37343, #8c5327); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Booking Request Received</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Shiva Mehndi Art</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #ecdfd0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${data.name}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Thank you for reaching out to Shiva Mehndi Art! We've received your booking request and will get back to you within <strong>24 hours</strong> to confirm availability.
        </p>
        <div style="background: #faf6f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #b37343; font-weight: 600;">Booking Details</p>
          <table style="width: 100%; font-size: 14px; color: #2b1c10;">
            <tr><td style="padding: 4px 0; color: #8a7660;">Event Type</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${eventLabels[data.eventType] || data.eventType}</td></tr>
            <tr><td style="padding: 4px 0; color: #8a7660;">Event Date</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding: 4px 0; color: #8a7660;">Location</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${data.location}</td></tr>
          </table>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          If you need to reach us sooner, feel free to call or WhatsApp us at <strong>+91 8469662012</strong>.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #ecdfd0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #8a7660;">Shiva Mehndi Art — Premium Mehndi Artist in Ahmedabad</p>
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
    bridal: 'Bridal Mehndi',
    engagement: 'Engagement Mehndi',
    'baby-shower': 'Baby Shower',
    'family-function': 'Family Function',
    festival: 'Festival',
    other: 'Other',
  }

  const notifyTo = process.env.RESEND_NOTIFY_EMAIL || 'bhumichanpura1234@gmail.com'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #2b1c10;">
      <div style="background: #241208; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #b37343; margin: 0; font-size: 18px;">New Booking Request</h1>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #ecdfd0; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; font-size: 14px; color: #2b1c10; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Name</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Phone</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
          ${data.email ? `<tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Email</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.email}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Event Type</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${eventLabels[data.eventType] || data.eventType}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Event Date</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Location</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.location}</td></tr>
          ${data.guestCount ? `<tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Guest Count</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.guestCount}</td></tr>` : ''}
          ${data.message ? `<tr><td style="padding: 8px 0; color: #8a7660;">Message</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.message}</td></tr>` : ''}
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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #2b1c10;">
      <div style="background: linear-gradient(135deg, #b37343, #8c5327); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to Shiva Mehndi Art!</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #ecdfd0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Your account has been created successfully. You can now browse our portfolio, explore mehndi services, and book sessions directly.
        </p>
        <div style="background: #faf6f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #b37343; font-weight: 600;">Quick Links</p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shivamehndiart.com'}/book" style="color: #b37343; text-decoration: none; font-weight: 600;">Book a Session</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shivamehndiart.com'}/portfolio" style="color: #b37343; text-decoration: none; font-weight: 600;">View Portfolio</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shivamehndiart.com'}/services" style="color: #b37343; text-decoration: none; font-weight: 600;">Explore Services</a></p>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Need help? Reach us at <strong>+91 8469662012</strong> or on WhatsApp.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #ecdfd0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #8a7660;">Shiva Mehndi Art — Premium Mehndi Artist in Ahmedabad</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Shiva Mehndi Art!',
    html,
  })
}

export async function sendArtistWelcome(to: string, name: string) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #2b1c10;">
      <div style="background: linear-gradient(135deg, #241208, #64341a); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #b37343; margin: 0; font-size: 22px;">Welcome, Artist!</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Shiva Mehndi Art Marketplace</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #ecdfd0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Your artist account is ready! You can now set up your profile, showcase your work, and receive booking leads from customers across Ahmedabad.
        </p>
        <div style="background: #faf6f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #b37343; font-weight: 600;">Get Started</p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shivamehndiart.com'}/dashboard" style="color: #b37343; text-decoration: none; font-weight: 600;">Complete Your Profile</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shivamehndiart.com'}/artists" style="color: #b37343; text-decoration: none; font-weight: 600;">View Artist Directory</a></p>
        </div>
        <div style="background: #fff8f0; border-left: 3px solid #b37343; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #5c4a3a;">
            <strong>Tip:</strong> Complete your profile with photos, service details, and pricing to get more booking requests from customers.
          </p>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Questions? Contact us at <strong>+91 8469662012</strong> or on WhatsApp.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #ecdfd0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #8a7660;">Shiva Mehndi Art — Premium Mehndi Artist in Ahmedabad</p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Shiva Mehndi Art — Artist Dashboard',
    html,
  })
}

const EVENT_LABELS: Record<string, string> = {
  bridal: 'Bridal Mehndi',
  engagement: 'Engagement Mehndi',
  'baby-shower': 'Baby Shower',
  'family-function': 'Family Function',
  festival: 'Festival',
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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #2b1c10;">
      <div style="background: linear-gradient(135deg, #b37343, #8c5327); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Quote Request Received</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Shiva Mehndi Art Marketplace</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #ecdfd0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${data.customerName}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Thank you for your quote request! We've received your details and will match you with up to <strong>3 verified mehndi artists</strong> who fit your event.
        </p>
        <div style="background: #faf6f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #b37343; font-weight: 600;">Request Details</p>
          <table style="width: 100%; font-size: 14px; color: #2b1c10;">
            <tr><td style="padding: 4px 0; color: #8a7660;">Event Type</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${EVENT_LABELS[data.eventType] || data.eventType}</td></tr>
            <tr><td style="padding: 4px 0; color: #8a7660;">Event Date</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding: 4px 0; color: #8a7660;">Location</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${data.eventLocation}</td></tr>
          </table>
        </div>
        <div style="background: #f0faf4; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #3f5e4d;">
            <strong>What happens next?</strong><br/>
            We'll match you with artists and send quotes via WhatsApp within <strong>24 hours</strong>.
          </p>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Questions? Reach us at <strong>+91 8469662012</strong> or on WhatsApp.
        </p>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #ecdfd0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #8a7660;">Shiva Mehndi Art — Premium Mehndi Artist in Ahmedabad</p>
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
  const notifyTo = process.env.RESEND_NOTIFY_EMAIL || 'bhumichanpura1234@gmail.com'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #2b1c10;">
      <div style="background: #241208; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #b37343; margin: 0; font-size: 18px;">New Quote Request</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 13px;">Marketplace Lead</p>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #ecdfd0; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; font-size: 14px; color: #2b1c10; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Customer</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Phone</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;"><a href="tel:${data.customerPhone}" style="color: #b37343;">${data.customerPhone}</a></td></tr>
          ${data.customerEmail ? `<tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Email</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.customerEmail}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Event Type</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${EVENT_LABELS[data.eventType] || data.eventType}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Event Date</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Location</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.eventLocation}</td></tr>
          ${data.guestCount ? `<tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Guests</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.guestCount}</td></tr>` : ''}
          ${data.budgetRange ? `<tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Budget</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${BUDGET_LABELS[data.budgetRange] || data.budgetRange}</td></tr>` : ''}
          ${data.designStyle ? `<tr><td style="padding: 8px 0; color: #8a7660; border-bottom: 1px solid #ecdfd0;">Style</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #ecdfd0;">${data.designStyle}</td></tr>` : ''}
          ${data.additionalNotes ? `<tr><td style="padding: 8px 0; color: #8a7660;">Notes</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.additionalNotes}</td></tr>` : ''}
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shivamehndiart.com'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; color: #2b1c10;">
      <div style="background: linear-gradient(135deg, #3f5e4d, #2a3f33); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">New Booking Assigned!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Shiva Mehndi Art Marketplace</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #ecdfd0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Hi <strong>${data.artistName}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #5c4a3a;">
          Great news! You've been assigned a new booking. Please contact the customer to confirm the details.
        </p>
        <div style="background: #faf6f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #b37343; font-weight: 600;">Booking Details</p>
          <table style="width: 100%; font-size: 14px; color: #2b1c10;">
            <tr><td style="padding: 6px 0; color: #8a7660;">Customer</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.customerName}</td></tr>
            <tr><td style="padding: 6px 0; color: #8a7660;">Phone</td><td style="padding: 6px 0; text-align: right; font-weight: 600;"><a href="tel:${data.customerPhone}" style="color: #b37343;">${data.customerPhone}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #8a7660;">Event Type</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${EVENT_LABELS[data.eventType] || data.eventType}</td></tr>
            <tr><td style="padding: 6px 0; color: #8a7660;">Event Date</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding: 6px 0; color: #8a7660;">Location</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.eventLocation}</td></tr>
            ${data.guestCount ? `<tr><td style="padding: 6px 0; color: #8a7660;">Guests</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.guestCount}</td></tr>` : ''}
            ${data.designStyle ? `<tr><td style="padding: 6px 0; color: #8a7660;">Style</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.designStyle}</td></tr>` : ''}
          </table>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://wa.me/91${data.customerPhone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: white; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-size: 14px; font-weight: 600;">Contact Customer on WhatsApp</a>
        </div>
        <div style="background: #fff8f0; border-left: 3px solid #b37343; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #5c4a3a;">
            <strong>Reminder:</strong> Please complete the booking on time and maintain the quality standards expected on our platform.
          </p>
        </div>
        <div style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #ecdfd0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #8a7660;">Shiva Mehndi Art — Premium Mehndi Artist in Ahmedabad</p>
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
