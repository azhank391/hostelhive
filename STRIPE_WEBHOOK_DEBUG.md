# Stripe Webhook & Quota Update Debugging Guide

## Problem Statement
After successful checkout, quotas are not updating. Stripe webhooks may not be properly configured or firing.

## System Architecture

### Backend Webhook Flow
1. **Stripe sends webhook** → `https://hostelhive.work.gd/api/webhooks/stripe`
2. **Server receives** → `webhookController.handleStripeWebhook()`
3. **Processes events**:
   - `checkout.session.completed` - Initial payment
   - `customer.subscription.created` - New subscription
   - `customer.subscription.updated` - Subscription changes
   - `invoice.paid` - Invoice payment
   - `invoice.finalized` - Invoice ready
4. **Updates database** → `updateHostelWithSubscription()` function
5. **Updates fields**:
   - `plan_id` (basic, pro, trial_basic, free)
   - `subscription_status` (active, canceled, etc.)
   - `current_period_start`, `current_period_end`
   - `isPaid`, `isActive`

### Frontend Quota Flow
1. **useBilling hook** fetches `/api/billing/subscription-status`
2. **Returns**: `plan_id`, `subscription_status`, period dates
3. **Middleware checks** `plan_id` against `planLimits.js`
4. **Enforces quotas**:
   ```javascript
   basic: {
     max_students: 500,
     max_rooms: unlimited,
     max_wardens: 5,
     max_staff: 20
   }
   pro: {
     max_students: unlimited,
     max_rooms: unlimited,
     max_wardens: unlimited,
     max_staff: unlimited
   }
   ```

## Diagnostic Steps

### Step 1: Verify Webhook Endpoint Exists
✅ **Endpoint is accessible**: `https://hostelhive.work.gd/api/webhooks/stripe`
- Returns "Webhook Error: No stripe-signature header value was provided" (correct behavior)

### Step 2: Check Stripe Dashboard Configuration

**Go to**: https://dashboard.stripe.com/test/webhooks

**Required Configuration:**
- [ ] Webhook endpoint URL: `https://hostelhive.work.gd/api/webhooks/stripe`
- [ ] Selected events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `invoice.paid`
  - [ ] `invoice.finalized`
- [ ] Status: Enabled

**If webhook doesn't exist:**
1. Click "Add endpoint"
2. Enter URL: `https://hostelhive.work.gd/api/webhooks/stripe`
3. Select all 5 events above
4. Click "Add endpoint"
5. **CRITICAL**: Copy the new signing secret (starts with `whsec_...`)

### Step 3: Update Webhook Secret

**Current secret in server `.env`:**
```
STRIPE_WEBHOOK_SECRET=whsec_c1765f8bc77a9a6a5ebc10d819de084289b21c3bdd533552c074023512d99f10
```

**⚠️ IMPORTANT**: This secret MUST match the one in Stripe Dashboard

**To update:**
1. SSH to server (or use GitHub Actions to update secrets)
2. Edit `/var/www/hostelhive/server/.env`
3. Update `STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET_HERE`
4. Restart server: `pm2 restart hostelhive-api`

### Step 4: Test Webhook Delivery

**In Stripe Dashboard:**
1. Go to Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Click "Send test webhook"

**Expected Response:**
- Status: 200 OK
- Response: `{"received":true}`

**Check Logs:**
```bash
pm2 logs hostelhive-api --lines 100 | grep -i "webhook\|stripe\|checkout"
```

**Expected Log Output:**
```
🎯 Processing webhook: checkout.session.completed evt_xxxxx
💳 Checkout completed: cs_xxxxx
📝 Updating hostel: <hostel-id> {...}
```

### Step 5: Verify Database Updates

**After successful test webhook:**
```sql
SELECT 
  id, 
  name, 
  plan_id, 
  subscription_status, 
  isPaid, 
  isActive,
  stripe_subscription_id,
  current_period_start,
  current_period_end
FROM Hostels 
WHERE stripe_customer_id = 'cus_xxxxx';
```

**Expected Values After Checkout:**
- `plan_id`: 'basic' or 'pro' (NOT null)
- `subscription_status`: 'active' or 'trialing'
- `isPaid`: 1 (true)
- `isActive`: 1 (true)
- `stripe_subscription_id`: 'sub_xxxxx'
- `current_period_start`: Valid date
- `current_period_end`: Valid date (30 days later)

### Step 6: Test Frontend Quota Display

**After webhook successful:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Go to Billing page
3. Check subscription status display
4. Try creating resources (students, rooms, etc.)
5. Quotas should reflect new plan limits

## Common Issues & Solutions

### Issue 1: Webhook Not Firing
**Symptoms:**
- No logs in PM2 after checkout
- Database not updating after payment

**Solutions:**
1. Verify webhook endpoint exists in Stripe Dashboard
2. Check webhook is enabled
3. Verify URL is exactly: `https://hostelhive.work.gd/api/webhooks/stripe`
4. Test webhook delivery from dashboard

### Issue 2: Signature Verification Failed
**Symptoms:**
- Logs show: "❌ Webhook signature verification failed"

**Solutions:**
1. Get signing secret from Stripe Dashboard webhook settings
2. Update server `.env` with correct `STRIPE_WEBHOOK_SECRET`
3. Restart PM2: `pm2 restart hostelhive-api`
4. Test again

### Issue 3: plan_id Not Updating
**Symptoms:**
- Webhook fires successfully
- Database updates but `plan_id` is null or wrong

**Debug:**
1. Check webhook logs for plan_id value
2. Verify Stripe Price has `metadata.plan_id` set
3. Check `normalizePlanId()` function is working

**Fix:**
```javascript
// In Stripe Dashboard, for each Price:
// Add metadata: plan_id = "basic" or "pro"
```

### Issue 4: Quotas Not Reflecting in Frontend
**Symptoms:**
- Database shows correct `plan_id`
- Frontend still shows old quotas

**Solutions:**
1. Hard refresh browser (clear cache)
2. Check `useBilling` hook is fetching latest data
3. Verify `/api/billing/subscription-status` returns updated plan_id
4. Check console for API errors

## Quick Test Script

```bash
# Test webhook endpoint
curl -X POST https://hostelhive.work.gd/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Expected: "Webhook Error: No stripe-signature header value was provided"

# Check PM2 logs
pm2 logs hostelhive-api --lines 50
```

## Next Steps

1. **Immediate**: Check if webhook exists in Stripe Dashboard
2. **If missing**: Create webhook with correct URL and events
3. **Update secret**: Copy new signing secret to server `.env`
4. **Restart server**: `pm2 restart hostelhive-api`
5. **Test**: Send test webhook from Stripe Dashboard
6. **Verify**: Check logs and database
7. **Frontend test**: Hard refresh and check quotas

## Monitoring

**After fix, monitor:**
- PM2 logs during checkout
- Database `plan_id` updates
- Frontend subscription status
- Quota enforcement on resource creation

## Support Resources

- Stripe Webhook Docs: https://stripe.com/docs/webhooks
- Stripe Test Mode: https://dashboard.stripe.com/test
- PM2 Logs: `pm2 logs hostelhive-api`
- Database: Check Hostels table for subscription fields
