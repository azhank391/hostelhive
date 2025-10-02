# Quick script to update webhook secret on production server
# Usage: .\update-webhook-secret.ps1 "whsec_YOUR_NEW_SECRET"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewSecret
)

Write-Host "🔧 Updating webhook secret on production server..." -ForegroundColor Cyan
Write-Host ""

# SSH command to update .env and restart
$sshCommand = @"
cd /var/www/hostelhive/server && \
sed -i 's|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$NewSecret|' .env && \
echo '✅ Updated STRIPE_WEBHOOK_SECRET in .env' && \
pm2 restart hostelhive-api && \
echo '✅ Restarted hostelhive-api' && \
echo '' && \
echo '📋 Current webhook secret:' && \
grep STRIPE_WEBHOOK_SECRET .env
"@

Write-Host "Executing on server..." -ForegroundColor Yellow
ssh root@hostelhive.work.gd $sshCommand

Write-Host ""
Write-Host "✅ Done! Now test with: stripe trigger checkout.session.completed" -ForegroundColor Green
