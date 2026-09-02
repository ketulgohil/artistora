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
- [ ] Add statuses: requested → artist_pending → confirmed → in-progress → completed
- [ ] Artist can accept or decline
- [ ] Store decline reason
- [ ] Only accepted requests become confirmed bookings

### 2.4 Basic Availability
- [ ] Add available/unavailable date mechanism
- [ ] Check confirmed bookings for conflicts before confirmation
- [ ] Keep full calendar system for later phase

### 2.5 Flexible Pricing
- [ ] Add priceType: hourly, per_person, package, custom_quote
- [ ] Keep startingPrice for public display
- [ ] Allow quote amount to differ from startingPrice

### 2.6 Multi-Artist Bookings
- [ ] Decide between Booking.artists[] or BookingArtists join collection
- [ ] Support individual assignment/status for each artist
- [ ] Notify every assigned artist separately

### 2.7 Payload Access Control
- [ ] Artists can only read/update their own profile and authorized bookings/leads/quotes
- [ ] Customers can only access their own bookings, leads and reviews
- [ ] Approval and admin mutations must be admin-protected
- [ ] Enforce access in Payload, not just frontend

---

## P1 — Important Reliability Fixes

### 3.1 Lead Lifecycle
- [ ] new → reviewing → artists_matched → quotes_received → customer_contacted → artist_selected → booking_pending → booked
- [ ] Add lost status and lostReason

### 3.2 Lead Ownership
- [ ] Add assignedAdmin/owner to Lead
- [ ] Allow reassignment later

### 3.3 Cancellation Metadata
- [ ] cancelledBy: customer, artist, admin, system
- [ ] cancellationReason
- [ ] cancelledAt
- [ ] Future-ready refundAmount/refundStatus fields

### 3.4 Review Protection
- [ ] Verify logged-in customer owns the booking
- [ ] Only completed bookings can be reviewed
- [ ] Prevent duplicate reviews for one booking
- [ ] Store verifiedBooking = true

### 3.5 Approval vs Verification
- [ ] approvalStatus: pending, approved, rejected, suspended
- [ ] verificationStatus: unverified, verified
- [ ] Define evidence required for verified badge

### 3.6 Notifications
- [ ] New lead/quote request
- [ ] Quote received
- [ ] Booking request
- [ ] Artist accepted/declined
- [ ] Booking confirmed/cancelled
- [ ] Event reminder
- [ ] Review request after completion

### 3.7 Customer Privacy by Stage
- [ ] Before selection: expose only area/city, date, service, guest count, budget, requirements
- [ ] After confirmation: expose contact details
- [ ] Document read/write permissions for every role

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
