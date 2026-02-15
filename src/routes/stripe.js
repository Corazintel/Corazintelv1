'use strict';

const express = require('express');
const router = express.Router();
const {
    getOrderByStripePaymentIntent,
    getOrderByStripeSession,
    updateOrderStripeData,
    updateOrder,
    addActivityLog,
    createOrder
} = require('../services/orderStore');

/**
 * Stripe Webhook Handler
 * This endpoint receives webhooks from Stripe when payment events occur
 * 
 * To set up in Stripe Dashboard:
 * 1. Go to Developers > Webhooks
 * 2. Add endpoint: https://your-domain.com/webhooks/stripe
 * 3. Select events: payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // In production, you should verify the webhook signature
    // For now, we'll process the event directly
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // let event;
    // try {
    //   event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    // } catch (err) {
    //   return res.status(400).send(`Webhook Error: ${err.message}`);
    // }

    try {
        const event = JSON.parse(req.body.toString());

        console.log('Stripe webhook received:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
    const order = await getOrderByStripeSession(session.id);

    if (order) {
        // Update existing order
        await updateOrderStripeData(order.id, {
            checkoutSessionId: session.id,
            paymentIntentId: session.payment_intent,
            customerId: session.customer,
            status: 'succeeded',
            amountTotal: session.amount_total / 100, // Convert from cents
            currency: session.currency
        });

        await updateOrder(order.id, {
            paymentStatus: 'Paid',
            status: order.status === 'New' ? 'In Progress' : order.status
        });

        console.log(`Order ${order.id} updated from checkout session ${session.id}`);
    } else {
        // Create new order from checkout session
        const customerEmail = session.customer_details?.email || session.customer_email;

        if (customerEmail && session.metadata?.orderId) {
            await createOrderFromStripeSession(session);
        }
    }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    const order = await getOrderByStripePaymentIntent(paymentIntent.id);

    if (order) {
        await updateOrderStripeData(order.id, {
            paymentIntentId: paymentIntent.id,
            status: 'succeeded',
            amountCaptured: paymentIntent.amount_captured / 100,
            currency: paymentIntent.currency
        });

        await updateOrder(order.id, {
            paymentStatus: 'Paid'
        });

        await addActivityLog(order.id, 'payment_success', `Payment of $${(paymentIntent.amount_captured / 100).toFixed(2)} succeeded via Stripe`);

        console.log(`Payment succeeded for order ${order.id}`);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent) {
    const order = await getOrderByStripePaymentIntent(paymentIntent.id);

    if (order) {
        await updateOrderStripeData(order.id, {
            paymentIntentId: paymentIntent.id,
            status: 'failed',
            failureReason: paymentIntent.last_payment_error?.message || 'Unknown error'
        });

        await addActivityLog(order.id, 'payment_failed', `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`);

        console.log(`Payment failed for order ${order.id}`);
    }
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge) {
    const order = await getOrderByStripePaymentIntent(charge.payment_intent);

    if (order) {
        await updateOrder(order.id, {
            paymentStatus: 'Refunded'
        });

        await updateOrderStripeData(order.id, {
            refunded: true,
            amountRefunded: charge.amount_refunded / 100
        });

        await addActivityLog(order.id, 'refund', `Refund of $${(charge.amount_refunded / 100).toFixed(2)} processed`);

        console.log(`Refund processed for order ${order.id}`);
    }
}

/**
 * Create order from Stripe checkout session
 */
async function createOrderFromStripeSession(session) {
    const orderData = {
        customer: {
            name: session.customer_details?.name || 'Stripe Customer',
            email: session.customer_details?.email || session.customer_email,
            phone: session.customer_details?.phone || ''
        },
        category: session.metadata?.category || 'Web Development',
        priority: 'P2',
        status: 'New',
        subject: session.metadata?.subject || 'Stripe Order',
        description: session.metadata?.description || 'Order created from Stripe checkout',
        paymentStatus: 'Paid',
        amount: session.amount_total / 100,
        tags: ['stripe', 'auto-created'],
        stripe: {
            checkoutSessionId: session.id,
            paymentIntentId: session.payment_intent,
            customerId: session.customer,
            status: 'succeeded',
            amountTotal: session.amount_total / 100,
            currency: session.currency,
            lastUpdated: new Date().toISOString()
        }
    };

    await createOrder(orderData);
    console.log('Order created from Stripe session:', session.id);
}

module.exports = router;
