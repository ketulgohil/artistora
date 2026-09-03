# Mehndi Marketplace — Gap Analysis & Fix Plan

## P0 — Critical Fixes

### 2.1 Customer Identity & Secure Booking Access
- [x] Define customer identity strategy; do not force registration before submitting a quote
- [x] Allow guest quote requests with name, phone, email and event details
- [x] Use phone/email verification or a lightweight account for secure /my-bookings access
- [x] Enforce customer ownership of bookings and reviews server-side

### 2.2 Separate Lead from Quote
- [x] Create Quotes collection
- [x] Fields: lead, artist, amount, message, estimatedHours, travelFee, numberOfArtists, validUntil, status, createdAt
- [x] Statuses: pending, sent, viewed, accepted, rejected, expired, withdrawn
- [x] Store the selected quote on the lead/booking

### 2.3 Artist Booking Acceptance
- [x] Add statuses: requested → artist_pending → confirmed → in-progress → completed
- [x] Artist can accept or decline
- [x] Store decline reason
- [x] Only accepted requests become confirmed bookings

### 2.4 Basic Availability
- [x] Add available/unavailable date mechanism
- [x] Check confirmed bookings for conflicts before confirmation
- [x] Keep full calendar system for later phase

### 2.5 Flexible Pricing
- [x] Add priceType: hourly, per_person, package, custom_quote
- [x] Keep startingPrice for public display
- [x] Allow quote amount to differ from startingPrice

### 2.6 Multi-Artist Bookings
- [x] Decide between Booking.artists[] or BookingArtists join collection
- [x] Support individual assignment/status for each artist
- [x] Notify every assigned artist separately

### 2.7 Payload Access Control
- [x] Artists can only read/update their own profile and authorized bookings/leads/quotes
- [x] Customers can only access their own bookings, leads and reviews
- [x] Approval and admin mutations must be admin-protected
- [x] Enforce access in Payload, not just frontend

---

## P1 — Important Reliability Fixes

### 3.1 Lead Lifecycle
- [x] new → reviewing → artists_matched → quotes_received → customer_contacted → artist_selected → booking_pending → booked
- [x] Add lost status and lostReason

### 3.2 Lead Ownership
- [x] Add assignedAdmin/owner to Lead
- [x] Allow reassignment later

### 3.3 Cancellation Metadata
- [x] cancelledBy: customer, artist, admin, system
- [x] cancellationReason
- [x] cancelledAt
- [x] Future-ready refundAmount/refundStatus fields

### 3.4 Review Protection
- [x] Verify logged-in customer owns the booking
- [x] Only completed bookings can be reviewed
- [x] Prevent duplicate reviews for one booking
- [x] Store verifiedBooking = true

### 3.5 Approval vs Verification
- [x] approvalStatus: pending, approved, rejected, suspended
- [x] verificationStatus: unverified, verified
- [x] Define evidence required for verified badge

### 3.6 Notifications
- [x] New lead/quote request
- [x] Quote received
- [x] Booking request
- [x] Artist accepted/declined
- [x] Booking confirmed/cancelled
- [x] Event reminder
- [x] Review request after completion

### 3.7 Customer Privacy by Stage
- [x] Before selection: expose only area/city, date, service, guest count, budget, requirements
- [x] After confirmation: expose contact details
- [x] Document read/write permissions for every role

---

## P2 — Scale & Monetization Readiness

### 4.1 Payments / Advance Booking
- [ ] totalAmount, advanceAmount, remainingAmount
- [ ] platformFee, artistAmount
- [ ] paymentStatus: unpaid, pending, partially_paid, paid, refunded

### 4.2 Artist Analytics
- [ ] Profile views, leads, quotes, bookings won, conversion rate, reviews, earnings

### 4.3 Featured Listings / Subscriptions
- [ ] Free profile, featured placement, more portfolio capacity, analytics
- [ ] Subscription status and renewal dates

### 4.4 Search Ranking
- [ ] Rating, verified reviews, response rate, completed bookings, profile completeness, location relevance

---

## Target Flow After Fixes

**Customer:** Search/Get 3 Quotes → submit enquiry → Lead → matched artists → multiple Quotes → select quote → Booking Request → artist accepts → Confirmed → Event → Completed → Verified Review

**Artist:** Register → pending → approved/verified → public profile → receive quote/booking requests → quote → accept booking → complete job → receive review

**Admin:** Approve/verify → monitor leads → match artists → monitor quotes → resolve issues → manage cancellations/reviews → later payments/subscriptions
