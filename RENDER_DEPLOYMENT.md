# Render Deployment Checklist ✅

## 🎯 Overview

This checklist ensures your Corazintel website and Admin Orders Management system work perfectly on Render.

---

## ✅ Pre-Deployment Checklist

### 1. **Environment Variables Setup**

Go to your Render Dashboard → Your Service → Environment Tab and add these variables:

#### Required Variables:
```bash
# Admin Authentication
ADMIN_USER=Admin
ADMIN_PASSWORD=your_secure_password_here

# Session Security (Generate with: openssl rand -base64 32)
SESSION_SECRET=your_generated_secret_here

# Application Settings
NODE_ENV=production
PORT=3000

# Brand (Optional)
BRAND_NAME=Corazintel
BRAND_SLOGAN=Real Solutions. Multifaceted Expertise.
```

#### Stripe Variables (If using Stripe):
```bash
# Get from: https://dashboard.stripe.com/test/apikeys (for testing)
# Or: https://dashboard.stripe.com/apikeys (for live)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

### 2. **GitHub Repository**

✅ Ensure all code is pushed to GitHub:
```bash
git add -A
git commit -m "Ready for Render deployment"
git push
```

✅ `.gitignore` should include:
- `.env`
- `node_modules/`
- `src/data/*.json` (data files are auto-generated)

---

### 3. **Render Service Configuration**

When creating/updating your Render service:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Auto-Deploy** | Yes (recommended) |

---

## 🚀 Deployment Steps

### Step 1: Configure Service on Render

1. **Login to Render**: https://dashboard.render.com
2. **Select Your Service** or create new Web Service
3. **Connect GitHub** repository if not already connected

### Step 2: Set Environment Variables

1. Go to **Environment** tab
2. Add all variables from the checklist above
3. Click **Save Changes**

**IMPORTANT**: Never commit `.env` file to Git! ✅ Already in `.gitignore`

### Step 3: Deploy

Option A: **Auto-Deploy** (if enabled):
- Just push to GitHub: `git push`
- Render deploys automatically

Option B: **Manual Deploy**:
- Go to your service dashboard
- Click **Manual Deploy** → Deploy latest commit

### Step 4: Monitor Deployment

1. Watch the **Logs** tab during deployment
2. Look for success messages:
   ```
   Created orders.json file
   Created content.json file with default content
   Corazintel running at http://localhost:3000
   ```
3. Wait for "Live" status

---

## 🧪 Post-Deployment Testing

### Test 1: Homepage
```
✅ Visit: https://your-app.onrender.com
✅ Should load without errors
✅ Check that categories display
```

### Test 2: Admin Login
```
✅ Visit: https://your-app.onrender.com/admin/login
✅ Login with: ADMIN_USER and ADMIN_PASSWORD from env vars
✅ Should redirect to admin dashboard
```

### Test 3: Admin Dashboard
```
✅ Visit: https://your-app.onrender.com/admin
✅ Should see admin interface
✅ Try editing content and saving
```

### Test 4: Orders Management
```
✅ Visit: https://your-app.onrender.com/admin/orders
✅ Should load empty orders page
✅ Open browser console
✅ Run: seedTestData(5)
✅ Verify 5 test orders appear
```

### Test 5: Stripe Webhook (If using Stripe)
```
✅ Configure webhook at: https://dashboard.stripe.com/test/webhooks
✅ Webhook URL: https://your-app.onrender.com/webhooks/stripe
✅ Test with a payment
✅ Check order updates automatically
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Application failed to start"

**Symptoms**: Service won't start, shows error in logs

**Solutions**:
1. Check **Logs** tab for specific error
2. Verify `package.json` has all dependencies
3. Ensure `server.js` exists in root directory
4. Check Node version compatibility

### Issue 2: "Cannot find module './src/services/..'"

**Symptoms**: Module not found errors

**Solutions**:
1. Check file paths are correct (case-sensitive!)
2. Ensure all files are committed to Git
3. Run `npm install` locally to verify dependencies
4. Push changes and redeploy

### Issue 3: Admin login fails

**Symptoms**: Can't login to admin panel

**Solutions**:
1. **Check environment variables**:
   - Go to Render Dashboard → Environment
   - Verify `ADMIN_USER` and `ADMIN_PASSWORD` are set
   - Verify `SESSION_SECRET` is set
2. Check browser console for errors
3. Try clearing cookies and retrying

### Issue 4: Orders page shows error

**Symptoms**: `/admin/orders` shows "Failed to load orders"

**Solutions**:
1. **Check logs** for "Created orders.json file" message
2. Verify `src/services/orderStore.js` has ensureDataExists()
3. Check file permissions (shouldn't be an issue on Render)
4. Try running `seedTestData(1)` in console

### Issue 5: Content not saving

**Symptoms**: Admin dashboard changes don't persist

**Solutions**:
1. Check logs for "Created content.json file" message
2. Verify `src/services/contentStore.js` has ensureDataExists()
3. Check that data directory is being created

### Issue 6: Stripe webhook not working

**Symptoms**: Payments don't update orders

**Solutions**:
1. **Verify webhook URL** in Stripe Dashboard
2. **Check webhook secret** in Render environment variables
3. **Test webhook** using Stripe Dashboard's "Send test webhook" button
4. Check Render logs for webhook events
5. Verify correct events are selected:
   - checkout.session.completed
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded

---

## 📊 Monitoring & Maintenance

### Logs
- **Access**: Render Dashboard → Your Service → Logs
- **Check for**:
  - Startup messages
  - Error messages
  - Webhook events
  - Data file creation

### Automatic Restarts
- Render automatically restarts your service if it crashes
- Check logs to see why it crashed

### Scaling
- Free tier: 1 instance, goes to sleep after inactivity
- Paid tier: Always on, can scale to multiple instances

---

## 🔐 Security Best Practices

✅ **Never commit sensitive data**:
- `.env` file (already in `.gitignore`)
- `src/data/*.json` files (already in `.gitignore`)
- API keys or secrets

✅ **Use strong passwords**:
- Generate SESSION_SECRET: `openssl rand -base64 32`
- Use unique ADMIN_PASSWORD

✅ **Environment Variables**:
- All sensitive config in Render environment variables
- Never hardcode in source code

✅ **HTTPS**:
- Render provides free HTTPS automatically
- All admin routes are protected

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Homepage loads at `https://your-app.onrender.com`
✅ Can login at `/admin/login`
✅ Admin dashboard works at `/admin`
✅ Orders page works at `/admin/orders`
✅ Can create test orders
✅ Can edit and save content
✅ Stripe webhooks update orders (if configured)
✅ No errors in Render logs

---

## 📞 Need Help?

### Render Documentation
- https://render.com/docs
- https://render.com/docs/web-services
- https://render.com/docs/environment-variables

### Your Application Guides
- `README.md` - General project info
- `ORDERS_GUIDE.md` - Orders system usage
- `STRIPE_INTEGRATION.md` - Stripe setup (if using payments)

### Quick Fixes

**Site is slow to wake up?**
- Free tier sleeps after inactivity
- Upgrade to paid tier for always-on service

**Need to reset admin password?**
- Update `ADMIN_PASSWORD` in Render environment variables
- Service will restart automatically

**Want to clear all orders?**
- Not recommended in production
- For testing: manually delete orders in admin panel
- Or set up a reset endpoint (dev only)

---

## 🚀 You're All Set!

Your Corazintel website with Admin Orders Management system is now live on Render! 

**Your URLs**:
- 🏠 Homepage: `https://your-app.onrender.com`
- 🔐 Admin Login: `https://your-app.onrender.com/admin/login`
- 📦 Orders: `https://your-app.onrender.com/admin/orders`

**Next Steps**:
1. Customize your content in admin dashboard
2. Add real orders or generate test data
3. Set up Stripe webhook (if using payments)
4. Share your live site!

---

**Built with ❤️ - Your admin panel is production-ready!** 🎉
