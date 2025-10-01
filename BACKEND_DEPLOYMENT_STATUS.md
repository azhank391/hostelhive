# Backend Deployment Verification

## ✅ Current Setup Status

### Backend (EC2)
- **URL:** http://13.49.228.84:5000
- **Status:** ✅ Running
- **Health Check:** http://13.49.228.84:5000/health
- **Database:** ✅ Connected (hostelhive on RDS)
- **All Migrations:** ✅ Complete (51 migrations)

### Frontend (Vercel)
- **URL:** https://hostelhive-khaki.vercel.app
- **Backend URL:** http://13.49.228.84:5000 (to be configured)
- **Status:** ⏳ Needs redeployment after env update

---

## 📋 Configuration Steps

### 1. Vercel Environment Variable ✅

Add in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=http://13.49.228.84:5000
```

**Steps:**
1. Go to: https://vercel.com/azhank391/hostelhive
2. Settings → Environment Variables
3. Add new variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `http://13.49.228.84:5000`
   - Environment: Production, Preview, Development (select all)
4. Click Save
5. Go to Deployments → Redeploy latest

### 2. Local Development (Optional) ✅

File created: `client/.env.local`
```env
NEXT_PUBLIC_API_URL=http://13.49.228.84:5000
```

---

## 🧪 Testing the Complete Flow

### Test 1: Backend Health

```powershell
curl http://13.49.228.84:5000/health
```

**Expected:**
```json
{"message":"HostelHive API is running"}
```

### Test 2: Backend API Endpoint

```powershell
# Test a real API endpoint (replace with your actual endpoint)
curl http://13.49.228.84:5000/api/hostels
```

### Test 3: Frontend → Backend Connection

After redeploying on Vercel:

1. Open: https://hostelhive-khaki.vercel.app
2. Open Browser DevTools (F12) → Network tab
3. Interact with the app (login, view data, etc.)
4. Check Network requests - should see calls to `http://13.49.228.84:5000`
5. Verify no CORS errors in Console

### Test 4: CORS Verification

The backend should allow requests from your Vercel frontend. Check `server/server.js` for CORS config:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://hostelhive-khaki.vercel.app'
  ],
  credentials: true
}));
```

---

## 🔧 Backend Endpoints to Test

Replace with your actual endpoints:

```powershell
# Health
curl http://13.49.228.84:5000/health

# Auth endpoints
curl -X POST http://13.49.228.84:5000/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"test@example.com\",\"password\":\"password\"}'

# Hostels
curl http://13.49.228.84:5000/api/hostels

# Students
curl http://13.49.228.84:5000/api/students

# Rooms
curl http://13.49.228.84:5000/api/rooms
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: CORS Error

**Error in browser console:**
```
Access to fetch at 'http://13.49.228.84:5000' from origin 'https://hostelhive-khaki.vercel.app' 
has been blocked by CORS policy
```

**Fix:** Update backend CORS configuration to include Vercel URL.

**SSH to EC2:**
```bash
ssh -i hostelhive-ec2-key.pem ec2-user@13.49.228.84
cd /var/www/hostelhive/server
nano server.js
```

**Update CORS:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://hostelhive-khaki.vercel.app'
  ],
  credentials: true
}));
```

**Restart backend:**
```bash
pm2 restart hostelhive-server
```

### Issue 2: 502 Bad Gateway

**Fix:**
```bash
pm2 list
pm2 restart hostelhive-server
pm2 logs hostelhive-server
```

### Issue 3: Connection Timeout

**Fix:** Ensure Security Group has port 5000 open:
- Type: Custom TCP
- Port: 5000
- Source: 0.0.0.0/0

### Issue 4: Frontend Not Using New URL

**Fix:**
1. Clear Vercel build cache
2. Redeploy
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for actual API URL being used

---

## 📊 Full Stack Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Vercel)                  │
│  https://hostelhive-khaki.vercel.app│
│  Next.js + React                    │
└────────────┬────────────────────────┘
             │
             │ HTTP Request
             │ NEXT_PUBLIC_API_URL
             │
             ▼
┌─────────────────────────────────────┐
│  Backend (EC2)                      │
│  http://13.49.228.84:5000           │
│  ┌───────────────────────────────┐  │
│  │  Express.js API (PM2)         │  │
│  │  - Auth, RBAC, Payments       │  │
│  │  - CORS enabled               │  │
│  └──────────┬────────────────────┘  │
│             │                        │
└─────────────┼────────────────────────┘
              │
              │ MySQL Connection
              │
              ▼
┌─────────────────────────────────────┐
│  Database (AWS RDS)                 │
│  hostelhive-rds.xxx.rds.amazonaws   │
│  MySQL 8.0                          │
│  - All 51 migrations applied        │
└─────────────────────────────────────┘
```

---

## ✅ Deployment Checklist

- [x] Backend running on EC2
- [x] Database connected to RDS
- [x] All migrations completed
- [x] Port 5000 accessible
- [x] Health endpoint responding
- [ ] Vercel env variable updated
- [ ] Frontend redeployed
- [ ] CORS configured for Vercel domain
- [ ] Frontend → Backend connection tested
- [ ] Login flow tested
- [ ] Database operations tested

---

## 🎯 Next Steps After Verification

Once everything works:

1. **Test all critical flows:**
   - User registration/login
   - Room allocation
   - Complaint creation
   - Visitor log
   - Billing/subscriptions

2. **Monitor for errors:**
   - Check PM2 logs: `pm2 logs hostelhive-server`
   - Check browser console
   - Check Vercel deployment logs

3. **Later: Add HTTPS (Nginx)**
   - Refer to `SETUP_HOSTELHIVE_WORK_GD.md`
   - Switch to: `https://hostelhive.work.gd`
   - Better security and performance

---

## 🆘 If Something Doesn't Work

1. **Check backend logs:**
   ```bash
   ssh -i hostelhive-ec2-key.pem ec2-user@13.49.228.84
   pm2 logs hostelhive-server --lines 100
   ```

2. **Check backend status:**
   ```bash
   pm2 list
   curl http://localhost:5000/health
   ```

3. **Check frontend logs:**
   - Vercel dashboard → Deployments → View Function Logs
   - Browser DevTools → Console tab

4. **Test individual components:**
   - Backend health: ✅ Working
   - Backend API: Test with curl
   - Frontend build: Check Vercel logs
   - Frontend runtime: Check browser console

---

## 📝 Environment Variables Summary

### Backend (EC2 - already configured)
```env
DB_NAME=hostelhive
DB_USER=admin
DB_PASSWORD=***
DB_HOST=hostelhive-rds.c7ykqckeqn6z.eu-north-1.rds.amazonaws.com
DB_DIALECT=mysql
DB_PORT=3306
JWT_SECRET=***
STRIPE_SECRET_KEY=***
FRONTEND_URL=https://hostelhive-khaki.vercel.app
NODE_ENV=production
PORT=5000
```

### Frontend (Vercel - TO ADD)
```env
NEXT_PUBLIC_API_URL=http://13.49.228.84:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_***
```

---

## 🎉 Success Indicators

✅ Backend health check returns 200
✅ Frontend deploys successfully on Vercel
✅ No CORS errors in browser console
✅ API requests show in Network tab
✅ Login/authentication works
✅ Data loads from database
✅ All CRUD operations work

---

**Current Status:** Backend ready, waiting for Vercel configuration ✅

