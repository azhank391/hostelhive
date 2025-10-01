# Stripe Webhook Setup Guide

## Current Configuration

**Backend Webhook URL:** `https://hostelhive.work.gd/api/webhooks/stripe`

**Environment Variables (Server):**
- ✅ STRIPE_SECRET_KEY: Configured (test mode)
- ✅ STRIPE_WEBHOOK_SECRET: `whsec_c1765f8bc77a9a6a5ebc10d819de084289b21c3bdd533552c074023512d99f10`
- ✅ FRONTEND_URL: `https://hostelhive-khaki.vercel.app`

## Webhook Endpoint Status
✅ **Endpoint is accessible and responding**
- Returns "Webhook Error: No stripe-signature header value was provided" (expected behavior)

## Required Events in Stripe Dashboard

The webhook controller handles these events:
1. ✅ `checkout.session.completed` - When payment succeeds
2. ✅ `customer.subscription.created` - When subscription is created
3. ✅ `customer.subscription.updated` - When subscription changes
4. ✅ `invoice.paid` - When invoice is paid
5. ✅ `invoice.finalized` - When invoice is finalized

## Setup Instructions

### 1. Configure Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://hostelhive.work.gd/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.paid`
   - `invoice.finalized`
5. Click **"Add endpoint"**

### 2. Get Webhook Signing Secret

After creating the webhook endpoint:
1. Click on the newly created endpoint
2. Click **"Reveal"** under "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. **IMPORTANT:** Update server `.env` with this NEW secret:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET_HERE
   ```
5. Restart the server: `pm2 restart hostelhive-api`

### 3. Test the Webhook

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **"Send test webhook"**
3. Select `checkout.session.completed` or any event
4. Check if the webhook receives and processes it successfully
5. Check PM2 logs: `pm2 logs hostelhive-api --lines 50`

## Common Issues

### Issue 1: Webhook Secret Mismatch
**Symptom:** "Webhook signature verification failed"
**Solution:** The `STRIPE_WEBHOOK_SECRET` in your server `.env` must match the signing secret from Stripe Dashboard

### Issue 2: Wrong Webhook URL
**Symptom:** Webhooks not received
**Solution:** Ensure URL is exactly: `https://hostelhive.work.gd/api/webhooks/stripe`

### Issue 3: Missing Events
**Symptom:** Some subscription updates not working
**Solution:** Ensure all 5 events listed above are selected in Stripe Dashboard

### Issue 4: Quotas Not Updating
**Symptom:** After checkout, quotas remain the same
**Causes:**
1. Webhook secret mismatch (check logs for "signature verification failed")
2. Missing events in Stripe webhook configuration
3. `updateHostelWithSubscription()` not updating `plan_id` correctly
4. Database not updating `current_period_start/end` dates

**Debug Steps:**
1. Check PM2 logs after a test checkout: `pm2 logs --lines 100`
2. Look for "💳 Checkout completed" or "🔄 Subscription event" messages
3. Verify hostel record in database is updated with new `plan_id`
4. Check if `subscription_status` is "active" and `isPaid` is true

## Current Status

⚠️ **ACTION REQUIRED:**
1. Check if webhook endpoint exists in Stripe Dashboard
2. Verify the signing secret matches server `.env`
3. Test webhook delivery from Stripe Dashboard
4. Monitor logs during a test checkout

## Testing Checklist

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] All 5 events selected
- [ ] Signing secret matches server `.env`
- [ ] Server restarted after env update
- [ ] Test webhook sent successfully from dashboard
- [ ] PM2 logs show webhook received and processed
- [ ] Database updated with subscription details
- [ ] Quotas reflected correctly in frontend
