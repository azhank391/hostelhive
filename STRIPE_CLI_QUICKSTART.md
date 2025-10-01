# Quick Stripe Testing Commands

## 1. Install Stripe CLI (First Time Only)
```powershell
# Option 1: Using Scoop
scoop install stripe

# Option 2: Manual download
# Download from: https://github.com/stripe/stripe-cli/releases/latest
# Extract and add to PATH
```

## 2. Login to Stripe
```powershell
stripe login
# Opens browser to authenticate with your Stripe account
```

## 3. Test Webhook (Production Server)
```powershell
# Trigger checkout completion event
stripe trigger checkout.session.completed

# Trigger subscription events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated

# Trigger invoice events
stripe trigger invoice.paid
```

## 4. Forward Webhooks (For Testing)
```powershell
# Forward to production server (recommended)
stripe listen --forward-to https://hostelhive.work.gd/api/webhooks/stripe

# IMPORTANT: Copy the webhook signing secret (whsec_...) from output
# Update server/.env with this secret
# Restart server: pm2 restart hostelhive-api
```

## 5. Test Complete Flow
```powershell
# Terminal 1: Start forwarding
stripe listen --forward-to https://hostelhive.work.gd/api/webhooks/stripe

# Terminal 2: Trigger test event
stripe trigger checkout.session.completed

# Watch for logs showing:
# ✅ Webhook received
# ✅ Hostel updated
# ✅ plan_id changed
```

## 6. Verify Results

### Check Logs
```powershell
# Production server logs (if you have SSH access)
ssh root@hostelhive.work.gd "pm2 logs hostelhive-api --lines 50 | grep -i webhook"
```

### Check Frontend
1. Go to: https://hostelhive-khaki.vercel.app/dashboard/hostels/{hostelId}/billing
2. Hard refresh: Ctrl+Shift+R
3. Check subscription status
4. Verify quotas updated

### Check Stripe Dashboard
- Events: https://dashboard.stripe.com/test/events
- Webhooks: https://dashboard.stripe.com/test/webhooks

## Expected Logs After Trigger

```
🎯 Processing webhook: checkout.session.completed evt_xxxxx
💳 Checkout completed: cs_xxxxx
✅ Found hostel: xxx-xxx-xxx
📦 Retrieved subscription: sub_xxxxx
🔍 Plan ID extraction:
  fromSubMetadata: basic
  normalizedPlanId: basic
📝 Updating hostel: xxx-xxx-xxx
✅ Hostel updated successfully:
  newPlanId: basic
  subscriptionStatus: active
  isPaid: true
```

## Common Issues

### "stripe: command not found"
→ Install Stripe CLI or add to PATH

### "Webhook signature verification failed"
→ Update STRIPE_WEBHOOK_SECRET in server/.env with the secret from `stripe listen` output
→ Restart server: `pm2 restart hostelhive-api`

### "No hostel found for customer"
→ Complete a real checkout first to create the Stripe customer
→ Use test card: 4242 4242 4242 4242

### plan_id is null after webhook
→ Add metadata to Stripe Price: `plan_id: basic` or `plan_id: pro`
→ Check webhook logs for plan ID extraction

## Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

## Run Automated Test Script
```powershell
# Navigate to project directory
cd "d:\web dev\hostelhive"

# Run test script
.\test-stripe-webhook.ps1

# Follow the prompts to test webhooks
```
