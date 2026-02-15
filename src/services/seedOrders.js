'use strict';

const { createOrder } = require('./orderStore');

const CATEGORIES = ['Beauty', 'Credit Services', 'Web Development', 'Graphic Design', 'Document Creation'];
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const STATUSES = ['New', 'In Progress', 'Waiting on Client', 'Completed', 'Cancelled'];
const PAYMENT_STATUSES = ['Unpaid', 'Deposit Paid', 'Paid', 'Refunded'];

const SAMPLE_CUSTOMERS = [
    { name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '(555) 123-4567' },
    { name: 'Michael Chen', email: 'mchen@company.com', phone: '(555) 234-5678' },
    { name: 'Emily Rodriguez', email: 'emily.r@startup.io', phone: '(555) 345-6789' },
    { name: 'David Kim', email: 'dkim@business.com', phone: '(555) 456-7890' },
    { name: 'Jessica Martinez', email: 'jessica.m@corp.com', phone: '(555) 567-8901' },
    { name: 'Robert Taylor', email: 'rtaylor@email.com', phone: '(555) 678-9012' },
    { name: 'Amanda White', email: 'awhite@company.net', phone: '(555) 789-0123' },
    { name: 'James Brown', email: 'jbrown@business.org', phone: '(555) 890-1234' },
    { name: 'Lisa Garcia', email: 'lgarcia@email.com', phone: '(555) 901-2345' },
    { name: 'Christopher Lee', email: 'clee@startup.com', phone: '(555) 012-3456' }
];

const SUBJECTS_BY_CATEGORY = {
    'Beauty': [
        'Deep Cleanse Facial Package',
        'Body Contour Treatment - 6 Sessions',
        'Bridal Makeup & Hair',
        'Full Body Waxing Service',
        'Acne Treatment Program'
    ],
    'Credit Services': [
        'Credit Report Review & Dispute',
        'Credit Builder Program - 6 Months',
        'Debt Consolidation Consultation',
        'Credit Score Improvement Plan',
        'Identity Theft Resolution'
    ],
    'Web Development': [
        'E-commerce Website Build',
        'Portfolio Website Redesign',
        'WordPress Site Migration',
        'Custom Web Application',
        'Website Maintenance Package'
    ],
    'Graphic Design': [
        'Logo Design & Brand Identity',
        'Social Media Graphics Pack',
        'Business Card & Stationery',
        'Event Flyer Design',
        'Product Packaging Design'
    ],
    'Document Creation': [
        'Resume & Cover Letter',
        'Business Plan Document',
        'Legal Contract Template',
        'Grant Proposal Writing',
        'Employee Handbook Creation'
    ]
};

const TAGS_BY_CATEGORY = {
    'Beauty': ['skincare', 'bridal', 'treatment', 'package', 'consultation'],
    'Credit Services': ['urgent', 'consultation', 'monthly', 'review', 'dispute'],
    'Web Development': ['responsive', 'e-commerce', 'custom', 'wordpress', 'mobile'],
    'Graphic Design': ['logo', 'branding', 'print', 'digital', 'social-media'],
    'Document Creation': ['professional', 'legal', 'business', 'format', 'revision']
};

const DESCRIPTIONS = [
    'Client needs comprehensive service with quick turnaround. Discussed requirements in initial call.',
    'Returning client requesting similar service to previous order. Has specific brand requirements.',
    'New client referred by existing customer. Looking for premium quality work.',
    'Rush order needed for upcoming event. Client willing to pay expedited fee.',
    'Standard service request. Client provided detailed specifications and examples.',
    'Custom project requiring multiple revisions. Client very particular about details.',
    'Package deal including multiple services. Discussed timeline and deliverables.',
    'Follow-up service from previous project. Client satisfied with past work.',
    'Complex project requiring specialized expertise. Extended timeline agreed upon.',
    'Standard request with some customization. Client flexible on delivery date.'
];

/**
 * Generate sample orders for testing
 * @param {number} count - Number of orders to generate
 * @returns {Promise<Array>} Created orders
 */
async function seedOrders(count = 20) {
    const orders = [];

    for (let i = 0; i < count; i++) {
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const customer = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
        const subjects = SUBJECTS_BY_CATEGORY[category];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const tags = TAGS_BY_CATEGORY[category];

        // Randomize dates (last 30 days)
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        // Some orders have due dates
        let dueDate = null;
        if (Math.random() > 0.3) {
            const dueDateObj = new Date(createdAt);
            dueDateObj.setDate(dueDateObj.getDate() + Math.floor(Math.random() * 14) + 3);
            dueDate = dueDateObj.toISOString().split('T')[0];
        }

        const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        const paymentStatus = PAYMENT_STATUSES[Math.floor(Math.random() * PAYMENT_STATUSES.length)];

        // Higher priority orders more likely to be assigned
        const assignedTo = (priority === 'P0' || priority === 'P1' || Math.random() > 0.5)
            ? ['Sarah', 'Mike', 'Alex', 'Jordan'][Math.floor(Math.random() * 4)]
            : null;

        const orderData = {
            customer,
            category,
            priority,
            status,
            subject,
            description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
            dueDate,
            tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
            assignedTo,
            paymentStatus,
            amount: Math.floor(Math.random() * 2000) + 100,
            attachments: [],
            internalNotes: '',
            activityLog: [{
                at: createdAt.toISOString(),
                type: 'created',
                text: 'Order created'
            }],
            lastMessageAt: Math.random() > 0.5 ? createdAt.toISOString() : null
        };

        // Add some activity
        if (status !== 'New') {
            const activityDate = new Date(createdAt);
            activityDate.setHours(activityDate.getHours() + Math.floor(Math.random() * 48));
            orderData.activityLog.push({
                at: activityDate.toISOString(),
                type: 'status_change',
                text: `Status changed to ${status}`
            });
        }

        const order = await createOrder(orderData);

        // Override createdAt to match our randomized date
        order.createdAt = createdAt.toISOString();
        orders.push(order);
    }

    return orders;
}

module.exports = { seedOrders };
