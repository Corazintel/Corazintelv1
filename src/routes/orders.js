'use strict';

const express = require('express');
const router = express.Router();
const {
    filterOrders,
    getOrderById,
    createOrder,
    updateOrder,
    addActivityLog
} = require('../services/orderStore');
const { seedOrders } = require('../services/seedOrders');

function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/orders - List and filter orders
router.get('/api/orders', requireAdmin, async (req, res) => {
    try {
        const filters = {
            status: req.query.status ? req.query.status.split(',') : null,
            category: req.query.category ? req.query.category.split(',') : null,
            priority: req.query.priority ? req.query.priority.split(',') : null,
            paymentStatus: req.query.paymentStatus ? req.query.paymentStatus.split(',') : null,
            assignedTo: req.query.assignedTo || null,
            q: req.query.q || null,
            dateFrom: req.query.dateFrom || null,
            dateTo: req.query.dateTo || null,
            sort: req.query.sort || '-createdAt'
        };

        const orders = await filterOrders(filters);

        // Simple pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const start = (page - 1) * limit;
        const end = start + limit;

        const paginatedOrders = orders.slice(start, end);

        res.json({
            orders: paginatedOrders,
            total: orders.length,
            page,
            totalPages: Math.ceil(orders.length / limit)
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id - Get single order
router.get('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
        const order = await getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST /api/orders - Create new order
router.post('/api/orders', requireAdmin, async (req, res) => {
    try {
        const order = await createOrder(req.body);
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PATCH /api/orders/:id - Update order
router.patch('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
        const allowedFields = [
            'status', 'priority', 'assignedTo', 'internalNotes',
            'tags', 'dueDate', 'paymentStatus', 'category', 'amount'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const order = await updateOrder(req.params.id, updates);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Log activity for important changes
        if (updates.status) {
            await addActivityLog(req.params.id, 'status_change', `Status changed to ${updates.status}`);
        }
        if (updates.priority) {
            await addActivityLog(req.params.id, 'priority_change', `Priority changed to ${updates.priority}`);
        }
        if (updates.paymentStatus) {
            await addActivityLog(req.params.id, 'payment_change', `Payment status changed to ${updates.paymentStatus}`);
        }

        res.json(order);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// POST /api/orders/:id/message - Log a message
router.post('/api/orders/:id/message', requireAdmin, async (req, res) => {
    try {
        const { subject, body } = req.body;
        const text = `Email sent: ${subject}`;

        const order = await addActivityLog(req.params.id, 'email_sent', text);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update lastMessageAt
        await updateOrder(req.params.id, { lastMessageAt: new Date().toISOString() });

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error logging message:', error);
        res.status(500).json({ error: 'Failed to log message' });
    }
});

// POST /api/orders/seed - Seed sample data (dev only)
router.post('/api/orders/seed', requireAdmin, async (req, res) => {
    try {
        const count = parseInt(req.body.count) || 20;
        const orders = await seedOrders(count);
        res.json({ success: true, count: orders.length });
    } catch (error) {
        console.error('Error seeding orders:', error);
        res.status(500).json({ error: 'Failed to seed orders' });
    }
});

// POST /api/webhooks/order-updated - Webhook endpoint
router.post('/api/webhooks/order-updated', async (req, res) => {
    try {
        // In a real app, you'd validate the webhook signature
        // and send to external services (Zapier, webhooks, etc.)
        console.log('Order updated webhook:', req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook failed' });
    }
});

module.exports = router;
