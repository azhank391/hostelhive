# Frontend Environment Variables - Correct Configuration

## ❌ Previous Error
```
POST http://localhost:5000/api/auth/register-owner net::ERR_CONNECTION_REFUSED
```

**Cause:** Frontend was using `localhost:5000` instead of EC2 backend

---

## ✅ Correct Configuration

### Vercel Environment Variables

Add this in Vercel dashboard (Settings → Environment Variables):

```
Name: NEXT_PUBLIC_API_BASE_URL
Value: http://13.49.228.84:5000/api
Environment: Production, Preview, Development (all selected)
```

⚠️ **Important:** 
- Variable name is `NEXT_PUBLIC_API_BASE_URL` (includes `/api` in value)
- NOT `NEXT_PUBLIC_API_URL`

### Local Development (.env.local)

File: `client/.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://13.49.228.84:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S9iIkDsk4ejV7WUtcySlJm4vKBSjNCtLqRAny5jaktuNCPvrP4ovoo8LVY5U5mji3O9ipO8yvERF9Dv6aLVI9kP00yMOlIEsX
```

---

## 📋 Steps to Fix

### 1. Update Vercel Environment Variable

1. Go to: https://vercel.com/azhank391/hostelhive
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `http://13.49.228.84:5000/api`
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**

### 2. Redeploy Frontend

- Go to **Deployments** tab
- Click on the latest deployment
- Click **Redeploy** button
- Wait for deployment to complete (~2-3 minutes)

### 3. Test Registration

After redeployment:
1. Go to: https://hostelhive-khaki.vercel.app
2. Try to register a new owner
3. Check browser console (F12) - should NOT see `localhost:5000` errors
4. Should see requests to: `http://13.49.228.84:5000/api/auth/register-owner`

---

## 🧪 Verification

### Check Network Requests

1. Open your app: https://hostelhive-khaki.vercel.app
2. Open DevTools (F12)
3. Go to **Network** tab
4. Try to register/login
5. Look for API calls - should show:
   ```
   ✅ http://13.49.228.84:5000/api/auth/register-owner
   ❌ NOT http://localhost:5000/...
   ```

### Check Console

Should NOT see:
```
❌ POST http://localhost:5000/api/auth/register-owner net::ERR_CONNECTION_REFUSED
```

Should see successful API calls or proper error messages from backend.

---

## 🔍 How the Config Works

**File:** `client/src/lib/config.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') 
                     || 'http://localhost:5000/api';
```

This means:
1. If `NEXT_PUBLIC_API_BASE_URL` is set → use it
2. Otherwise → fallback to `http://localhost:5000/api` (for local dev)

**For Production (Vercel):**
- Must set `NEXT_PUBLIC_API_BASE_URL=http://13.49.228.84:5000/api`

---

## ⚠️ Common Mistakes

### Mistake 1: Wrong Variable Name
```
❌ NEXT_PUBLIC_API_URL=http://13.49.228.84:5000
✅ NEXT_PUBLIC_API_BASE_URL=http://13.49.228.84:5000/api
```

### Mistake 2: Missing /api
```
❌ NEXT_PUBLIC_API_BASE_URL=http://13.49.228.84:5000
✅ NEXT_PUBLIC_API_BASE_URL=http://13.49.228.84:5000/api
```

### Mistake 3: Forgetting to Redeploy
- Vercel caches environment variables at build time
- Must redeploy after changing env vars

### Mistake 4: Browser Cache
- After redeployment, hard refresh: `Ctrl+Shift+R`
- Or clear browser cache

---

## 🐛 If Still Not Working

### Check 1: Verify Env Var in Vercel

1. Go to Vercel Settings → Environment Variables
2. Should see: `NEXT_PUBLIC_API_BASE_URL` with value `http://13.49.228.84:5000/api`
3. Should be enabled for all environments

### Check 2: Check Build Logs

1. Go to Deployments → Latest deployment
2. Click on deployment
3. Check **Build Logs**
4. Look for: `Using NEXT_PUBLIC_API_BASE_URL: ...`

### Check 3: Test Backend Directly

```powershell
# Test registration endpoint directly
curl -X POST http://13.49.228.84:5000/api/auth/register-owner `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test Owner\",\"email\":\"test@example.com\",\"password\":\"Test123!\"}'
```

### Check 4: CORS Configuration

If you see CORS errors instead, update backend CORS:

```bash
# SSH to EC2
ssh -i hostelhive-ec2-key.pem ec2-user@13.49.228.84

# Edit server.js
cd /var/www/hostelhive/server
nano server.js

# Update CORS to include Vercel domain
# Then restart:
pm2 restart hostelhive-server
```

---

## ✅ Success Indicators

After correct configuration:

1. ✅ No `localhost:5000` in Network tab
2. ✅ Requests go to `13.49.228.84:5000`
3. ✅ Registration form works
4. ✅ Login works
5. ✅ No ERR_CONNECTION_REFUSED errors

---

## 📝 Environment Variables Summary

### Complete List for Vercel:

```env
NEXT_PUBLIC_API_BASE_URL=http://13.49.228.84:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S9iIkDsk4ejV7WUtcySlJm4vKBSjNCtLqRAny5jaktuNCPvrP4ovoo8LVY5U5mji3O9ipO8yvERF9Dv6aLVI9kP00yMOlIEsX
```

### Complete List for Local (.env.local):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S9iIkDsk4ejV7WUtcySlJm4vKBSjNCtLqRAny5jaktuNCPvrP4ovoo8LVY5U5mji3O9ipO8yvERF9Dv6aLVI9kP00yMOlIEsX
```

(Use localhost for local dev, EC2 IP for production)

---

## 🎯 Next Steps

1. ✅ Add `NEXT_PUBLIC_API_BASE_URL` to Vercel
2. ✅ Redeploy frontend
3. ⏳ Test registration
4. ⏳ Test login
5. ⏳ Test all features end-to-end

