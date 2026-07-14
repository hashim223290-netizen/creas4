# Crease Edits

Full-stack e-commerce site — static HTML/CSS/JS storefront and admin panel,
served by a single Express backend with a JSON-file database (no external
database required).

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000 (or the `PORT` you set).

## Admin login

Open `/admin-login.html` and sign in with:

- **Email:** `admin@creaseedits.pk`
- **Password:** `cre@seEdits2026`

From the admin dashboard you can add/edit/delete products (with image
upload), review incoming orders and update their fulfilment status, and see
store stats (revenue, low stock, customers).

## Configuration

Copy `.env.example` to `.env` (or otherwise set these as real environment
variables) before running anywhere shared:

- `SESSION_SECRET` — signs the session cookie. A dev default is used if this
  is unset, which is fine locally but must be overridden anywhere else.
- `PORT` — defaults to `3000`.

## How it's put together

- `server.js` — Express app: mounts the API under `/shop-api/*`, serves the
  static frontend from the project root, and serves uploaded product images
  from `/uploads`.
- `routes/` — one file per API resource (`auth`, `products`, `orders`,
  `reviews`, `admin`, `contact`, `upload`).
- `middleware/` — `auth.js` (session-based `requireAuth` / `requireAdmin`
  guards) and `validate.js` (small request-validation helpers).
- `utils/db.js` — reads/writes the JSON files in `data/` and queues writes
  per file so concurrent requests can't corrupt a file.
- `utils/hash.js` — password hashing (Node's built-in `crypto.scrypt`, no
  external dependency).
- `data/*.json` — the "database": `products`, `users`, `orders`, `reviews`,
  `contact-messages`, `newsletter`, `settings`.
- `js/api.js` — the frontend's fetch wrapper; every page calls the backend
  through this instead of touching `fetch` directly.
- `uploads/` — product images uploaded from the admin dashboard land here
  and are served statically.

## API overview

All endpoints are under `/shop-api`. Session cookies (not tokens) carry
auth state, so the frontend always calls `fetch` with `credentials: "include"`.

| Method | Path                        | Auth        | Purpose                          |
| ------ | --------------------------- | ----------- | --------------------------------- |
| GET    | `/products`                 | —           | List/search/filter/sort products  |
| GET    | `/products/:id`             | —           | Product detail                    |
| POST   | `/products`                 | admin       | Create product                    |
| PUT    | `/products/:id`             | admin       | Update product                    |
| DELETE | `/products/:id`             | admin       | Delete product                    |
| POST   | `/auth/register`            | —           | Create a customer account         |
| POST   | `/auth/login`                | —           | Sign in                           |
| POST   | `/auth/logout`               | —           | Sign out                          |
| GET    | `/auth/me`                   | customer    | Current account                   |
| POST   | `/orders`                    | — (guest ok)| Place an order                    |
| GET    | `/orders`                    | customer    | Own orders (all orders for admin) |
| GET    | `/orders/:id`                | customer    | Order detail                      |
| PUT    | `/orders/:id/status`         | admin       | Update fulfilment status          |
| GET    | `/reviews/:productId`        | —           | List reviews for a product        |
| POST   | `/reviews/:productId`        | customer    | Add a review                      |
| POST   | `/upload`                    | admin       | Upload a product image (base64)   |
| POST   | `/admin/login`               | —           | Admin sign-in                     |
| POST   | `/admin/logout`              | —           | Admin sign-out                    |
| GET    | `/admin/session`             | —           | Check admin session                |
| GET    | `/admin/stats`               | admin       | Dashboard stats                   |
| POST   | `/contact`                   | —           | Contact form                      |
| POST   | `/contact/newsletter`        | —           | Newsletter signup                 |
| GET    | `/health`                    | —           | Health check                      |

## Notes / known limits

- The "database" is JSON files on disk, as specified in the original brief.
  It's fine for a demo or small store, but has no transactions and won't
  scale past one server process — swap in a real database if this grows.
- Sessions are stored in memory (`express-session`'s default store), so they
  reset whenever the server restarts, and won't work across multiple server
  instances. Swap in `connect-redis`/`connect-pg-simple`/etc. before running
  more than one process.
- There's no payment gateway wired in — `paymentMethod` on an order is just a
  label; checkout does not charge a card.
