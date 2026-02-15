# Corazintel

Node.js + Express + EJS site with an Admin CMS. Site content is stored in `src/data/content.json` and can be edited from the admin panel (no database).

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set SESSION_SECRET; for production set ADMIN_USER and ADMIN_PASSWORD
```

## Run

```bash
npm start
```

- **Home:** http://localhost:3000  
- **Admin login:** http://localhost:3000/admin/login  
- **Admin dashboard:** http://localhost:3000/admin (after login)

## Credentials

- **Local dev:** Defaults are `admin` / `1125` when `ADMIN_USER` and `ADMIN_PASSWORD` are not set.  
- **Production:** Set `ADMIN_USER`, `ADMIN_PASSWORD`, and `SESSION_SECRET` in your hosting environment (e.g. Hostinger Node app env vars). You can set `ADMIN_PASSWORD` to a bcrypt hash (starts with `$2`) for extra security.

## Content

Editable content lives in `src/data/content.json`. Changes made in the admin dashboard are written there (atomic write). The homepage hero, categories, testimonials, FAQ, footer, contact, and social links all read from this file.
# Corazintelv1
