'use strict';

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { isMongoDBConnected } = require('../config/database');
const Order = require('../models/Order');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDERS_PATH = path.join(DATA_DIR, 'orders.json');

/**
 * Ensure data directory and orders.json exist
 * Only needed for file-based storage
 */
async function ensureDataExists() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(ORDERS_PATH);
        } catch (error) {
            await fs.writeFile(ORDERS_PATH, JSON.stringify([], null, 2), 'utf8');
        }
    } catch (error) {
        console.error('Error ensuring data exists:', error);
    }
}

/**
 * Read all orders
 */
async function readOrders() {
    if (isMongoDBConnected()) {
        try {
            const orders = await Order.find({ status: { $ne: 'Deleted' } }).sort({ createdAt: -1 });
            // Convert _id to id for compatibility
            return orders.map(order => {
                const doc = order.toObject();
                doc.id = doc._id.toString();
                delete doc._id;
                delete doc.__v;
                return doc;
            });
        } catch (error) {
            console.error('Error reading from MongoDB:', error);
            return [];
        }
    }

    // Fallback to File System
    await ensureDataExists();
    try {
        const data = await fs.readFile(ORDERS_PATH, 'utf8');
        const orders = JSON.parse(data);
        return orders.filter(o => o.status !== 'Deleted');
    } catch (error) {
        return [];
    }
}

/**
 * Write all orders (File System Only)
 */
async function writeOrders(orders) {
    await ensureDataExists();
    await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf8');
}

/**
 * Filter orders
 */
async function filterOrders(filters = {}) {
    let orders = await readOrders();

    return orders.filter(order => {
        // Status Filter
        if (filters.status && filters.status.length > 0) {
            if (!filters.status.includes(order.status)) return false;
        }

        // Category Filter
        if (filters.category && filters.category.length > 0) {
            if (!filters.category.includes(order.category)) return false;
        }

        // Priority Filter
        if (filters.priority && filters.priority.length > 0) {
            if (!filters.priority.includes(order.priority)) return false;
        }

        // Search Query
        if (filters.q) {
            const q = filters.q.toLowerCase();
            const matches =
                (order.customer.name && order.customer.name.toLowerCase().includes(q)) ||
                (order.customer.email && order.customer.email.toLowerCase().includes(q)) ||
                (order.subject && order.subject.toLowerCase().includes(q)) ||
                (order.id && order.id.toLowerCase().includes(q));
            if (!matches) return false;
        }

        return true;
    });
}

/**
 * Get order by ID
 */
async function getOrderById(id) {
    if (isMongoDBConnected()) {
        try {
            const order = await Order.findById(id);
            if (!order) return null;
            const doc = order.toObject();
            doc.id = doc._id.toString();
            delete doc._id;
            delete doc.__v;
            return doc;
        } catch (error) {
            // Handle invalid ObjectId
            return null;
        }
    }

    const orders = await readOrders();
    return orders.find(o => o.id === id) || null;
}

/**
 * Create a new order
 */
async function createOrder(orderData) {
    const newOrder = {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: orderData.status || 'New',
        priority: orderData.priority || 'P3'
    };

    if (isMongoDBConnected()) {
        const order = new Order(newOrder);
        const savedOrder = await order.save();
        const doc = savedOrder.toObject();
        doc.id = doc._id.toString();
        delete doc._id;
        delete doc.__v;
        return doc;
    }

    // File System Fallback
    newOrder.id = uuidv4();
    const orders = await readOrders(); // This reads from FS if Mongo disconnected

    // We need to read the raw file again to ensure we don't lose deleted records if we are just appending
    // ensuring we are working with the FS data set
    await ensureDataExists();
    let fileOrders = [];
    try {
        const data = await fs.readFile(ORDERS_PATH, 'utf8');
        fileOrders = JSON.parse(data);
    } catch (e) { fileOrders = []; }

    fileOrders.unshift(newOrder);
    await writeOrders(fileOrders);
    return newOrder;
}

/**
 * Update an order
 */
async function updateOrder(id, updates) {
    updates.updatedAt = new Date().toISOString();

    if (isMongoDBConnected()) {
        const order = await Order.findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (!order) return null;
        const doc = order.toObject();
        doc.id = doc._id.toString();
        delete doc._id;
        delete doc.__v;
        return doc;
    }

    // File System Fallback
    const orders = await readOrders(); // Get current active orders
    // We need the full list including deleted ones to updating the file correctly
    await ensureDataExists();
    let allOrders = [];
    try {
        const data = await fs.readFile(ORDERS_PATH, 'utf8');
        allOrders = JSON.parse(data);
    } catch (e) { allOrders = []; }

    const index = allOrders.findIndex(o => o.id === id);
    if (index === -1) return null;

    allOrders[index] = { ...allOrders[index], ...updates };
    await writeOrders(allOrders);

    return allOrders[index];
}

/**
 * Add activity log
 */
async function addActivityLog(id, action, note = '') {
    const activity = {
        timestamp: new Date().toISOString(),
        action,
        note
    };

    if (isMongoDBConnected()) {
        await Order.findByIdAndUpdate(id, {
            $push: { activity: activity },
            $set: { updatedAt: new Date().toISOString() }
        });
        return;
    }

    // File System
    const orders = await readOrders(); // Active orders
    await ensureDataExists();
    let allOrders = [];
    try {
        const data = await fs.readFile(ORDERS_PATH, 'utf8');
        allOrders = JSON.parse(data);
    } catch (e) { allOrders = []; }

    const index = allOrders.findIndex(o => o.id === id);
    if (index !== -1) {
        if (!allOrders[index].activity) allOrders[index].activity = [];
        allOrders[index].activity.push(activity);
        allOrders[index].updatedAt = new Date().toISOString();
        await writeOrders(allOrders);
    }
}

module.exports = {
    filterOrders,
    getOrderById,
    createOrder,
    updateOrder,
    addActivityLog
};
