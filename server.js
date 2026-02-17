'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { readContent } = require('./src/services/contentStore');

// Database Connection
const { connectDB } = require('./src/config/database');
connectDB(); // Attempt to connect to MongoDB

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
const intakeRouter = require('./src/routes/intake');

// Stripe webhook must be before express.json() middleware
app.use('/webhooks/stripe', stripeRouter);

app.use('/', adminRouter);
app.use('/', ordersRouter);
app.use('/', intakeRouter);

// Order confirmation page
const { getOrderById } = require('./src/services/orderStore');

app.get('/order-confirmation/:orderId', async (req, res) => {
  try {
    const order = await getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }
    res.render('order-confirmation', {
      title: 'Order Confirmed',
      order,
      brand: res.locals.brand
    });
  } catch (error) {
    console.error('Error loading confirmation:', error);
    res.status(500).send('Error loading confirmation page');
  }
});

// Branch Pages
app.get('/documents', (req, res) => {
  const content = res.locals.content || {};
  const branchData = (content.branches && content.branches.documents) || {};
  res.render('service', {
    title: 'Documents & Legal - Corazintel',
    service: branchData,
    type: 'documents',
    bundle: content.bundles ? content.bundles[0] : null
  });
});

app.get('/tech-services', (req, res) => {
  const content = res.locals.content || {};
  const branchData = (content.branches && content.branches.tech) || {};
  res.render('service', {
    title: 'Tech Services - Corazintel',
    service: branchData,
    type: 'tech',
    bundle: content.bundles ? content.bundles[0] : null
  });
});

app.get('/credit-solutions', (req, res) => {
  const content = res.locals.content || {};
  const branchData = (content.branches && content.branches.credit) || {};
  res.render('service', {
    title: 'Credit Solutions - Corazintel',
    service: branchData,
    type: 'credit',
    bundle: content.bundles ? content.bundles[0] : null
  });
});

app.get('/beauty-wellness', (req, res) => {
  const content = res.locals.content || {};
  const branchData = (content.branches && content.branches.beauty) || {};
  res.render('service', {
    title: 'Beauty & Wellness - Corazintel',
    service: branchData,
    type: 'beauty',
    bundle: content.bundles ? content.bundles[0] : null
  });
});

// Admin Authentication Middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

// Admin Routes
app.get('/admin/orders', requireAdmin, (req, res) => {
  res.render('admin/orders', { title: 'Orders Management', layout: false });
});

// Homepage
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home - Corazintel',
    // ... any other data
  });
});

app.listen(PORT, () => {
  console.log(`Corazintel running at http://localhost:${PORT}`);
});
