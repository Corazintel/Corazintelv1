'use strict';

const fs = require('fs').promises;
const path = require('path');

const ORDERS_PATH = path.join(__dirname, '..', 'data', 'orders.json');

/**
 * Read all orders from orders.json
 * @returns {Promise<Array>} Array of order objects
 */
async function readOrders() {
    try {
        const data = await fs.readFile(ORDERS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return empty array
            return [];
        }
        throw error;
    }
}

/**
 * Write orders to orders.json
 * @param {Array} orders - Array of order objects
 * @returns {Promise<void>}
 */
async function writeOrders(orders) {
    await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf8');
}

/**
 * Get a single order by ID
 * @param {string} id - Order ID
 * @returns {Promise<Object|null>} Order object or null if not found
 */
async function getOrderById(id) {
    const orders = await readOrders();
    return orders.find(order => order.id === id) || null;
}

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
async function createOrder(orderData) {
    const orders = await readOrders();
    const newOrder = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...orderData,
        activityLog: orderData.activityLog || [{
            at: new Date().toISOString(),
            type: 'created',
            text: 'Order created'
        }]
    };
    orders.push(newOrder);
    await writeOrders(orders);
    return newOrder;
}

/**
 * Update an existing order
 * @param {string} id - Order ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated order or null if not found
 */
async function updateOrder(id, updates) {
    const orders = await readOrders();
    const index = orders.findIndex(order => order.id === id);

    if (index === -1) {
        return null;
    }

    const updatedOrder = {
        ...orders[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    orders[index] = updatedOrder;
    await writeOrders(orders);
    return updatedOrder;
}

/**
 * Add an activity log entry to an order
 * @param {string} id - Order ID
 * @param {string} type - Activity type
 * @param {string} text - Activity description
 * @returns {Promise<Object|null>} Updated order or null if not found
 */
async function addActivityLog(id, type, text) {
    const orders = await readOrders();
    const index = orders.findIndex(order => order.id === id);

    if (index === -1) {
        return null;
    }

    const activity = {
        at: new Date().toISOString(),
        type,
        text
    };

    orders[index].activityLog = orders[index].activityLog || [];
    orders[index].activityLog.push(activity);
    orders[index].updatedAt = new Date().toISOString();

    await writeOrders(orders);
    return orders[index];
}

/**
 * Filter and sort orders
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} Filtered orders
 */
async function filterOrders(filters = {}) {
    let orders = await readOrders();

    // Filter by status
    if (filters.status && filters.status.length > 0) {
        orders = orders.filter(order => filters.status.includes(order.status));
    }

    // Filter by category
    if (filters.category && filters.category.length > 0) {
        orders = orders.filter(order => filters.category.includes(order.category));
    }

    // Filter by priority
    if (filters.priority && filters.priority.length > 0) {
        orders = orders.filter(order => filters.priority.includes(order.priority));
    }

    // Filter by payment status
    if (filters.paymentStatus && filters.paymentStatus.length > 0) {
        orders = orders.filter(order => filters.paymentStatus.includes(order.paymentStatus));
    }

    // Filter by assigned to
    if (filters.assignedTo) {
        orders = orders.filter(order => order.assignedTo === filters.assignedTo);
    }

    // Search query (name, email, id, subject)
    if (filters.q) {
        const query = filters.q.toLowerCase();
        orders = orders.filter(order => {
            return (
                order.id.toLowerCase().includes(query) ||
                order.customer.name.toLowerCase().includes(query) ||
                order.customer.email.toLowerCase().includes(query) ||
                order.subject.toLowerCase().includes(query)
            );
        });
    }

    // Date range
    if (filters.dateFrom) {
        orders = orders.filter(order => order.createdAt >= filters.dateFrom);
    }
    if (filters.dateTo) {
        orders = orders.filter(order => order.createdAt <= filters.dateTo);
    }

    // Sort
    const sortBy = filters.sort || '-createdAt'; // Default: newest first
    const sortDesc = sortBy.startsWith('-');
    const sortField = sortDesc ? sortBy.substring(1) : sortBy;

    orders.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (sortField === 'priority') {
            // P0 = 0, P1 = 1, P2 = 2, P3 = 3
            aVal = parseInt(a.priority.substring(1));
            bVal = parseInt(b.priority.substring(1));
        }

        if (aVal < bVal) return sortDesc ? 1 : -1;
        if (aVal > bVal) return sortDesc ? -1 : 1;
        return 0;
    });

    return orders;
}

/**
 * Generate a unique order ID
 * @returns {string} Order ID
 */
function generateId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Find order by Stripe Payment Intent ID
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @returns {Promise<Object|null>} Order object or null if not found
 */
async function getOrderByStripePaymentIntent(paymentIntentId) {
    const orders = await readOrders();
    return orders.find(order => order.stripe?.paymentIntentId === paymentIntentId) || null;
}

/**
 * Find order by Stripe Checkout Session ID
 * @param {string} sessionId - Stripe Checkout Session ID
 * @returns {Promise<Object|null>} Order object or null if not found
 */
async function getOrderByStripeSession(sessionId) {
    const orders = await readOrders();
    return orders.find(order => order.stripe?.checkoutSessionId === sessionId) || null;
}

/**
 * Find orders by Stripe Customer ID
 * @param {string} customerId - Stripe Customer ID
 * @returns {Promise<Array>} Array of orders for this customer
 */
async function getOrdersByStripeCustomer(customerId) {
    const orders = await readOrders();
    return orders.filter(order => order.stripe?.customerId === customerId);
}

/**
 * Update order with Stripe payment information
 * @param {string} orderId - Order ID
 * @param {Object} stripeData - Stripe payment data
 * @returns {Promise<Object|null>} Updated order or null if not found
 */
async function updateOrderStripeData(orderId, stripeData) {
    const orders = await readOrders();
    const index = orders.findIndex(order => order.id === orderId);

    if (index === -1) {
        return null;
    }

    orders[index].stripe = {
        ...orders[index].stripe,
        ...stripeData,
        lastUpdated: new Date().toISOString()
    };
    orders[index].updatedAt = new Date().toISOString();

    await writeOrders(orders);

    // Log activity
    await addActivityLog(orderId, 'stripe_update', `Stripe payment updated: ${stripeData.status || 'info updated'}`);

    return orders[index];
}

module.exports = {
    readOrders,
    writeOrders,
    getOrderById,
    createOrder,
    updateOrder,
    addActivityLog,
    filterOrders,
    generateId,
    getOrderByStripePaymentIntent,
    getOrderByStripeSession,
    getOrdersByStripeCustomer,
    updateOrderStripeData
};
