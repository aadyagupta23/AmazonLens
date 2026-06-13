# Amazon Lens

Amazon.in clone with built-in purchase intelligence. Surfaces the data Amazon already has — price history, trust scoring, and real-owner insights — natively inside the standard shopping flow.

Built for **Amazon HackOn Season 6**.

---

## What It Is

Standard Amazon shopping flow (Homepage → Search → Product → Cart), with three features layered on top:

**TrustLens™** — On every product page: a 12-month price history chart that proves whether a "90% off" deal is real, a colour-coded trust score (0–100), a fake discount alert, and a buy-now-or-wait recommendation backed by historical data. Click the info icon next to any trust score to open the **TrustCard** — a breakdown across 5 dimensions: Review Authenticity, Return Rate, Warranty Claims, Seller Reliability, and Price Stability.

**WitnessPanel™** — Chat with AI personas of verified owners. Not reviews, not customer service — actual people who own the product, responding in character with city-specific context (Bengaluru hard water, Mumbai humidity). Powered by Groq (llama3-70b).

**Amazon Sense™** — Predicts when you're about to run out of regularly-ordered items. Shows as a popup on the homepage and a "Soon" tab in the cart.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide |
| Backend | Express.js, Node.js |
| Database | MongoDB + Mongoose |
| Auth | bcryptjs + JWT (stored in localStorage) |
| AI | Groq SDK (llama3-70b-8192) |

---

## Prerequisites

- Node.js 18+
- MongoDB running locally

```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Or run directly
mongod --dbpath /usr/local/var/mongodb
```

---

## Setup

```bash
# 1. Clone and install all dependencies
git clone <repo-url>
cd amazon-lens
npm run install:all

# 2. The server env file is already configured at server/.env
#    If you need to change anything, edit server/.env:
#    PORT, MONGODB_URI, JWT_SECRET, GROQ_API_KEY

# 3. Start both client and server
npm run dev
```

- Client → http://localhost:5173
- Server → http://localhost:5001
- Health check → http://localhost:5001/api/health

---

## Environment

Only `server/.env` is loaded at runtime. The file is already set up:

```
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/amazon-lens
JWT_SECRET=amazon_lens_hackathon_secret_2024
GROQ_API_KEY=<your-groq-key>
CLIENT_URL=http://localhost:5173
```

Get a free Groq API key at [console.groq.com](https://console.groq.com) if you need a new one. WitnessPanel falls back to pre-written responses if no key is set.

---

## Demo Path

The full judge-facing flow in order:

### 1. Homepage
- Products load in two sections: Deal of the Day and Recommended for You
- After 3 seconds, the **Amazon Sense™ popup** slides up in the bottom-right — Nescafé is due for reorder
- Click **"Try it on Sony TV →"** in the TrustLens banner to jump straight to the product page

### 2. Search
Type `home theatre setup under 40000` in the search bar and press Enter.

- A **Bundle Card** appears at the top: Sony TV + JBL Soundbar + Fire TV Stick bundled with total savings
- Individual products show below with TrustLens badges on each card

### 3. Product Page — Sony Bravia 55" 4K TV (`/dp/p001`)
This is where TrustLens lives. Everything fires on this page:

| What you see | What it means |
|---|---|
| Orange **71/100** trust badge | Mixed — some concerns detected |
| Red **"Fake Discount Detected"** banner | Price has been "discounted" for 10 of the last 12 months |
| Orange **"Consider Waiting"** box | Prime Day in 8 days — historically drops 18–22% |
| **12-month price history chart** | Red spike zones at Jan, Feb, Apr, Aug — inflated MRP months |
| **Suspicious Reviews** section | 2 bot-pattern reviews flagged and collapsed by default |

### 4. WitnessPanel
Scroll down to WitnessPanel™ on the Sony TV page.

- Three owner cards: Arjun M. (Bengaluru, 8 months), Priya S. (Mumbai, 14 months), Rahul K. (Delhi, 6 months)
- Click **Chat** on any card
- Use the quick-question buttons or type your own question
- Try: *"how does it handle hard water?"* — Arjun will reference Bengaluru water quality specifically

### 5. Cart
- Add the Sony TV to cart from the product page
- Cart badge in the navbar updates
- Open the cart — item shows with its TrustLens score badge
- Click the **"Soon"** tab — Nescafé appears as "Due today" with a working Reorder button

### 6. Auth
- Go to `/signup` — create an account with name, email, password
- User is saved to MongoDB with a hashed password
- Log out and sign back in at `/login`
- If not logged in, the app defaults to demo user "Arjun Kumar" so the demo path never breaks

---

## API Reference

All endpoints are served from `http://localhost:5001`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status check |
| GET | `/api/products` | All products (optional `?category=` `?limit=`) |
| GET | `/api/products/:id` | Single product by ID |
| POST | `/api/products/search` | Search with bundle detection — body: `{ query }` |
| GET | `/api/witness/:productId` | Owner personas for a product |
| POST | `/api/witness/chat` | Groq chat — body: `{ productId, witnessId, message, history }` |
| GET | `/api/sense/predictions` | Reorder predictions sorted by urgency |
| POST | `/api/auth/signup` | Create account — body: `{ name, email, password }` |
| POST | `/api/auth/login` | Sign in — body: `{ email, password }` |

### Quick curl tests

```bash
# Health
curl http://localhost:5001/api/health

# All products
curl http://localhost:5001/api/products | python3 -m json.tool

# Sony TV (TrustLens data)
curl http://localhost:5001/api/products/p001 | python3 -m json.tool

# Bundle detection
curl -X POST http://localhost:5001/api/products/search \
  -H "Content-Type: application/json" \
  -d '{"query":"home theatre setup under 40000"}'

# Sense predictions
curl http://localhost:5001/api/sense/predictions

# Signup
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## Product IDs

| ID | Product | Trust Score |
|---|---|---|
| p001 | Sony Bravia 55" 4K TV | 71 — Mixed (fake discount) |
| p002 | JBL Cinema SB271 Soundbar | 83 — Genuine |
| p003 | Apple iPhone 15 128GB | 91 — Genuine |
| p004 | boAt Airdopes 141 Earbuds | 48 — Suspicious |
| p005 | Nescafé Gold Blend 200g | 88 — Genuine |
| p006 | Samsung 43" Crystal 4K TV | 79 — Genuine |
| p007 | Prestige Pressure Cooker 5L | 86 — Genuine |
| p008 | Fire TV Stick 4K Max | 92 — Genuine |

---

## Product Catalogue

236 products across all categories, sourced from two live APIs fetched at server startup:

| Source | Products | Categories |
|---|---|---|
| [DummyJSON](https://dummyjson.com/products) | ~190 | Electronics, Fashion, Home & Kitchen, Grocery, Sports, Beauty |
| [Open Library](https://openlibrary.org/developers/api) | ~44 | Books (Fiction, Mystery, Romance, Sci-Fi, Self Help, Biography, Business, Fantasy, Children's) |
| Mock data | 8 | Hand-crafted with full TrustLens breakdowns (Sony TV, iPhone, etc.) |

Books use real cover art from `covers.openlibrary.org`. All products have seeded-consistent TrustLens data (same score on every restart).

---

## Known Limitations

- Filter checkboxes in search results are UI-only (don't actually filter)
- Cart and orders don't persist to the backend
- Checkout flow is not implemented — "Proceed to Buy" redirects to login
- WitnessPanel personas only exist for p001 (Sony TV)
- Books and DummyJSON products use generated TrustLens data — only the 8 mock products have hand-written breakdown details
