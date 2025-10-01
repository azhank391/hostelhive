# Stripe Webhook Testing Script
# Run this to test Stripe webhooks end-to-end

Write-Host "=== Stripe Webhook Testing Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is installed
Write-Host "1. Checking Stripe CLI installation..." -ForegroundColor Yellow
try {
    $stripeVersion = stripe --version 2>&1
    Write-Host "✅ Stripe CLI installed: $stripeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Stripe CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   Download from: https://github.com/stripe/stripe-cli/releases/latest" -ForegroundColor Yellow
    Write-Host "   Or use: scoop install stripe" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Choose test mode:" -ForegroundColor Yellow
Write-Host "   [1] Test with local server (http://localhost:5000)"
Write-Host "   [2] Test with production server (https://hostelhive.work.gd)"
$mode = Read-Host "Enter choice (1 or 2)"

$webhookUrl = if ($mode -eq "1") {
    "http://localhost:5000/api/webhooks/stripe"
} else {
    "https://hostelhive.work.gd/api/webhooks/stripe"
}

Write-Host ""
Write-Host "3. Testing webhook endpoint accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"test":"data"}' -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Message -like "*No stripe-signature*") {
        Write-Host "✅ Webhook endpoint is accessible and responding correctly" -ForegroundColor Green
    } else {
        Write-Host "❌ Webhook endpoint error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "4. Available test events:" -ForegroundColor Yellow
Write-Host "   [1] checkout.session.completed (recommended)"
Write-Host "   [2] customer.subscription.created"
Write-Host "   [3] customer.subscription.updated"
Write-Host "   [4] invoice.paid"
Write-Host "   [5] payment_intent.succeeded"
Write-Host "   [6] All of the above"
$eventChoice = Read-Host "Select event to trigger (1-6)"

$events = @{
    "1" = @("checkout.session.completed")
    "2" = @("customer.subscription.created")
    "3" = @("customer.subscription.updated")
    "4" = @("invoice.paid")
    "5" = @("payment_intent.succeeded")
    "6" = @("checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "invoice.paid")
}

$selectedEvents = $events[$eventChoice]

Write-Host ""
Write-Host "=== Starting Stripe Webhook Tests ===" -ForegroundColor Cyan
Write-Host ""

# Option to forward webhooks
Write-Host "Do you want to forward webhooks using Stripe CLI? (y/n)" -ForegroundColor Yellow
Write-Host "Note: This is needed if testing with local server or if you want to capture live events" -ForegroundColor Gray
$forward = Read-Host

if ($forward -eq "y") {
    Write-Host ""
    Write-Host "Starting webhook forwarding to: $webhookUrl" -ForegroundColor Yellow
    Write-Host "This will run in the background. Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    Write-Host "IMPORTANT: Copy the webhook signing secret (whsec_...) and update your .env file" -ForegroundColor Red
    Write-Host ""
    
    # Start forwarding in background
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "stripe listen --forward-to $webhookUrl"
    
    Write-Host "Waiting 5 seconds for forwarding to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Triggering test events..." -ForegroundColor Yellow
Write-Host ""

foreach ($event in $selectedEvents) {
    Write-Host "🎯 Triggering: $event" -ForegroundColor Cyan
    
    try {
        $output = stripe trigger $event 2>&1
        Write-Host $output -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Error triggering $event : $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check webhook logs for processing messages"
Write-Host "   - PM2 logs: ssh root@hostelhive.work.gd 'pm2 logs hostelhive-api --lines 50'"
Write-Host "   - Local logs: Check your terminal running the server"
Write-Host ""
Write-Host "2. Verify database updates:"
Write-Host "   - Check Hostels table for plan_id, subscription_status, isPaid fields"
Write-Host ""
Write-Host "3. Test in frontend:"
Write-Host "   - Go to Billing page"
Write-Host "   - Hard refresh (Ctrl+Shift+R)"
Write-Host "   - Verify subscription status and quotas"
Write-Host ""
Write-Host "4. Check Stripe Dashboard:"
Write-Host "   - https://dashboard.stripe.com/test/events"
Write-Host "   - https://dashboard.stripe.com/test/webhooks"
Write-Host ""

# Offer to open Stripe Dashboard
Write-Host "Open Stripe Dashboard? (y/n)" -ForegroundColor Yellow
$openDashboard = Read-Host

if ($openDashboard -eq "y") {
    Start-Process "https://dashboard.stripe.com/test/events"
    Start-Process "https://dashboard.stripe.com/test/webhooks"
}

Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green
