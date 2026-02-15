'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { readContent } = require('./src/services/contentStore');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust Render's proxy for secure cookies
app.set('trust proxy', 1);

app.use(session({
  name: 'corazintel.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  res.locals.isAdmin = Boolean(req.session && req.session.isAdmin);
  next();
});

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
  let content = null;
  try {
    content = await readContent();
  } catch (e) {
    content = null;
  }

  res.locals.content = content;
  res.locals.brand = {
    name: process.env.BRAND_NAME || 'Corazintel',
    slogan: (content && content.brand && content.brand.slogan) || (process.env.BRAND_SLOGAN || 'Real Solutions. Multifaceted Expertise.'),
    primaryCta: 'Buy Service'
  };
  res.locals.currentPath = req.path;
  next();
});

// Routes
const adminRouter = require('./src/routes/admin');
const ordersRouter = require('./src/routes/orders');
const stripeRouter = require('./src/routes/stripe');

// Stripe webhook must be before express.json() middleware
app.use('/webhooks/stripe', stripeRouter);

app.use('/', adminRouter);
app.use('/', ordersRouter);

// Admin Orders Page route
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

app.get('/admin/orders', requireAdmin, (req, res) => {
  res.render('admin/orders', { title: 'Orders Management', layout: false });
});

// Homepage: categories with keys matching content.json
const CATEGORY_KEYS = [
  { key: 'career_docs', label: 'Career & Documents', description: 'Resumes, cover letters, and professional documents.' },
  { key: 'credit_finance', label: 'Credit & Finance Support', description: 'Credit repair and finance guidance.' },
  { key: 'tech_support', label: 'Tech Support', description: 'Device fixes and setup help.' },
  { key: 'beauty_wellness', label: 'Beauty & Wellness', description: 'Facials, body contour, wellness services.' },
  { key: 'digital_products', label: 'Digital Products', description: 'Websites and apps.' },
  { key: 'branding_print', label: 'Branding & Print', description: 'Logos, flyers, print-ready assets.' }
];

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    categories: CATEGORY_KEYS
  });
});

app.listen(PORT, () => {
  console.log(`Corazintel running at http://localhost:${PORT}`);
});
