'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { readContent, writeContent } = require('../services/contentStore');

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

function getAdminUser() {
  return process.env.ADMIN_USER || 'admin';
}

async function verifyPassword(plain, expectedPlain) {
  // Allow env to be either plain or bcrypt hash
  if (String(expectedPlain || '').startsWith('$2')) {
    return bcrypt.compare(String(plain || ''), String(expectedPlain));
  }
  const hash = await bcrypt.hash(String(expectedPlain || ''), 10);
  return bcrypt.compare(String(plain || ''), hash);
}

// Diagnostic endpoint (remove after debugging)
router.get('/admin/debug', (req, res) => {
  res.json({
    adminUserSet: !!process.env.ADMIN_USER,
    adminUserValue: process.env.ADMIN_USER || 'NOT SET',
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    adminPasswordLength: process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0,
    sessionSecretSet: !!process.env.SESSION_SECRET,
    sessionSecretLength: process.env.SESSION_SECRET ? process.env.SESSION_SECRET.length : 0,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

router.get('/admin/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login', error: '' });
});

router.post('/admin/login', async (req, res) => {
  const user = String(req.body.user || '').trim();
  const pass = String(req.body.pass || '').trim();

  const expectedUser = getAdminUser();
  const expectedPass = process.env.ADMIN_PASSWORD || '1125';

  console.log('Login attempt:', {
    providedUser: user,
    expectedUser: expectedUser,
    userMatch: user === expectedUser,
    hasPassword: !!pass,
    hasSessionSecret: !!process.env.SESSION_SECRET
  });

  if (user !== expectedUser) {
    console.log('Login failed: Username mismatch');
    return res.status(401).render('admin/login', { title: 'Admin Login', error: 'Wrong login.' });
  }

  const ok = await verifyPassword(pass, expectedPass);
  if (!ok) {
    console.log('Login failed: Password mismatch');
    return res.status(401).render('admin/login', { title: 'Admin Login', error: 'Wrong login.' });
  }

  req.session.isAdmin = true;
  req.session.adminUser = expectedUser;

  console.log('Login successful, redirecting to /admin');

  return res.redirect('/admin');
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/admin', requireAdmin, async (req, res) => {
  const content = await readContent();
  res.render('admin/dashboard', { title: 'Admin', content, saved: req.query.saved === '1' });
});

router.post('/admin/content', requireAdmin, async (req, res) => {
  const current = await readContent();

  const next = {
    ...current,
    brand: {
      ...current.brand,
      slogan: String(req.body.brand_slogan || '').trim()
    },
    hero: {
      headline: String(req.body.hero_headline || '').trim(),
      subheadline: String(req.body.hero_subheadline || '').trim(),
      benefits: [
        String(req.body.benefit_1 || '').trim(),
        String(req.body.benefit_2 || '').trim(),
        String(req.body.benefit_3 || '').trim(),
        String(req.body.benefit_4 || '').trim(),
        String(req.body.benefit_5 || '').trim(),
        String(req.body.benefit_6 || '').trim(),
        String(req.body.benefit_7 || '').trim(),
        String(req.body.benefit_8 || '').trim()
      ].filter(Boolean)
    },
    categoriesCopy: {
      career_docs: String(req.body.cat_career_docs || '').trim(),
      credit_finance: String(req.body.cat_credit_finance || '').trim(),
      tech_support: String(req.body.cat_tech_support || '').trim(),
      beauty_wellness: String(req.body.cat_beauty_wellness || '').trim(),
      digital_products: String(req.body.cat_digital_products || '').trim(),
      branding_print: String(req.body.cat_branding_print || '').trim()
    },
    testimonials: [
      {
        quote: String(req.body.t1_quote || '').trim(),
        text: String(req.body.t1_text || '').trim(),
        by: String(req.body.t1_by || '').trim()
      },
      {
        quote: String(req.body.t2_quote || '').trim(),
        text: String(req.body.t2_text || '').trim(),
        by: String(req.body.t2_by || '').trim()
      },
      {
        quote: String(req.body.t3_quote || '').trim(),
        text: String(req.body.t3_text || '').trim(),
        by: String(req.body.t3_by || '').trim()
      }
    ],
    faq: [
      { q: String(req.body.f1_q || '').trim(), a: String(req.body.f1_a || '').trim() },
      { q: String(req.body.f2_q || '').trim(), a: String(req.body.f2_a || '').trim() },
      { q: String(req.body.f3_q || '').trim(), a: String(req.body.f3_a || '').trim() },
      { q: String(req.body.f4_q || '').trim(), a: String(req.body.f4_a || '').trim() }
    ].filter(x => x.q && x.a),
    contact: {
      email: String(req.body.contact_email || '').trim(),
      phone: String(req.body.contact_phone || '').trim(),
      location: String(req.body.contact_location || '').trim()
    },
    social: {
      instagram: String(req.body.social_instagram || '').trim(),
      tiktok: String(req.body.social_tiktok || '').trim(),
      youtube: String(req.body.social_youtube || '').trim()
    },
    footer: {
      note: String(req.body.footer_note || '').trim()
    }
  };

  await writeContent(next);
  return res.redirect('/admin?saved=1');
});

module.exports = router;
