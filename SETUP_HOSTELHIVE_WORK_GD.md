# HostelHive Backend HTTPS Setup
## Domain: hostelhive.work.gd

## 🎯 Current Status
- ✅ Domain acquired: `hostelhive.work.gd`
- ✅ EC2 instance running: `13.49.228.84`
- ✅ Backend running on port 5000
- ⚠️ DNS needs updating

---

## Step 1: Update DNS Settings

### Go to your work.gd DNS Management

1. Log in to your domain registrar (where you got hostelhive.work.gd)
2. Find **DNS Management** or **DNS Settings**
3. Look for existing A records

### Update/Create A Record

**Change this:**
```
Type: A
Name: @ (or hostelhive.work.gd)
Current Value: 154.192.136.4
```

**To this:**
```
Type: A
Name: @ (or hostelhive.work.gd)
New Value: 13.49.228.84
TTL: 300 (5 minutes)
```

### Wait for DNS Propagation (5-10 minutes)

**Verify from your PowerShell:**
```powershell
nslookup hostelhive.work.gd
# Should show: 13.49.228.84
```

**Or check online:**
- https://dnschecker.org/#A/hostelhive.work.gd

---

## Step 2: Update EC2 Security Group

### Required Ports:

| Type | Port | Protocol | Source | Description |
|------|------|----------|--------|-------------|
| SSH | 22 | TCP | Your IP | Admin access |
| HTTP | 80 | TCP | 0.0.0.0/0 | SSL certificate validation |
| HTTPS | 443 | TCP | 0.0.0.0/0 | Your API (HTTPS) |
| ~~Custom~~ | ~~5000~~ | ~~TCP~~ | ~~REMOVE~~ | ~~No longer needed~~ |

### How to Update:

1. Go to **AWS Console** → **EC2** → **Security Groups**
2. Select your instance's security group
3. Click **Edit inbound rules**
4. **Add Rule:** Port 80, Source: 0.0.0.0/0
5. **Add Rule:** Port 443, Source: 0.0.0.0/0
6. **Remove:** Port 5000 (if present)
7. Click **Save rules**

---

## Step 3: Upload Setup Script to EC2

### From PowerShell (Local Machine):

```powershell
# Navigate to your project
cd "d:\web dev\hostelhive"

# Copy script to EC2
scp -i hostelhive-ec2-key.pem server/scripts/setup-nginx.sh ec2-user@13.49.228.84:~/setup-nginx.sh
```

---

## Step 4: Run Setup on EC2

### SSH into EC2:

```powershell
ssh -i hostelhive-ec2-key.pem ec2-user@13.49.228.84
```

### Run the Setup Script:

```bash
# Make executable
chmod +x setup-nginx.sh

# Run with sudo
sudo bash setup-nginx.sh
```

### You'll be prompted for:

```
Enter your domain name: hostelhive.work.gd
Enter your email for SSL certificate: your-email@example.com
```

**The script will automatically:**
- ✅ Install Nginx
- ✅ Install Certbot (Let's Encrypt)
- ✅ Create Nginx reverse proxy config
- ✅ Obtain FREE SSL certificate
- ✅ Configure HTTPS (port 443)
- ✅ Set up HTTP → HTTPS redirect
- ✅ Configure auto-renewal

**Time: ~3-5 minutes**

---

## Step 5: Verify HTTPS is Working

### Test from EC2 (while SSH'd):

```bash
curl -v https://hostelhive.work.gd/health
```

**Expected output:**
```
< HTTP/2 200
< content-type: application/json
...
{"message":"HostelHive API is running"}
```

### Test from your Local Machine:

```powershell
curl https://hostelhive.work.gd/health
```

### Test in Browser:

Open: https://hostelhive.work.gd/health

You should see:
```json
{"message":"HostelHive API is running"}
```

**Check SSL Certificate:**
- Click the padlock icon in browser
- Should show: "Issued by: Let's Encrypt"
- Valid for 90 days (auto-renews)

---

## Step 6: Update Frontend Configuration

### Update Vercel Environment Variables:

1. Go to: https://vercel.com/azhank391/hostelhive
2. Settings → Environment Variables
3. Add or update:

```
NEXT_PUBLIC_API_URL=https://hostelhive.work.gd
```

4. **Redeploy** your frontend

### Update Local Development (Optional):

**File:** `client/.env.local`
```env
NEXT_PUBLIC_API_URL=https://hostelhive.work.gd
```

---

## Step 7: Update Backend CORS (Important!)

Your backend needs to allow requests from your Vercel frontend.

### SSH to EC2 and edit server.js:

```bash
cd /var/www/hostelhive/server
nano server.js
```

### Update CORS configuration:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',  // Local dev
    'https://hostelhive-khaki.vercel.app',  // Vercel frontend
    'https://hostelhive.work.gd'  // Your backend domain (for testing)
  ],
  credentials: true
}));
```

### Restart backend:

```bash
pm2 restart hostelhive-server
```

---

## 🎉 Final Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Vercel)                  │
│  hostelhive-khaki.vercel.app        │
└────────────┬────────────────────────┘
             │
             │ HTTPS Request
             │
             ▼
┌─────────────────────────────────────┐
│  Domain: hostelhive.work.gd         │
│  DNS → 13.49.228.84                 │
└────────────┬────────────────────────┘
             │
             │ Port 443 (HTTPS)
             │
             ▼
┌─────────────────────────────────────┐
│  EC2 Instance (13.49.228.84)        │
│  ┌───────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)        │  │
│  │  - SSL Termination            │  │
│  │  - HTTPS → HTTP               │  │
│  └──────────┬────────────────────┘  │
│             │                        │
│             │ Port 5000 (localhost)  │
│             ▼                        │
│  ┌───────────────────────────────┐  │
│  │  Node.js Backend (PM2)        │  │
│  │  Express API                  │  │
│  └──────────┬────────────────────┘  │
│             │                        │
└─────────────┼────────────────────────┘
              │
              │ MySQL Connection
              ▼
┌─────────────────────────────────────┐
│  AWS RDS (MySQL)                    │
│  hostelhive-rds.xxx.rds.amazonaws   │
└─────────────────────────────────────┘
```

---

## ✅ Verification Checklist

- [ ] DNS updated: hostelhive.work.gd → 13.49.228.84
- [ ] DNS propagated (verified with nslookup)
- [ ] Security Group: Port 80 & 443 open, Port 5000 closed
- [ ] Setup script uploaded to EC2
- [ ] Nginx + SSL installed (script ran successfully)
- [ ] HTTPS working: `curl https://hostelhive.work.gd/health`
- [ ] SSL certificate valid (check in browser)
- [ ] Backend CORS updated
- [ ] Frontend env var updated: `NEXT_PUBLIC_API_URL=https://hostelhive.work.gd`
- [ ] Frontend redeployed on Vercel
- [ ] End-to-end test: Frontend → Backend → Database

---

## 🔧 Useful Commands

### On EC2:

```bash
# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/hostelhive-error.log
sudo tail -f /var/log/nginx/hostelhive-access.log

# Check SSL certificate
sudo certbot certificates

# Manually renew certificate
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx

# Check backend status
pm2 list
pm2 logs hostelhive-server

# Restart backend
pm2 restart hostelhive-server
```

### From Local Machine:

```powershell
# Test API health
curl https://hostelhive.work.gd/health

# Test with verbose output
curl -v https://hostelhive.work.gd/health

# Check DNS
nslookup hostelhive.work.gd
```

---

## 🐛 Troubleshooting

### DNS not updated?

**Check current DNS:**
```powershell
nslookup hostelhive.work.gd
```

**If still showing 154.192.136.4:**
- Wait 5-10 more minutes
- Clear DNS cache: `ipconfig /flushdns`
- Check online: https://dnschecker.org/#A/hostelhive.work.gd

### SSL Certificate Failed?

**Error:** "Failed to obtain SSL certificate"

**Solutions:**
1. Verify DNS is correct: `nslookup hostelhive.work.gd` → should show 13.49.228.84
2. Ensure port 80 is open in Security Group
3. Wait for DNS to fully propagate (up to 24h, usually 10 mins)
4. Try manual certificate:
   ```bash
   sudo systemctl stop nginx
   sudo certbot certonly --standalone -d hostelhive.work.gd --email your-email@example.com
   sudo systemctl start nginx
   ```

### 502 Bad Gateway?

**Cause:** Backend not running

**Fix:**
```bash
pm2 list
pm2 restart hostelhive-server
pm2 logs hostelhive-server
```

### CORS Error from Frontend?

**Error:** "Access to fetch at 'https://hostelhive.work.gd' from origin 'https://hostelhive-khaki.vercel.app' has been blocked by CORS policy"

**Fix:** Update CORS in backend (see Step 7 above)

### 403 Forbidden (Amazon Linux)?

```bash
# Allow Nginx to proxy
sudo setsebool -P httpd_can_network_connect 1
```

---

## 📝 After Setup - Update Documentation

### Files to Update:

**Backend `.env` (on EC2):**
```env
FRONTEND_URL=https://hostelhive-khaki.vercel.app
```

**Frontend `.env` (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://hostelhive.work.gd
```

**README.md:**
Update with your new API URL

---

## 🎊 Success Indicators

### ✅ All Green:

```bash
# From anywhere in the world:
curl https://hostelhive.work.gd/health
# Response: {"message":"HostelHive API is running"}

# SSL valid:
# Open https://hostelhive.work.gd/health in browser
# Should show padlock icon 🔒

# Frontend connects:
# Open https://hostelhive-khaki.vercel.app
# Should load without CORS errors
```

---

## 💰 Total Cost

- ✅ Domain (work.gd): **FREE**
- ✅ SSL Certificate (Let's Encrypt): **FREE**
- ✅ Nginx: **FREE**
- ✅ Auto-renewal: **FREE**
- ✅ EC2 t3.micro: **~$8-10/month** (part of AWS Free Tier if eligible)
- ✅ RDS: **~$15-20/month** (or free tier)

**Total Setup Cost: $0**
**Monthly: ~$23-30** (or less with free tier)

---

## 📚 Next Steps After Setup

1. **Monitor SSL expiry** (auto-renews, but good to check)
2. **Set up CloudWatch** for EC2 monitoring
3. **Configure automated backups** for RDS
4. **Set up error tracking** (e.g., Sentry)
5. **Add API rate limiting** (if not already done)
6. **Set up uptime monitoring** (e.g., UptimeRobot - free)

---

## 🆘 Need Help?

- **Quick reference:** See `NGINX_QUICKSTART.md`
- **Full guide:** See `NGINX_HTTPS_SETUP.md`
- **DNS help:** https://dnschecker.org
- **SSL test:** https://www.ssllabs.com/ssltest/

