# Amazon Lens — System Architecture

**Document Type:** Product Requirements Document — System Architecture  
**Project:** Amazon Lens  
**Version:** 1.0  
**Date:** June 2026

---

## 1. Overview

Amazon Lens is a full-stack e-commerce intelligence platform that layers trust scoring, behavioral personalization, AI-driven recommendations, and real-time owner interaction on top of a simulated Amazon-like storefront. The system is built as a **monorepo** with a React SPA frontend and an Express.js API backend communicating via REST and WebSockets.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3.3, React Router v6 |
| Backend | Node.js, Express.js 4.18 |
| Database | MongoDB 7 (Mongoose ODM) |
| Real-Time | Socket.IO 4.8 |
| AI / LLM | Groq API — `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` |
| Auth | JWT (bcryptjs, 7-day expiry, stored in localStorage) |
| External APIs | Groq, Open Library API, DummyJSON (static) |
| Charts | Recharts 2.10 |
| Build Tooling | Vite 5 (client), nodemon (server), concurrently (root) |

---

## 3. Repository Structure

```
amazon-lens/
├── client/                    # React 18 + Vite SPA (port 5173)
│   └── src/
│       ├── pages/             # 19 route pages
│       ├── components/        # Reusable UI components
│       ├── contexts/          # 11 Context API state stores
│       └── utils/             # format helpers, socket client
├── server/                    # Express.js backend (port 5001)
│   ├── routes/                # 10 API route modules
│   ├── models/                # Mongoose schemas (User, DnaProfile)
│   ├── middleware/            # JWT auth middleware
│   ├── utils/                 # Groq client, trust formula
│   └── data/                  # Static mock data (products, companies)
├── scripts/                   # Utility / seeding scripts
├── docs/                      # Documentation
└── package.json               # Root monorepo (concurrently)
```

**Start command:** `npm run dev` launches both client (5173) and server (5001) in parallel.

---

## 4. Frontend Architecture

### 4.1 State Management

All shared state is managed via 11 React Context APIs — no Redux or external state library.

| Context | Storage | Purpose |
|---|---|---|
| AuthContext | localStorage | JWT session, user identity |
| CartContext | localStorage | Cart items (not synced to DB) |
| OrdersContext | localStorage | Order history |
| WishlistContext | localStorage | Saved items |
| SenseContext | API + localStorage | DNA reorder predictions |
| DnaContext | API | Behavioral event tracking |
| WitnessContext | Socket.IO | Live owner chat state |
| CoPlannerContext | Socket.IO | Shared list real-time updates |
| SustainabilityContext | memory | Eco mode toggle, rankings |
| ReviewsContext | API | User review submissions |
| HistoryContext | localStorage | Browsing history |

### 4.2 Pages (19 Routes)

| Route | Purpose |
|---|---|
| `/` | Homepage — deals, Sense popup, bundle recommendations |
| `/s` | Search results with bundle detection |
| `/dp/:productId` | Product page — TrustLens, WitnessPanel, price history |
| `/cart` | Cart with Sense Soon reorder tab |
| `/checkout` | Order placement (stub) |
| `/orders` | Order history + returns initiation |
| `/wishlist` | Saved items |
| `/bundles` | Curated and AI-generated bundles |
| `/bundles/:bundleId` | Bundle detail with add-to-cart |
| `/co-planner` | Shared shopping list (real-time via Socket.IO) |
| `/sustainability` | Eco profile and company eco rankings |
| `/smart-search` | Natural language search with Groq AI |
| `/account` | User profile and settings |
| `/witness` | Owner chat portal (live witness mode) |
| `/my-reviews` | User-submitted reviews |
| `/returns` | AI-powered return swap suggestions |
| `/history` | Browsing history |
| `/login`, `/signup` | Authentication pages |

### 4.3 Key Components

- **ProductCard** — Displays TrustLens badge, price, eco label, Sense match score
- **TrustCard** — Expandable 5-dimension trust breakdown modal
- **WitnessPanel** — Live owner list with real-time chat buttons
- **SenseMatchPanel** — Personalized match score (80+ = recommended)
- **SensePopup** — Reorder prediction popup (3s delay on homepage)
- **BundleCard** — Bundle with AI-generated confidence score and reason
- **AmazonLensAssistant** — AI chat sidebar (Groq-powered)

### 4.4 Proxy Configuration (Vite)

```
/api/*         →  http://localhost:5001  (REST)
/socket.io/*   →  http://localhost:5001  (WebSocket upgrade)
```

---

## 5. Backend Architecture

### 5.1 API Modules (10 Route Files, prefix `/api`)

| Module | Key Endpoints | Purpose |
|---|---|---|
| `auth.js` | `POST /signup`, `POST /login` | User registration + JWT issuance |
| `products.js` | `GET /products`, `GET /products/:id`, `POST /products/search` | Product catalog, search, bundle detection |
| `sense.js` | 10 endpoints | DNA profiling, reorder predictions, risk scoring, match-AI |
| `witness.js` | `GET /witness/:id`, `POST /witness/chat` | Owner personas + Groq AI chat fallback |
| `bundles.js` | `GET /bundles`, `POST /bundles/ai` | Curated + Groq AI-generated bundles |
| `companies.js` | 6 endpoints | Seller profiles, eco scoring, refresh metrics |
| `coPlanner.js` | 8 endpoints | Shared plans, roles, expense splitting, invites |
| `smartSearch.js` | `POST /smart-search` | NL query + Groq intent classification |
| `returns.js` | `POST /returns/suggestions` | AI-powered return swap suggestions |
| `dna.js` | `POST /dna/event`, `GET /dna/profile` | DNA profile CRUD |

**Health check:** `GET /api/health` → `{ status: "ok" }`

### 5.2 Real-Time Events (Socket.IO)

**Witness channel:**

| Event | Direction | Purpose |
|---|---|---|
| `witness:online` | client → server | Register owner as live for a product |
| `witness:offline` | client → server | Unregister owner |
| `witnesses:subscribe` | client → server | Buyer watches witness list for a product |
| `witnesses:updated` | server → client | Broadcast when witnesses come/go |
| `chat:request` | client → server | Buyer initiates chat |
| `chat:accept` / `chat:decline` | client → server | Witness responds |
| `chat:message` | bidirectional | In-session message |
| `chat:end` | bidirectional | Close chat |
| `chat:timeout` | server → client | Auto-timeout after 30 seconds |

**Co-Planner channel:**

| Event | Direction | Purpose |
|---|---|---|
| `coplan:join` | client → server | Subscribe to plan room |
| `coplan:leave` | client → server | Unsubscribe from plan room |
| `plan:updated` | server → client | Broadcast item changes to all members |

### 5.3 Middleware

- **authMiddleware.js** — Soft JWT validation; invalid/missing tokens proceed as guest
- **cors()** — All origins allowed (local dev)
- **express.json()** — JSON body parsing

---

## 6. Database Architecture

**Engine:** MongoDB (local — `mongodb://127.0.0.1:27017/amazon-lens`)

### 6.1 Collections

**`users`**

| Field | Type | Notes |
|---|---|---|
| name | String | Required |
| email | String | Unique, lowercase |
| password | String | bcrypt-hashed, 10 rounds |
| timestamps | Date | createdAt, updatedAt |

**`dnaprofiles`**

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | Ref → User (logged-in) |
| guestId | String | UUID (anonymous) |
| events | Array | Capped at 200 entries |
| preferredBrands | Array | `[{brand, score}]` |
| preferredCategories | Array | `[{category, score}]` |
| budgetRange | Object | `{min, max, avg}` |
| sustainabilityAffinity | Number | 0.0–1.0 |
| returnPatterns | Array | Per-category return rates |
| returnedProductIds | Array | Product IDs of returned items |
| purchasedProductIds | Array | Product IDs of purchases |

### 6.2 File-Based Storage

| File | Contents |
|---|---|
| `coplanner-plans.json` | All co-planner plan data (persistent) |
| `coplanner-invites.json` | Invite tokens, expiry (7-day default) |

### 6.3 Client-Side Only (localStorage)

Cart, orders, wishlist, and browsing history are stored in the browser and are not synced to MongoDB.

---

## 7. External Integrations

| Service | Model / Endpoint | Used For |
|---|---|---|
| **Groq API** | `llama-3.3-70b-versatile` | Bundle generation, review analysis, fake review detection |
| **Groq API** | `llama-3.1-8b-instant` | Smart search intent, witness chat, return suggestions, match-AI |
| **Open Library API** | `openlibrary.org/subjects/{slug}.json` | Live book catalog (fetched once at server startup) |
| **DummyJSON** | Static import (`djProducts.js`) | Expanded product catalog beyond Amazon Lens native products |

**Groq fallback:** All Groq-dependent routes return hardcoded responses if the API is unavailable or rate-limited. Rate limit: `llama-3.1-8b-instant` — 500k tokens/day.

---

## 8. Core Business Logic

### 8.1 TrustLens™ Score Formula

```
Score = round((0.50 × Rs + 0.30 × Kp + 0.20 × Ri) × 100)

  Rs  =  Review Score   =  (avgRating − 1) / 4          [0–1]
  Kp  =  Keep Rate      =  1 − returnRate               [0–1]
  Ri  =  Reorder Index  =  sellerRating / 4             [0–1]

User return penalty:  −2 pts per return (max −30 pts)
Final score:          max(5, min(98, score − penalty))

Status thresholds:
  ≥ 75  →  VERIFIED  (green badge)
  50–74 →  TRUSTED   (blue badge)
  < 50  →  no badge
```

### 8.2 Eco Score Formula

```
baseScore  =  carbon(25%) + renewable(20%) + recyclable(20%)
            + supply_chain(20%) + longevity(15%)
ecoScore   =  round(min(99, baseScore + min(10, certCount × 2.5)))

Labels:
  ≥ 90  →  Climate Leader  (dark green)
  ≥ 80  →  Eco Advanced    (green)
  ≥ 70  →  Eco Conscious   (teal)
  ≥ 60  →  Eco Aware       (light green)
  ≥ 50  →  Progressing     (yellow)
  ≥ 40  →  Developing      (orange)
  < 40  →  Early Stage     (gray)
```

### 8.3 Fake Discount Detection

A product is flagged as a fake discount if the listed MRP exceeds the actual sale price in 8 or more of the past 12 months of price history.

### 8.4 Bundle Complement Rules

| Trigger Category | Suggested Complements |
|---|---|
| Coffee | Kitchen appliances (kettle, induction, cooker) |
| TV | Audio (soundbar) + Streaming (Fire Stick) |
| Phone | Audio (earbuds) + Accessories (power bank, USB hub) |
| Gaming | Keyboard, Mouse, Monitor, Desk Mat |
| Office | Lamp, Webcam, Cable management, USB hub |

---

## 9. Key Data Flows

### 9.1 Product Page Load

```
Client visits /dp/p001
  ├── GET  /api/products/p001              product metadata
  ├── POST /api/sense/seller-trust         TrustLens score breakdown
  ├── GET  /api/witness/p001               owner personas
  ├── GET  /api/sense/risk/p001            purchase risk flags
  ├── POST /api/sense/match-ai             personalized match score (logged-in users)
  └── socket.emit("witnesses:subscribe")   live owner availability (Socket.IO)
```

### 9.2 Smart Search (NL Query)

```
Client: POST /api/smart-search { query: "home theatre setup under 40000" }
  ↓
smartSearch.js:
  1. Call Groq llama-3.1-8b to classify intent → { type, keywords, priceMax, category }
  2. If type = "bundle": detect bundle keyword → return bundle + component products
  3. Else: score all products by name / brand / category match, return top results

Response: { type: "product"|"bundle", products: [...], bundleProducts?: [...] }
```

### 9.3 AI Bundle Generation

```
Client: POST /api/bundles/ai { recentOrder, olderOrders, allPurchasedIds, history }
  ↓
bundles.js:
  1. Build prompt with recent order + full catalog + category complement rules
  2. Call Groq llama-3.1-8b (max_tokens: 900, temp: 0.2)
  3. Parse response: shoppingContext, bundles[].{id, title, reason, goal, items, confidence}
  4. Filter: valid product IDs only, exclude already-owned items
  5. Return 2 bundles (3–5 items each)
```

### 9.4 Amazon Sense Reorder Flow

```
1. Events tracked client-side:
   POST /api/sense/event { type: "purchase"|"view"|"cart_add"|"return", productId, ... }

2. Backend (sense.js):
   - Get or create DnaProfile for userId / guestId
   - Append event (capped at 200)
   - Recompute: preferredBrands, budgetRange, returnPatterns

3. Prediction served:
   GET /api/sense/predictions → senseItems: [{ name, daysOverdue, ... }]
   - Shown as popup on homepage after 3s
   - Shown as "Sense Soon" tab in cart (items where daysOverdue ≤ 0)
```

### 9.5 Co-Planner Real-Time Collaboration

```
Create plan:  POST /api/co-planner/create { title, members }
              → planId, inviteToken, shareLink

Invite:       POST /api/co-planner/:planId/invite
              → token (embedded in QR code URL, expires in 7 days)

Join via QR:  PUT /api/co-planner/:planId/accept-invite
              → adds user to plan.members with role "member"

Live sync:
  Client  →  socket.emit("coplan:join", { planId })
  Server  →  socket.join(`coplan:${planId}`)
  On change: io.to(`coplan:${planId}`).emit("plan:updated", {...})
  All members receive the update instantly
```

### 9.6 Returns Flow

```
1. User selects product to return on /returns
2. GET  /api/sense/risk/:productId         show risk breakdown
3. POST /api/returns/suggestions { productId, productName, brand, category }

Backend (returns.js):
  - Build alternatives catalog (exclude returned product + same brand)
  - Prompt Groq: "Pick 3 best swap alternatives"
  - Score: same category > price match > rating > different brand
  - Return 3 suggestions with swap reasons
```

---

## 10. Authentication

**Mechanism:** Stateless JWT

| Step | Detail |
|---|---|
| Signup | `POST /api/auth/signup` — bcrypt hash (10 rounds), issue JWT |
| Login | `POST /api/auth/login` — bcrypt.compare, issue JWT |
| Token storage | localStorage key `"token"` |
| Token expiry | 7 days |
| Header format | `Authorization: Bearer <token>` |
| Guest support | If token is absent/invalid, requests proceed with `guestId` (UUID query param) |

Auth is **soft** — all routes function for guests. Co-Planner routes require a valid JWT for write operations.

---

## 11. Infrastructure & Ports

| Service | Port | URL |
|---|---|---|
| React Client | 5173 | `http://localhost:5173` |
| Express Server | 5001 | `http://localhost:5001` |
| MongoDB | 27017 | `mongodb://127.0.0.1:27017/amazon-lens` |

**Environment variables (server `.env`):**

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GROQ_API_KEY` | Groq LLM API key |
| `CLIENT_URL` | CORS origin whitelist |
| `PORT` | Express server port (default 5001) |

---

## 12. Feature Summary

| Feature | Core Tech | Key Files |
|---|---|---|
| TrustLens™ | Trust formula + customer DB + Groq review analysis | `trustFormula.js`, `sense.js` |
| WitnessPanel™ | Socket.IO real-time chat + Groq AI fallback | `witness.js`, `WitnessContext.jsx` |
| Amazon Sense™ | DNA profiling + event tracking + reorder predictions | `DnaProfile` model, `sense.js` |
| Green Choice™ | Eco scoring + company ratings + sustainability dashboard | `companies.js`, `SustainabilityPage.jsx` |
| Smart Bundles | Groq AI generation + category complement rules | `bundles.js`, `BundleDetailPage.jsx` |
| Co-Planner | Shared lists + roles + real-time Socket.IO + QR invite | `coPlanner.js`, `CoPlannerPage.jsx` |
| Smart Search | NL query + Groq intent classification + bundle detection | `smartSearch.js`, `SearchResults.jsx` |
| Returns AI | Groq-powered swap suggestions | `returns.js`, `ReturnsPage.jsx` |
