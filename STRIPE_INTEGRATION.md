# Stripe Payment Integration Guide

## 🎯 Overview

Your Orders Management system is now fully integrated with Stripe! Orders automatically sync with Stripe payments through webhook events, making payment tracking seamless.

## 🔑 What's Been Added

### 1. **Order Data Model - Stripe Fields**
Each order can now store Stripe payment information:
```javascript
{
  stripe: {
    paymentIntentId: "pi_xxxxxxxxxxxxxxxx",      // Stripe Payment Intent ID
    checkoutSessionId: "cs_test_xxxxxxxxx",      // Checkout Session ID
    customerId: "cus_xxxxxxxxxxxxxxxx",          // Stripe Customer ID
    status: "succeeded",                          // Payment status
    amountTotal: 250.00,                         // Total amount
    amountCaptured: 250.00,                      // Captured amount
    currency: "usd",                              // Currency
    refunded: false,                              // Refund status
    amountRefunded: 0,                            // Refund amount
    lastUpdated: "2026-02-14T20:00:00.000Z"      // Last sync time
  }
}
```

### 2. **Webhook Handler** (`/webhooks/stripe`)
Automatically processes Stripe events:
- ✅ `checkout.session.completed` - New payment completed
- ✅ `payment_intent.succeeded` - Payment successful
- ✅ `payment_intent.payment_failed` - Payment failed
- ✅ `charge.refunded` - Refund processed

### 3. **Helper Functions**
New functions in `orderStore.js`:
- `getOrderByStripePaymentIntent(paymentIntentId)` - Find order by payment ID
- `getOrderByStripeSession(sessionId)` - Find order by checkout session
- `getOrdersByStripeCustomer(customerId)` - Find all orders for a customer
- `updateOrderStripeData(orderId, stripeData)` - Update Stripe info

### 4. **Admin UI Updates**
The order detail panel now shows:
- 💳 **Payment Intent ID** (clickable link to Stripe Dashboard)
- 🛒 **Checkout Session ID** (clickable link)
- 👤 **Stripe Customer ID** (clickable link)
- ✅ **Payment Status** (color-coded: succeeded, failed, pending)
- 💰 **Amount & Currency**
- 🔄 **Refund Information** (if applicable)
- ⏱️ **Last Updated** timestamp

## 🚀 Setup Instructions

### Step 1: Get Your Stripe Keys

1. **Sign up for Stripe**: https://dashboard.stripe.com/register
2. **Get Test API Keys**:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)

### Step 2: Update Environment Variables

**Local Development** (`.env` file):
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_SECRET_KEY=sk_test_your_actual_secret_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Render Production**:
1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add these variables:
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### Step 3: Set Up Stripe Webhook

1. **Go to Stripe Webhooks**:
   - Dashboard: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"

2. **Configure Endpoint**:
   - **Endpoint URL**: `https://your-app.onrender.com/webhooks/stripe`
   - For local testing: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com/)

3. **Select Events to Listen For**:
   ```
   ✅ checkout.session.completed
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   ✅ charge.refunded
   ```

4. **Get Webhook Secret**:
   - After creating, click on the webhook
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add to your environment variables

### Step 4: Test the Integration

#### Option A: Create Payment Link in Stripe
1. Go to: https://dashboard.stripe.com/test/payment-links
2. Create a new payment link
3. In "Metadata", add:
   ```
   orderId: Your-Order-ID-Here
   category: Web Development
   subject: Test Order
   ```
4. Complete a test payment using card: `4242 4242 4242 4242`
5. Check your Orders page - the order should update automatically!

#### Option B: Use Stripe Checkout (Programmatic)
```javascript
// Example: Create Checkout Session with Order Metadata
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Web Development Package',
      },
      unit_amount: 25000, // $250.00 in cents
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: 'https://your-app.com/success',
  cancel_url: 'https://your-app.com/cancel',
  metadata: {
    orderId: 'ORD-1234567890-abc123',  // Link to existing order
    category: 'Web Development',
    subject: 'Premium Website Build'
  },
  customer_email: 'customer@example.com'
});

// Redirect customer to session.url
```

## 💡 Integration Patterns

### Pattern 1: Manual Order → Stripe Payment
**Use Case**: Customer places order in your system, then pays via Stripe

1. Create order manually in Admin panel
2. Send customer a Stripe Payment Link or Checkout Session
3. Include order ID in metadata: `{ orderId: "ORD-xxx" }`
4. Webhook automatically updates order when payment succeeds

### Pattern 2: Stripe Payment → Auto-Create Order
**Use Case**: Customer pays first, order is auto-created

1. Customer completes Stripe checkout
2. Include required info in metadata:
   ```javascript
   metadata: {
     category: 'Beauty',
     subject: 'Facial Package',
     description: 'Deep cleanse + hydration'
   }
   ```
3. Webhook creates new order automatically
4. You see it in Admin panel instantly!

### Pattern 3: Existing Stripe Customer
**Use Case**: Link all orders for a returning customer

1. Use same Stripe Customer ID for all payments
2. System tracks all orders per customer
3. Use `getOrdersByStripeCustomer(customerId)` to fetch history

## 🔍 How to Link Orders & Payments

### Method 1: By Payment Intent ID
```javascript
const order = await getOrderByStripePaymentIntent('pi_xxxxxxxxx');
```

### Method 2: By Checkout Session
```javascript
const order = await getOrderByStripeSession('cs_test_xxxxxxxxx');
```

### Method 3: By Customer ID
```javascript
const allOrders = await getOrdersByStripeCustomer('cus_xxxxxxxxx');
```

## 📊 Admin Dashboard Usage

### View Stripe Payment Info
1. Open any order in the Orders Management page
2. Scroll to **"💳 Stripe Payment Info"** section
3. See all payment details
4. Click any ID to open in Stripe Dashboard
5. Use "Copy" buttons to copy IDs

### Update Stripe Data Manually
```javascript
await updateOrderStripeData('ORD-xxx', {
  paymentIntentId: 'pi_xxxxxxxxx',
  status: 'succeeded',
  amountCaptured: 250.00
});
```

## 🧪 Testing with Stripe Test Cards

```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
⚡ 3D Secure: 4000 0025 0000 3155
```

Full list: https://stripe.com/docs/testing

## 🔐 Security Best Practices

1. **Never commit API keys** - Already in `.gitignore` ✅
2. **Use webhook signatures** - Verify events are from Stripe
3. **Test mode vs Live mode** - Keep them separate
4. **Environment variables** - Never hardcode keys

## 🎨 Customization

### Add More Webhook Events
Edit `/src/routes/stripe.js`:
```javascript
case 'customer.subscription.created':
  await handleSubscriptionCreated(event.data.object);
  break;
```

### Customize Order Creation
Edit the `createOrderFromStripeSession()` function to map your specific fields.

### Change Stripe Dashboard Links
Edit `/public/js/orders.js` stripe info section to change link format.

## 📞 Troubleshooting

### Webhook Not Firing?
1. Check webhook URL is correct
2. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks/stripe`
3. Check server logs for errors

### Order Not Updating?
1. Verify order ID in Stripe metadata exactly matches
2. Check webhook secret is correct
3. Look at activity log in order detail

### Links Not Working?
- Test orders: Links go to `https://dashboard.stripe.com/test/...`
- Live orders: Links go to `https://dashboard.stripe.com/...`

## 🚀 Going Live

When ready for production:

1. **Get Live API Keys**:
   - https://dashboard.stripe.com/apikeys
   - `pk_live_...` and `sk_live_...`

2. **Update Render Environment**:
   - Replace test keys with live keys
   - Update webhook endpoint to live mode

3. **Create Live Webhook**:
   - https://dashboard.stripe.com/webhooks
   - Same events as test mode
   - Get new webhook secret

4. **Test with Real Card** (small amount):
   - Process a $1 payment
   - Verify order updates
   - Refund immediately to test refund flow

## 📖 Additional Resources

- **Stripe Docs**: https://stripe.com/docs
- **Webhook Events**: https://stripe.com/docs/api/events/types
- **Checkout Sessions**: https://stripe.com/docs/payments/checkout
- **Payment Intents**: https://stripe.com/docs/payments/payment-intents

---

**🎉 Your Orders Management system is now fully integrated with Stripe!** Every payment automatically syncs with your admin panel, making order tracking effortless.
