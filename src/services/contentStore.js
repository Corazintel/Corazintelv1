'use strict';

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTENT_PATH = path.join(DATA_DIR, 'content.json');

// Default content structure
const DEFAULT_CONTENT = {
    brand: {
        slogan: 'Real Solutions. Multifaceted Expertise.'
    },
    positioning: {
        statement: "Empowering your lifestyle and legacy. Professional solutions for Business, Credit, and Beauty."
    },
    hero: {
        headline: 'Welcome to Corazintel',
        subheadline: 'Your trusted partner for professional services',
        benefits: []
    },
    process: {
        steps: [
            { title: "Consultation", desc: "We start by understanding your unique goals and challenges." },
            { title: "Custom Strategy", desc: "We develop a tailored plan designed for your success." },
            { title: "Result & Support", desc: "We deliver high-quality results and ongoing support." }
        ]
    },
    branches: {
        documents: {
            title: "Professional Documents",
            desc: "LLC formation, career documents, and legal templates.",
            features: ["LLC Formation", "Resume Revamp", "Legal Contracts"],
            path: "/documents"
        },
        tech: {
            title: "Tech Services",
            desc: "Expert device repairs and cutting-edge digital design.",
            features: ["Hardware Repair", "Web Design", "Software Support"],
            path: "/tech-services"
        },
        credit: {
            title: "Credit Solutions",
            desc: "Comprehensive credit repair and financial guidance.",
            features: ["Credit Audit", "Dispute Management", "Financial Planning"],
            path: "/credit-solutions"
        },
        beauty: {
            title: "Beauty & Wellness",
            desc: "Luxury aesthetic treatments and skincare solutions.",
            features: ["Facials", "Body Contouring", "Custom Wigs"],
            path: "/beauty-wellness"
        }
    },
    bundles: [
        {
            name: "Starter Business Bundle",
            price: "Contact for Pricing",
            contactLink: "/order-intake?bundle=starter",
            features: ["LLC Formation", "Logo Design", "Credit Consultation"]
        }
    ],
    categoriesCopy: {
        career_docs: 'Professional resumes and documents',
        credit_finance: 'Credit repair and financial guidance',
        tech_support: 'Device fixes and technical help',
        beauty_wellness: 'Beauty treatments and wellness services',
        digital_products: 'Websites and digital solutions',
        branding_print: 'Branding and print materials'
    },
    testimonials: [],
    faq: [],
    footer: {
        note: 'Corazintel - Real Solutions. Multifaceted Expertise.'
    },
    contact: {
        email: 'contact@corazintel.com',
        phone: '(555) 123-4567',
        location: 'Your City, State'
    },
    social: {
        instagram: '',
        tiktok: '',
        youtube: ''
    }
};

/**
 * Ensure data directory and content.json exist
 * @returns {Promise<void>}
 */
async function ensureDataExists() {
    try {
        // Create data directory if it doesn't exist
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Check if content.json exists
        try {
            await fs.access(CONTENT_PATH);
        } catch (error) {
            // File doesn't exist, create it with default content
            await fs.writeFile(CONTENT_PATH, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf8');
            console.log('Created content.json file with default content');
        }
    } catch (error) {
        console.error('Error ensuring data exists:', error);
    }
}

/**
 * Read the content.json file
 * @returns {Promise<Object>} The parsed content object
 */
async function readContent() {
    await ensureDataExists();

    try {
        const data = await fs.readFile(CONTENT_PATH, 'utf8');
        const parsed = JSON.parse(data);
        // Shallow merge to ensure new top-level keys (branches, positioning, etc.) exist
        // if they differ from the file version.
        return { ...DEFAULT_CONTENT, ...parsed };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return default structure
            return DEFAULT_CONTENT;
        }
        throw error;
    }
}

/**
 * Write content to the content.json file
 * @param {Object} content - The content object to write
 * @returns {Promise<void>}
 */
async function writeContent(content) {
    await ensureDataExists();
    await fs.writeFile(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf8');
}

module.exports = {
    readContent,
    writeContent
};
