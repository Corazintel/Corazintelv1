# Admin Login Troubleshooting Guide

## 🚨 Quick Fix Steps

### Step 1: Check Your Environment Variables on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service** (Corazintelv1)
3. **Click "Environment" tab** on the left
4. **Verify these variables exist**:

```
✅ ADMIN_USER = Admin
✅ ADMIN_PASSWORD = 1125
✅ SESSION_SECRET = (some long random string)
```

**IMPORTANT**: 
- Variable names are CASE-SENSITIVE
- No extra spaces before or after the values
- Click "Save Changes" after adding/editing

### Step 2: Check Diagnostic Endpoint

Visit this URL in your browser:
```
https://your-app.onrender.com/admin/debug
```

You should see something like:
```json
{
  "adminUserSet": true,
  "adminUserValue": "Admin",
  "adminPasswordSet": true,
  "adminPasswordLength": 4,
  "sessionSecretSet": true,
  "sessionSecretLength": 44,
  "nodeEnv": "production",
  "port": "3000"
}
```

**What each field means**:
- `adminUserSet: true` ✅ = ADMIN_USER is configured
- `adminUserSet: false` ❌ = ADMIN_USER is missing
- `adminPasswordSet: true` ✅ = ADMIN_PASSWORD is configured
- `sessionSecretSet: true` ✅ = SESSION_SECRET is configured

### Step 3: Common Issues & Fixes

#### Issue A: All values show `false` or `NOT SET`

**Problem**: Environment variables aren't set on Render

**Fix**:
1. Go to Render → Environment tab
2. Add these EXACT variables (click "Add Environment Variable"):

```
Key: ADMIN_USER
Value: Admin

Key: ADMIN_PASSWORD  
Value: 1125

Key: SESSION_SECRET
Value: (generate with: openssl rand -base64 32)
```

3. Click **"Save Changes"**
4. Wait for service to restart (automatic)
5. Try logging in again

#### Issue B: `adminPasswordLength: 0`

**Problem**: ADMIN_PASSWORD is empty

**Fix**:
1. Render → Environment
2. Find ADMIN_PASSWORD
3. Set value to: `1125` (or your preferred password)
4. Save Changes

#### Issue C: `sessionSecretSet: false`

**Problem**: SESSION_SECRET is missing - this breaks sessions

**Fix**:
1. Generate a secret:
   ```bash
   openssl rand -base64 32
   ```
   Or use any long random string (32+ characters)

2. Add to Render:
   ```
   Key: SESSION_SECRET
   Value: <paste the generated secret>
   ```

3. Save Changes

#### Issue D: Login page just reloads, no error

**Problem**: Session not persisting (usually SESSION_SECRET issue)

**Fix**:
1. Check SESSION_SECRET is set (Step 2 above)
2. Clear your browser cookies for the site
3. Try again in an incognito/private window

#### Issue E: "Wrong login" error appears

**Problem**: Username or password doesn't match

**Fix**:
1. Check the diagnostic endpoint (`/admin/debug`)
2. Verify you're typing **exactly**:
   - Username: `Admin` (capital A)
   - Password: `1125` (or whatever you set)
3. Check for typos in environment variables

---

## 🔍 Detailed Debugging

### Test Locally First

1. **Make sure it works locally**:
   ```bash
   # In your terminal
   cd /Users/celina/Desktop/Corazintelv1
   node server.js
   ```

2. **Visit**: http://localhost:3000/admin/login

3. **Login with**:
   - Username: `Admin`
   - Password: `1125`

4. **If it works locally but not on Render** → Environment variable issue

### Check Render Logs

1. Go to Render Dashboard
2. Click "Logs" tab
3. Look for errors like:
   ```
   Error: session secret required
   ```
   or
   ```
   Cannot read property 'isAdmin' of undefined
   ```

### Verify Your `.env` File (Local Only)

Your local `.env` file should have:
```bash
ADMIN_USER=Admin
ADMIN_PASSWORD=1125
SESSION_SECRET=your_generated_secret_here
NODE_ENV=development
PORT=3000
```

**IMPORTANT**: `.env` file is NOT deployed to Render (it's in `.gitignore`). You must set environment variables in Render Dashboard.

---

## 📝 Step-by-Step: Setting Environment Variables on Render

### Option 1: Via Render Dashboard (Recommended)

1. **Login to Render**: https://dashboard.render.com
2. **Find your service**: Click on "Corazintelv1" (or your service name)
3. **Go to Environment tab**: Left sidebar → "Environment"
4. **Add variables one by one**:
   
   Click **"Add Environment Variable"**
   
   **First variable**:
   ```
   Key: ADMIN_USER
   Value: Admin
   ```
   
   **Second variable**:
   ```
   Key: ADMIN_PASSWORD
   Value: 1125
   ```
   
   **Third variable**:
   ```
   Key: SESSION_SECRET
   Value: <Generate with: openssl rand -base64 32>
          Example: AbCdEfGh123456789EXAMPLE_SECRET_HERE
   ```
   
   **Additional (Optional)**:
   ```
   Key: NODE_ENV
   Value: production
   
   Key: PORT
   Value: 3000
   ```

5. **Click "Save Changes"** at the bottom
6. **Wait for restart**: Render will automatically restart your service (takes 1-2 minutes)
7. **Test again**: Visit https://your-app.onrender.com/admin/login

### Option 2: Via Environment Variable File Upload

1. Create a file called `render-env.txt` with:
   ```
   ADMIN_USER=Admin
   ADMIN_PASSWORD=1125
   SESSION_SECRET=<your_generated_secret>
   NODE_ENV=production
   PORT=3000
   ```

2. In Render Dashboard → Environment tab
3. Look for "Import from .env" option
4. Upload your file

---

## ✅ Verification Checklist

After setting environment variables:

- [ ] Visit `/admin/debug` - all values should be `true`
- [ ] Visit `/admin/login` - page loads without errors
- [ ] Enter username: `Admin` - EXACTLY as shown (case sensitive)
- [ ] Enter password: `1125` - EXACTLY as shown
- [ ] Click login
- [ ] Should redirect to `/admin` dashboard
- [ ] Try logging out and logging back in

---

## 🎯 Expected Behavior

**Correct Flow**:
1. Visit: `https://your-app.onrender.com/admin/login`
2. See login form
3. Enter: Username = `Admin`, Password = `1125`
4. Click "Login"
5. Redirected to: `https://your-app.onrender.com/admin`
6. See admin dashboard with content editing

**If Something Different Happens**:
- Stays on login page with no error → SESSION_SECRET issue
- Shows "Wrong login" → Username/password mismatch
- Shows 500 error → Check Render logs
- Can't access `/admin/debug` → Service not running

---

## 🔐 Security Note

**After you've fixed the login**, remove the debug endpoint:

1. Open `src/routes/admin.js`
2. Delete the `/admin/debug` route (lines ~27-39)
3. Commit and push to GitHub

Or keep it but add authentication:
```javascript
router.get('/admin/debug', requireAdmin, (req, res) => {
  // ... existing code
});
```

---

## 📞 Still Not Working?

### Share This Information:

1. What you see at `/admin/debug`
2. Exact error message (if any)
3. What happens when you click login:
   - Page reloads?
   - Shows error?
   - Redirects somewhere?
4. Screenshot of Render Environment tab (hide the actual values)

---

## 🚀 Quick Test Script

Run this in your browser console on the login page:

```javascript
fetch('/admin/debug')
  .then(r => r.json())
  .then(data => {
    console.log('Environment Check:', data);
    if (!data.adminUserSet) console.error('❌ ADMIN_USER not set!');
    if (!data.adminPasswordSet) console.error('❌ ADMIN_PASSWORD not set!');
    if (!data.sessionSecretSet) console.error('❌ SESSION_SECRET not set!');
    if (data.adminUserSet && data.adminPasswordSet && data.sessionSecretSet) {
      console.log('✅ All environment variables are set!');
    }
  });
```

---

**Most Common Fix**: Add SESSION_SECRET environment variable on Render! 🔑
