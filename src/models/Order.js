const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Customer Info
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },

    // Order Details
    category: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },

    // Status & Priority
    status: {
        type: String,
        enum: ['New', 'In Progress', 'Waiting on Client', 'Completed', 'Cancelled', 'Deleted'],
        default: 'New'
    },
    priority: {
        type: String,
        enum: ['P0', 'P1', 'P2', 'P3'],
        default: 'P3'
    },

    // Assignment & Dates
    assignedTo: { type: String, default: '' },
    dueDate: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    // Payment
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Deposit Paid', 'Paid', 'Refunded'],
        default: 'Unpaid'
    },
    amount: { type: Number, default: 0 },

    // Stripe Integration
    stripe: {
        checkoutSessionId: String,
        paymentIntentId: String
    },

    // Files & Tags
    attachments: [{
        originalName: String,
        filename: String,
        path: String,
        size: Number,
        uploadedAt: Date
    }],
    tags: [String],

    // Activity Log
    activity: [{
        timestamp: { type: Date, default: Date.now },
        action: String,
        note: String
    }],

    // Metadata (for intake form data)
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Deletion tracking
    deletedAt: Date,
    deletedBy: String
}, {
    timestamps: true
});

// Indexes for faster queries
orderSchema.index({ status: 1 });
orderSchema.index({ category: 1 });
orderSchema.index({ priority: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to update updatedAt
orderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
