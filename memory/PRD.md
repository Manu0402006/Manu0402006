# Cynos – Product Requirements Document

## Original Problem Statement
Build a high-converting eCommerce site for an Indian dropshipping T-shirt brand "Cynos". Premium, minimal, modern, dark streetwear aesthetic (Nike / Supreme vibes). Target: Indian customers 18–35 into trendy, anime, attitude, and couple T-shirts. Mobile-first. Optimized for conversions, not just design.

## User Choices (captured)
- Storefront + Admin panel
- Mocked checkout for v1 (Razorpay later — keys not yet provided)
- Stock product images for now (user will upload later)
- WhatsApp number: 9810153152
- Accent color: design-agent decided → red `#FF3333` on near-black `#050505`
- Fonts: Anton (display) + Manrope (body) + JetBrains Mono (labels)

## Architecture
- **Backend**: FastAPI + Motor (MongoDB async). All routes prefixed `/api`. JWT (HS256) auth for admin only. Products + Orders + Users collections. Auto-seeds 1 admin + 8 products on first startup.
- **Frontend**: React 19 + Tailwind + Shadcn UI (rounded-none brutalist) + framer-motion + react-fast-marquee. Cart in localStorage. Admin auth token in localStorage.
- **Database**: MongoDB (`cynos_db`).

## What's Implemented (2026-02-27)
### Storefront
- Home page: hero ("WEAR YOUR ATTITUDE"), top offer marquee, 4-column trust badge row, bestsellers grid (8 products), bento-style category section (Men/Women/Couple/Oversized/Anime), Buy 2 Get 1 Free banner, customer reviews with photos, Instagram-style gallery, footer
- Shop page (`/shop`): category chips, size filter, max-price slider, sort (newest / best-selling / price asc/desc), responsive product grid
- Product detail (`/product/:slug`): image gallery + thumbnails, badge tags, urgency stock counter, countdown timer, price w/ discount %, size selector + Size Guide dialog, qty stepper, Add to Cart + Buy Now CTAs, trust badges, FAQ accordion, related products, sticky mobile Buy Now bar
- Cart drawer: B2G1 auto-discount applied client-side, qty +/-, remove, checkout
- Checkout (`/checkout`): guest, contact + address + UPI/COD/Card payment selector, CYNOS10 discount input, order summary with delivery estimate, places order to backend
- Order success (`/order/:id`): order summary, items, ETA
- Conversion features: WhatsApp floating button, exit-intent popup with `CYNOS10` copy, recent purchase social-proof toast

### Admin
- `/admin/login`: bcrypt + JWT (token in localStorage)
- `/admin`: stats (orders, pending, products, revenue), Orders table with status dropdown (pending/confirmed/shipped/delivered/cancelled), Products table (CRUD via dialog with name/description/price/stock/category/images/badges/bestseller flag)

### Backend APIs (all `/api/*`)
- `GET /products` (filters: category, size, sort, max_price, bestseller), `/products/bestsellers`, `/products/{slug}`
- `POST /orders` (guest, with B2G1 + CYNOS10 logic), `GET /orders/{id}`
- `POST /auth/login`, `GET /auth/me`
- Admin: `GET/POST/PUT/DELETE /admin/products`, `GET/PATCH /admin/orders/{id}`, `GET /admin/stats`

## Tests
- 22/22 pytest backend tests passed (`/app/backend/tests/backend_test.py`)
- 71/73 Playwright frontend checks passed (full happy-path E2E green)

## Backlog (P0 → P2)
- **P0** Razorpay integration once user provides test keys (UPI + Cards)
- **P1** Real product image upload via object-storage integration (so admin can replace placeholders)
- **P1** Customer order tracking page (look up by order ID + email)
- **P1** Email order confirmation (Resend / SendGrid)
- **P2** Wishlist + recently viewed
- **P2** Coupon code system (multiple codes, expiry, usage limits)
- **P2** Reviews submission tied to delivered orders
- **P2** SEO metadata + sitemap
- **P2** Returns / RMA workflow in admin

## Next Tasks
1. Collect Razorpay test key + secret → integrate live payments
2. Object-storage for admin product image uploads
3. Email confirmation on `POST /api/orders`
4. Marketing: integrate WhatsApp Business API for cart-abandonment recovery
