# Nginx Reverse Proxy + HTTPS Setup Guide

## Overview

This guide will help you set up Nginx as a reverse proxy with HTTPS/SSL for your HostelHive backend on EC2.

**Benefits:**
- ✅ Secure HTTPS connection
- ✅ Free SSL certificates (Let's Encrypt)
- ✅ Auto-renewal of certificates
- ✅ Better performance & security
- ✅ Professional setup

---

## Prerequisites

### 1. Domain Name (Required)

You need a domain or subdomain pointing to your EC2 instance. Options:

**Option A: Use a Subdomain (Recommended)**
- If you have `hostelhive.com`, create subdomain: `api.hostelhive.com`
- Point it to EC2 IP: `13.49.228.84`

**Option B: Get a Free Domain**
- [Freenom](https://www.freenom.com) - Free domains (.tk, .ml, .ga, .cf, .gq)
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) - Cheap domains at cost

**Option C: Buy a Domain**
- [Namecheap](https://www.namecheap.com) - $8-12/year
- [Google Domains](https://domains.google) - $12/year
- [AWS Route 53](https://aws.amazon.com/route53/) - $12/year

### 2. DNS Configuration

Once you have a domain, create an **A Record**:

```
Type: A
Name: api (or @ for root domain)
Value: 13.49.228.84
TTL: 300 (5 minutes)
```

**Wait 5-10 minutes** for DNS propagation, then verify:

```bash
# On your local machine
nslookup api.hostelhive.com
# Should show: 13.49.228.84
```

### 3. EC2 Security Group

Open these ports in your EC2 Security Group:

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 22   | TCP      | Your IP | SSH access |
| 80   | TCP      | 0.0.0.0/0 | HTTP (for SSL cert validation) |
| 443  | TCP      | 0.0.0.0/0 | HTTPS (your API) |

**Close port 5000** - No longer needed (Nginx will proxy to it internally)

---

## Installation Steps

### Step 1: Upload Setup Script to EC2

From your local machine:

```powershell
# Copy the setup script to EC2
scp -i hostelhive-ec2-key.pem server/scripts/setup-nginx.sh ec2-user@13.49.228.84:~/
```

### Step 2: SSH into EC2

```powershell
ssh -i hostelhive-ec2-key.pem ec2-user@13.49.228.84
```

### Step 3: Run the Setup Script

```bash
# Make script executable
chmod +x setup-nginx.sh

# Run with sudo
sudo bash setup-nginx.sh
```

**The script will prompt you for:**
1. Domain name (e.g., `api.hostelhive.com`)
2. Email address (for SSL certificate notifications)

**The script will automatically:**
- ✅ Install Nginx
- ✅ Install Certbot (Let's Encrypt client)
- ✅ Create Nginx configuration
- ✅ Obtain SSL certificate
- ✅ Configure HTTPS
- ✅ Set up auto-renewal

### Step 4: Verify Installation

```bash
# Test HTTPS endpoint
curl -v https://api.hostelhive.com/health

# Should return:
# {"message":"HostelHive API is running"}
```

---

## Update Your Frontend

### Option 1: If Frontend is on Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add/Update:

```
NEXT_PUBLIC_API_URL=https://api.hostelhive.com
```

4. Redeploy your frontend

### Option 2: Local Development

Update `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.hostelhive.com
```

---

## Manual Setup (If Script Fails)

If the automatic script doesn't work, follow these manual steps:

### 1. Install Nginx

```bash
# Amazon Linux 2023
sudo dnf install -y nginx

# Amazon Linux 2
sudo amazon-linux-extras install -y nginx1

# Ubuntu
sudo apt update && sudo apt install -y nginx
```

### 2. Install Certbot

```bash
# Amazon Linux 2023
sudo dnf install -y certbot python3-certbot-nginx

# Amazon Linux 2
sudo yum install -y certbot python3-certbot-nginx

# Ubuntu
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Create Nginx Configuration

```bash
sudo nano /etc/nginx/conf.d/hostelhive.conf
```

Paste this configuration (replace `api.hostelhive.com` with your domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.hostelhive.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.hostelhive.com;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/api.hostelhive.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hostelhive.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logs
    access_log /var/log/nginx/hostelhive-access.log;
    error_log /var/log/nginx/hostelhive-error.log;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Test Configuration

```bash
sudo nginx -t
```

### 5. Obtain SSL Certificate

```bash
# Stop nginx
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  --agree-tos \
  --email your-email@example.com \
  -d api.hostelhive.com

# Start nginx
sudo systemctl start nginx
```

### 6. Enable and Start Nginx

```bash
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### 7. Set Up Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
```

---

## Testing Your Setup

### 1. Test HTTPS Connection

```bash
curl -v https://api.hostelhive.com/health
```

**Expected output:**
```
< HTTP/2 200
< content-type: application/json
...
{"message":"HostelHive API is running"}
```

### 2. Test SSL Certificate

```bash
# Check certificate expiry
echo | openssl s_client -servername api.hostelhive.com -connect api.hostelhive.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 3. Test from Frontend

Update your frontend code to use the new API URL and test a real API call.

---

## Troubleshooting

### Issue: SSL Certificate Failed

**Error:** `Failed to obtain SSL certificate`

**Solutions:**
1. Verify DNS is pointing to correct IP:
   ```bash
   nslookup api.hostelhive.com
   ```

2. Ensure port 80 is open in Security Group

3. Wait for DNS propagation (up to 24 hours, usually 5-10 minutes)

4. Try manual certificate request:
   ```bash
   sudo certbot certonly --standalone -d api.hostelhive.com
   ```

### Issue: 502 Bad Gateway

**Cause:** Backend not running or Nginx can't connect

**Solutions:**
```bash
# Check if backend is running
pm2 list

# Check backend logs
pm2 logs hostelhive-server

# Restart backend
pm2 restart hostelhive-server

# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000
```

### Issue: 403 Forbidden

**Cause:** SELinux blocking proxy connections (Amazon Linux)

**Solution:**
```bash
# Allow Nginx to make network connections
sudo setsebool -P httpd_can_network_connect 1
```

### Issue: Connection Timeout

**Solutions:**
1. Check Security Group - ensure port 443 is open
2. Check Nginx status: `sudo systemctl status nginx`
3. Check firewall: `sudo firewall-cmd --list-all` (if using firewalld)

---

## Maintenance

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/hostelhive-access.log

# Error logs
sudo tail -f /var/log/nginx/hostelhive-error.log
```

### Reload Nginx (after config changes)

```bash
sudo nginx -t  # Test config first
sudo systemctl reload nginx
```

### Manual Certificate Renewal

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Check Certificate Status

```bash
sudo certbot certificates
```

---

## Security Best Practices

### 1. Close Port 5000

Once Nginx is working, close port 5000 in your Security Group - it should only be accessible via localhost.

### 2. Enable Firewall (Optional)

```bash
# Amazon Linux
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. Regular Updates

```bash
# Update system packages
sudo dnf update -y  # Amazon Linux 2023
# or
sudo yum update -y  # Amazon Linux 2
```

### 4. Monitor SSL Expiry

Certificates auto-renew, but monitor them:
```bash
sudo certbot certificates
```

---

## Cost

- ✅ Nginx: **Free**
- ✅ Let's Encrypt SSL: **Free**
- ✅ Auto-renewal: **Free**
- ⚠️ Domain name: $8-12/year (or free with Freenom)

---

## Summary

After setup, your architecture will be:

```
Internet
   ↓ HTTPS (443)
Nginx (Reverse Proxy)
   ↓ HTTP (5000)
Node.js Backend (PM2)
   ↓
MySQL RDS
```

**Benefits:**
- Secure HTTPS connections
- Professional API endpoint
- Better performance
- Easy scaling
- Free SSL certificates

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Nginx error logs
3. Verify DNS and Security Group settings
4. Test backend health on localhost:5000 first

