#!/bin/bash
# Setup Nginx Reverse Proxy with SSL for HostelHive Backend
# Run this script on your EC2 instance

set -e

echo "🔧 HostelHive Nginx + SSL Setup Script"
echo "========================================"

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then 
   echo "❌ Please run with sudo: sudo bash setup-nginx.sh"
   exit 1
fi

# Get domain name from user
read -p "Enter your domain name (e.g., api.hostelhive.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Domain name is required!"
    exit 1
fi

read -p "Enter your email for SSL certificate (for Let's Encrypt): " EMAIL

if [ -z "$EMAIL" ]; then
    echo "❌ Email is required for SSL certificate!"
    exit 1
fi

echo ""
echo "📋 Configuration Summary:"
echo "  Domain: $DOMAIN_NAME"
echo "  Email: $EMAIL"
echo "  Backend: http://localhost:5000"
echo ""
read -p "Continue with setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "📦 Step 1: Installing Nginx..."
if command -v dnf &> /dev/null; then
    # Amazon Linux 2023
    dnf install -y nginx
elif command -v yum &> /dev/null; then
    # Amazon Linux 2 or CentOS
    amazon-linux-extras install -y nginx1 || yum install -y nginx
else
    # Ubuntu/Debian
    apt-get update
    apt-get install -y nginx
fi

echo "✅ Nginx installed"

echo ""
echo "📦 Step 2: Installing Certbot (Let's Encrypt client)..."
if command -v dnf &> /dev/null; then
    dnf install -y certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
    yum install -y certbot python3-certbot-nginx || amazon-linux-extras install -y epel && yum install -y certbot python3-certbot-nginx
else
    apt-get install -y certbot python3-certbot-nginx
fi

echo "✅ Certbot installed"

echo ""
echo "📝 Step 3: Creating Nginx configuration..."

# Create Nginx config for the backend
cat > /etc/nginx/conf.d/hostelhive-backend.conf << 'NGINX_EOF'
# HTTP server - redirects to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server - reverse proxy to Node.js backend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # SSL certificates (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/hostelhive-access.log;
    error_log /var/log/nginx/hostelhive-error.log;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disable cache for API responses
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (optional - can be accessed without auth)
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
NGINX_EOF

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" /etc/nginx/conf.d/hostelhive-backend.conf

echo "✅ Nginx configuration created"

echo ""
echo "🔍 Step 4: Testing Nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

echo "✅ Nginx configuration is valid"

echo ""
echo "🚀 Step 5: Starting Nginx..."
systemctl enable nginx
systemctl restart nginx

echo "✅ Nginx started and enabled"

echo ""
echo "🔐 Step 6: Obtaining SSL certificate from Let's Encrypt..."
echo "This may take a minute..."

# Stop nginx temporarily to allow certbot standalone mode
systemctl stop nginx

# Get SSL certificate
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN_NAME"

if [ $? -ne 0 ]; then
    echo "❌ Failed to obtain SSL certificate!"
    echo "Please check:"
    echo "  1. Domain DNS is pointing to this server's IP"
    echo "  2. Port 80 is open in security group"
    echo "  3. Domain name is correct"
    systemctl start nginx
    exit 1
fi

echo "✅ SSL certificate obtained"

# Update nginx config to use SSL
sed -i "s|# ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;|ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;|g" /etc/nginx/conf.d/hostelhive-backend.conf
sed -i "s|# ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;|ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;|g" /etc/nginx/conf.d/hostelhive-backend.conf

echo ""
echo "🔄 Step 7: Restarting Nginx with SSL..."
systemctl start nginx
systemctl reload nginx

echo "✅ Nginx restarted with SSL"

echo ""
echo "📅 Step 8: Setting up auto-renewal for SSL certificate..."
# Test renewal
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✅ Auto-renewal configured successfully"
    
    # Add cron job for auto-renewal (if not already present)
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    echo "✅ Cron job added for certificate renewal"
fi

echo ""
echo "🎉 Setup Complete!"
echo "===================="
echo ""
echo "✅ Your backend is now available at:"
echo "   https://$DOMAIN_NAME"
echo ""
echo "🔒 SSL Certificate: Valid"
echo "🔄 Auto-renewal: Configured"
echo ""
echo "📝 Next Steps:"
echo "1. Test your API: curl https://$DOMAIN_NAME/health"
echo "2. Update your frontend .env with: NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME"
echo "3. Redeploy your frontend to Vercel"
echo ""
echo "🔧 Useful Commands:"
echo "  Check Nginx status: systemctl status nginx"
echo "  View Nginx logs: tail -f /var/log/nginx/hostelhive-error.log"
echo "  Test SSL: curl -v https://$DOMAIN_NAME/health"
echo "  Renew certificate: certbot renew"
echo ""
