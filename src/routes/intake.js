'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const { createOrder, logActivity } = require('../services/orderStore');

// File upload configuration
const upload = multer({
    dest: 'uploads/temp/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|zip|txt/;
        const ext = path.extname(file.originalname).toLowerCase().slice(1);

        if (allowedTypes.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type .${ext} not allowed`));
        }
    }
});

// Show intake form
router.get('/order-intake', (req, res) => {
    res.render('order-intake', {
        title: 'Order Intake',
        brand: {
            name: process.env.BRAND_NAME || 'Corazintel'
        },
        query: req.query
    });
});

// Upload files
router.post('/api/intake/upload', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.json({ success: false, message: 'No files uploaded' });
        }

        const fileUrls = [];
        const uploadsDir = path.join(__dirname, '../../uploads/orders');

        // Ensure uploads directory exists
        await fs.mkdir(uploadsDir, { recursive: true });

        for (const file of req.files) {
            const ext = path.extname(file.originalname);
            const filename = `${uuidv4()}${ext}`;
            const destPath = path.join(uploadsDir, filename);

            // Move file from temp to permanent location
            await fs.rename(file.path, destPath);

            fileUrls.push({
                originalName: file.originalname,
                filename: filename,
                path: `/uploads/orders/${filename}`,
                size: file.size,
                uploadedAt: new Date().toISOString()
            });
        }

        res.json({ success: true, fileUrls });

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit order
router.post('/api/intake/submit', async (req, res) => {
    try {
        const data = req.body;

        // Validate required fields
        if (!data.service || !data.customerName || !data.customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Map service to category
        const categoryMap = {
            bundle_starter: 'Business Bundle',
            tech: 'Web Development',
            documents: 'Documents',
            credit: 'Credit Repair',
            computer: 'Computer Repair',
            wig: 'Beauty',
            contouring: 'Beauty',
            facials: 'Beauty'
        };

        // Generate structured description
        const description = generateOrderDescription(data);

        // Generate auto-tags
        const tags = generateOrderTags(data);

        // Create order
        const order = await createOrder({
            customer: {
                name: sanitize(data.customerName),
                email: sanitize(data.customerEmail),
                phone: sanitize(data.customerPhone)
            },
            category: categoryMap[data.service] || 'Other',
            subject: sanitize(data.subject),
            description: description,
            priority: data.priority || 'P3',
            status: 'New',
            dueDate: data.dueDate || null,
            tags: tags,
            attachments: data.attachments || [],
            paymentStatus: 'Unpaid',
            amount: getPackageAmount(data.package),
            stripe: data.stripeCheckoutSessionId ? {
                checkoutSessionId: data.stripeCheckoutSessionId,
                paymentIntentId: data.stripePaymentIntentId || null
            } : null,
            metadata: {
                source: 'intake-form',
                service: data.service,
                package: data.package,
                ipAddress: data.signature?.ipAddress || 'unknown',
                userAgent: data.signature?.userAgent || 'unknown',
                signatureTimestamp: data.signature?.timestamp,
                signatureName: data.signature?.name,
                signatureData: data.signature?.data,
                policies: data.policies,
                serviceDetails: extractServiceDetails(data)
            }
        });

        // Log creation activity
        await logActivity(order.id, 'created', 'Order created via intake form');

        res.json({
            success: true,
            orderId: order.id,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Order submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order. Please try again.'
        });
    }
});

// Helper Functions
function sanitize(str) {
    if (!str) return '';
    return String(str).trim().substring(0, 500);
}

function generateOrderDescription(data) {
    const serviceLabels = {
        tech: 'Tech (Web/Software)',
        documents: 'Documents',
        credit: 'Credit Repair',
        computer: 'Computer Repair',
        wig: 'Beauty – Wig',
        contouring: 'Beauty – Body Contouring',
        facials: 'Beauty – Facials'
    };

    let desc = `=== ORDER INTAKE SUMMARY ===\n\n`;
    desc += `Service: ${serviceLabels[data.service] || data.service}\n`;
    desc += `Package: ${data.package}\n`;
    desc += `Priority: ${data.priority}\n`;
    if (data.dueDate) desc += `Due Date: ${data.dueDate}\n`;
    desc += `\n=== CUSTOMER DETAILS ===\n`;
    desc += `Name: ${data.customerName}\n`;
    desc += `Email: ${data.customerEmail}\n`;
    desc += `Phone: ${data.customerPhone}\n`;
    desc += `\n=== SERVICE-SPECIFIC DETAILS ===\n`;

    // Add service-specific questions
    const serviceKeys = Object.keys(data).filter(key => key.startsWith(data.service));
    serviceKeys.forEach(key => {
        if (data[key] && typeof data[key] === 'string') {
            const label = key.replace(data.service, '').replace(/([A-Z])/g, ' $1').trim();
            desc += `${label}: ${data[key]}\n`;
        }
    });

    if (data.attachments && data.attachments.length > 0) {
        desc += `\n=== ATTACHMENTS ===\n`;
        data.attachments.forEach(file => {
            desc += `- ${file.originalName} (${formatFileSize(file.size)})\n`;
        });
    }

    desc += `\n=== SIGNATURE ===\n`;
    desc += `Signed by: ${data.signature?.name}\n`;
    desc += `Timestamp: ${data.signature?.timestamp}\n`;
    desc += `IP Address: ${data.signature?.ipAddress}\n`;

    return desc;
}

function generateOrderTags(data) {
    const tags = [data.service];

    // Priority-based tags
    if (data.priority === 'P0') tags.push('rush');
    if (data.priority === 'P1') tags.push('urgent');

    // Service-specific tags
    if (data.service === 'wig' || data.service === 'contouring' || data.service === 'facials') {
        tags.push('appointment-request');
    }

    if (data.service === 'computer' && data.compDataImportance === 'critical') {
        tags.push('data-critical');
    }

    if (data.service === 'contouring') {
        tags.push('contraindications-check');
    }

    // Check for missing required info
    if (!data.package) {
        tags.push('missing-package');
    }

    return tags;
}

function extractServiceDetails(data) {
    const details = {};
    const serviceKeys = Object.keys(data).filter(key => key.startsWith(data.service));

    serviceKeys.forEach(key => {
        details[key] = data[key];
    });

    return details;
}

function getPackageAmount(packageId) {
    // This would ideally fetch from Stripe
    // For now, parse from package name or return 0
    const packagePrices = {
        'tech-basic': 500,
        'tech-standard': 1500,
        'tech-advanced': 3000,
        'doc-resume': 150,
        'doc-cover': 75,
        'doc-bundle': 200,
        'credit-basic': 499,
        'credit-advanced': 899,
        'comp-diagnostic': 50,
        'comp-repair': 150,
        'comp-premium': 250,
        'wig-install': 100,
        'wig-custom': 500,
        'contour-single': 200,
        'contour-package': 850,
        'facial-basic': 75,
        'facial-deluxe': 150
    };

    return packagePrices[packageId] || 0;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = router;
