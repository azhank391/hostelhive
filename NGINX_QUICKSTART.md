# Quick Start: Nginx + HTTPS Setup

## 🚀 Fast Track (5 Minutes)

### Prerequisites
- ✅ Domain pointing to EC2: `api.hostelhive.com` → `13.49.228.84`
- ✅ Ports 80 & 443 open in Security Group
- ✅ Port 5000 closed (will be proxied internally)

### Run Setup

```bash
# 1. SSH to EC2
ssh -i hostelhive-ec2-key.pem ec2-user@13.49.228.84

# 2. Download and run setup script
curl -o setup-nginx.sh https://raw.githubusercontent.com/azhank391/hostelhive/main/server/scripts/setup-nginx.sh
chmod +x setup-nginx.sh
sudo bash setup-nginx.sh

# Enter when prompted:
# - Domain: api.hostelhive.com
# - Email: your-email@example.com
```

### Test

```bash
curl https://api.hostelhive.com/health
```

### Update Frontend

**Vercel Environment Variable:**
```
NEXT_PUBLIC_API_URL=https://api.hostelhive.com
```

---

## 📋 EC2 Security Group Rules

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | Your IP | Admin access |
| HTTP | 80 | 0.0.0.0/0 | SSL validation |
| HTTPS | 443 | 0.0.0.0/0 | API access |
| Custom | 5000 | ❌ REMOVE | Not needed |

---

## 🔧 Useful Commands

```bash
# Check Nginx status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/hostelhive-error.log

# Test config
sudo nginx -t

# Reload after changes
sudo systemctl reload nginx

# Check SSL certificate
sudo certbot certificates

# Manual renewal
sudo certbot renew

# Check if backend is running
pm2 list
pm2 logs hostelhive-server
```

---

## 🎯 What Happens After Setup

**Before:**
```
Frontend → http://13.49.228.84:5000 (Insecure, no SSL)
```

**After:**
```
Frontend → https://api.hostelhive.com (Secure, SSL ✅)
           ↓ (Nginx reverse proxy)
           http://localhost:5000 (Internal only)
```

---

## ⚠️ Troubleshooting

### SSL Certificate Failed?
```bash
# Check DNS
nslookup api.hostelhive.com

# Should return: 13.49.228.84
```

### 502 Bad Gateway?
```bash
# Check if backend is running
pm2 list
pm2 restart hostelhive-server
```

### 403 Forbidden (Amazon Linux)?
```bash
# Allow Nginx proxy connections
sudo setsebool -P httpd_can_network_connect 1
```

---

## 📝 Don't Have a Domain Yet?

### Quick Options:

**1. Use Freenom (Free)**
- Go to: https://www.freenom.com
- Get a free domain: `hostelhive.tk` (or .ml, .ga, .cf, .gq)
- Add A record: `13.49.228.84`

**2. Buy on Namecheap (~$9/year)**
- Go to: https://www.namecheap.com
- Search: `hostelhive.com`
- After purchase, add A record in DNS settings

**3. Use AWS Route 53 ($12/year)**
```bash
# In AWS Console
# Route 53 → Register Domain → hostelhive.com
# Then create A record pointing to EC2 IP
```

---

## ✅ Verification Checklist

- [ ] Domain DNS configured (A record → 13.49.228.84)
- [ ] DNS propagated (test with `nslookup`)
- [ ] Security Group: Port 80 & 443 open
- [ ] Nginx installed and running
- [ ] SSL certificate obtained
- [ ] HTTPS working: `curl https://api.hostelhive.com/health`
- [ ] Frontend .env updated: `NEXT_PUBLIC_API_URL=https://api.hostelhive.com`
- [ ] Frontend redeployed on Vercel

---

## 🎉 Success Indicators

```bash
# This should work:
curl https://api.hostelhive.com/health

# Response:
HTTP/2 200
{"message":"HostelHive API is running"}
```

---

## 📚 Full Documentation

See `NGINX_HTTPS_SETUP.md` for:
- Detailed manual setup steps
- Advanced configuration
- Security best practices
- Complete troubleshooting guide

