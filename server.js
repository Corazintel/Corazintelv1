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

app.use(session({
  name: 'corazintel.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use((req, res, next) => {
  res.locals.isAdmin = Boolean(req.session && req.session.isAdmin);
  next();
});

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

const adminRouter = require('./src/routes/admin');
app.use('/', adminRouter);

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
