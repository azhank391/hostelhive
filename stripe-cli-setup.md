# Stripe CLI Setup & Testing Guide

## Step 1: Install Stripe CLI

### Windows Installation (PowerShell)
```powershell
# Download and install Stripe CLI
scoop install stripe

# OR download from: https://github.com/stripe/stripe-cli/releases/latest
# Extract to a folder and add to PATH
```

### Verify Installation
```powershell
stripe --version
```

## Step 2: Login to Stripe

```powershell
# Login to your Stripe account
stripe login

# This will:
# 1. Open browser for authentication
# 2. Link CLI to your Stripe account
# 3. Store API keys locally
```

## Step 3: Forward Webhooks to Local Development

### Option A: Forward to Local Server (Development)
```powershell
# Forward webhooks to local development server
stripe listen --forward-to http://localhost:5000/api/webhooks/stripe

# This will output a webhook signing secret like:
# > Ready! Your webhook signing secret is whsec_xxxxx
# Copy this secret and update your .env file
```

### Option B: Forward to Production Server (Testing)
```powershell
# Forward webhooks to production server
stripe listen --forward-to https://hostelhive.work.gd/api/webhooks/stripe

# Use the webhook secret from Stripe Dashboard instead
```

## Step 4: Trigger Test Events

### Test Checkout Completion
```powershell
# Trigger a successful checkout session
stripe trigger checkout.session.completed
```

### Test Subscription Events
```powershell
# Trigger subscription created
stripe trigger customer.subscription.created

# Trigger subscription updated
stripe trigger customer.subscription.updated

# Trigger invoice paid
stripe trigger invoice.paid
```

### Test Payment Events
```powershell
# Trigger payment intent succeeded
stripe trigger payment_intent.succeeded

# Trigger payment intent failed
stripe trigger payment_intent.payment_failed
```

## Step 5: Monitor Webhook Events

### Watch PM2 Logs (Production)
```powershell
# If you have SSH access to production server
ssh root@hostelhive.work.gd "pm2 logs hostelhive-api --lines 50"
```

### Watch Local Logs (Development)
```powershell
# In another terminal, watch your local server logs
npm run dev
# or
node server.js
```

## Step 6: Create Test Checkout Session

### Using Frontend
1. Go to: https://hostelhive-khaki.vercel.app/dashboard/hostels/{hostelId}/billing
2. Click "Upgrade to Basic" or "Upgrade to Pro"
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. ZIP: Any 5 digits

### Using API (Direct)
```powershell
# Create checkout session via API
$headers = @{
    "Authorization" = "Bearer YOUR_AUTH_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    priceId = "price_xxxxx"  # Your Stripe Price ID
    planId = "basic"
    isTrial = $false
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "https://hostelhive.work.gd/api/billing/create-checkout-session" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

## Step 7: Verify Quota Updates

### Check Database
```sql
SELECT 
    id,
    name,
    plan_id,
    subscription_status,
    isPaid,
    stripe_subscription_id,
    current_period_start,
    current_period_end
FROM Hostels
WHERE id = 'YOUR_HOSTEL_ID';
```

### Check Frontend
1. Hard refresh: Ctrl+Shift+R
2. Go to Billing page
3. Verify subscription status shows correct plan
4. Try creating resources (students, rooms)
5. Quotas should match plan limits

## Expected Webhook Flow

### 1. Checkout Completed
```
🎯 Processing webhook: checkout.session.completed evt_xxxxx
💳 Checkout completed: cs_xxxxx
  customer: cus_xxxxx
  subscription: sub_xxxxx
  paymentStatus: paid
✅ Found hostel:
  hostelId: xxx-xxx-xxx
  hostelName: Test Hostel
  currentPlanId: null
📦 Retrieved subscription:
  id: sub_xxxxx
  status: active
  metadata: { plan_id: 'basic' }
🔍 Plan ID extraction:
  fromSubMetadata: basic
  normalizedPlanId: basic
📝 Updating hostel: xxx-xxx-xxx
✅ Hostel updated successfully:
  oldPlanId: null
  newPlanId: basic
  subscriptionStatus: active
  isPaid: true
```

### 2. Subscription Created/Updated
```
🎯 Processing webhook: customer.subscription.created evt_xxxxx
🔄 Subscription event: sub_xxxxx
✅ Hostel updated successfully
```

## Troubleshooting

### Issue: "stripe: command not found"
**Solution:** Install Stripe CLI or add to PATH

### Issue: "No webhook signing secret"
**Solution:** 
1. Get secret from Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Or use `stripe listen` output
3. Update server `.env` with correct secret
4. Restart server: `pm2 restart hostelhive-api`

### Issue: "Webhook signature verification failed"
**Solution:**
- Webhook secret in `.env` must match Stripe Dashboard
- When using `stripe listen`, use the secret it outputs
- Production webhooks use dashboard secret

### Issue: "No hostel found for customer"
**Solution:**
- Customer must exist in Stripe first
- Complete a checkout session to create customer
- Customer ID stored in hostel's `stripe_customer_id` field

### Issue: plan_id is null after webhook
**Solutions:**
1. Add metadata to Stripe Price in dashboard:
   - Key: `plan_id`
   - Value: `basic` or `pro`
2. Or add metadata to subscription in checkout:
   ```javascript
   subscription_data: {
     metadata: { plan_id: 'basic' }
   }
   ```

## Test Stripe Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
3D Secure: 4000 0025 0000 3155
```

## Complete Test Workflow

```powershell
# 1. Start webhook forwarding
stripe listen --forward-to https://hostelhive.work.gd/api/webhooks/stripe

# 2. In another terminal, trigger test event
stripe trigger checkout.session.completed

# 3. Watch the webhook logs
# You should see the webhook processing logs

# 4. Verify database
# Check hostel record updated

# 5. Test in frontend
# Refresh billing page and verify quota updates
```

## Production Webhook Testing

### Send Real Test Webhook from Dashboard
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Edit payload if needed (add customer ID)
6. Click "Send test webhook"
7. Check response status (should be 200 OK)

### Monitor Live Events
1. Go to: https://dashboard.stripe.com/test/events
2. See all events in real-time
3. Click on any event to see details
4. Check webhook delivery status

## Next Steps

1. ✅ Install Stripe CLI
2. ✅ Login: `stripe login`
3. ✅ Forward webhooks: `stripe listen --forward-to https://hostelhive.work.gd/api/webhooks/stripe`
4. ✅ Trigger test: `stripe trigger checkout.session.completed`
5. ✅ Verify logs show webhook processing
6. ✅ Check database for updated plan_id
7. ✅ Test quota enforcement in frontend
