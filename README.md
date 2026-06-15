# Amazon Lens

Amazon.in clone with built-in purchase intelligence. Surfaces the data Amazon already has — price history, trust scoring, real-owner insights, predictive shopping intelligence, and sustainability metrics — natively inside the standard shopping flow.

Built for Amazon HackOn Season 6.

## Features

### TrustLens™

On every product page: a 12-month price history chart, a colour-coded trust score (0–100), fake discount detection, and a buy-now-or-wait recommendation. Click the info icon to open the TrustCard — a breakdown across 5 dimensions: Review Authenticity, Return Rate, Warranty Claims, Seller Reliability, and Price Stability.

Two status tiers:

* VERIFIED (≥ 75) — green badge, trustworthy product
* TRUSTED (≥ 90) — blue badge, highest confidence

### WitnessPanel™

Chat with AI personas of verified owners. Not reviews, not customer service — actual people who own the product, responding in character with city-specific context (Bengaluru hard water, Mumbai humidity). Powered by Groq (llama3-70b).

### Amazon Sense™

Predicts what you'll need before you search for it. Learns from purchase frequency, shopping patterns, and product usage signals to surface timely reorder reminders, personalized recommendations, shopping DNA insights, and risk-aware suggestions. Appears through homepage nudges, the cart's "Soon" tab, and recommendation panels. Powered by MongoDB so shopping intelligence persists across sessions.

### Green Choice™ Sustainability

Green Choice badge on product cards for products from companies with eco score > 80. Eco Mode highlights sustainable alternatives across search and discovery, while the Sustainability Dashboard shows live company rankings, carbon impact metrics, renewable energy adoption, recyclable packaging scores, and personalized eco-shopping insights.

### AI Bundles

Shopping Bundles page (/bundles) contains curated collections built around real shopping goals. AI-personalized bundles are generated from purchase history and shopping behavior, with per-item reasoning, suggested add-ons, and one-click setup purchasing. Homepage "Continue Your Journey" recommendations evolve as new orders are placed.

### Co-Planner™

Collaborative shopping for families, roommates, and groups. Create shared plans, invite members through a token link, assign items, vote on purchases, split expenses, comment on decisions, and track activity. Purchases are tracked per plan, allowing the same item to exist across multiple shared carts without affecting other groups.

### Smart Search

Natural language search with TrustLens-aware ranking. Detects intent-driven shopping goals such as "home theatre setup under 40000", automatically generates relevant bundles, and surfaces contextual recommendations above traditional product results.

### Returns Assistant

AI-powered return guidance that analyzes order history, return reasons, product categories, and policy compatibility. Suggests the best return path and replacement products while automatically excluding unavailable or unsuitable alternatives.

## Tech Stack

| Layer    | Tech                                           |
| -------- | ---------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide |
| Backend  | Express.js, Node.js                            |
| Database | MongoDB + Mongoose                             |
| Auth     | bcryptjs + JWT (stored in localStorage)        |
| AI       | Groq SDK (llama3-70b-8192)                     |

## Prerequisites

* Node.js 18+
* MongoDB running locally

```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Or run directly
mongod --dbpath /usr/local/var/mongodb
```

## Setup

```bash
# 1. Clone and install all dependencies
git clone <repo-url>
cd amazon-lens
npm run install:all

# 2. Edit server/.env with your values:
#    PORT, MONGODB_URI, JWT_SECRET, GROQ_API_KEY

# 3. Start both client and server
npm run dev
```

Client → http://localhost:5173

Server → http://localhost:5001

Health check → http://localhost:5001/api/health

## Environment

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/amazon-lens
JWT_SECRET=amazon_lens_hackathon_secret_2024
GROQ_API_KEY=<your-groq-key>
CLIENT_URL=http://localhost:5173
```

Get a free Groq API key at console.groq.com. WitnessPanel falls back to pre-written responses if no key is set.

## Demo Path

### 1. Homepage

* Products load in Deal of the Day and Recommended for You sections
* Amazon Sense™ surfaces predictive reorder reminders and personalized recommendations
* "Continue Your Journey" shows AI-personalized bundles based on your latest purchases
* Click "Try it on Sony TV →" in the TrustLens banner to jump to the product page

### 2. Search

Type `home theatre setup under 40000` in the search bar.

* A Bundle Card appears at the top: Sony TV + JBL Soundbar + Fire TV Stick
* Individual product cards show TrustLens badges and Green Choice badges where applicable
* If Eco Mode is on, an eco banner appears with sustainability-focused recommendations

### 3. Product Page — Sony Bravia 55" 4K TV (/dp/p001)

| What you see                        | What it means                                             |
| ----------------------------------- | --------------------------------------------------------- |
| Orange 71/100 trust badge           | Mixed — some concerns detected                            |
| Red "Fake Discount Detected" banner | Price has been "discounted" for 10 of 12 months           |
| Orange "Consider Waiting" box       | Prime Day in 8 days — historically drops 18–22%           |
| 12-month price history chart        | Red spike zones at inflated MRP months                    |
| Suspicious Reviews section          | Bot-pattern reviews flagged and collapsed                 |
| Sustainability Panel                | Carbon footprint, recyclability, ethical sourcing metrics |

### 4. WitnessPanel

Scroll down on the Sony TV page.

* Three owner cards: Arjun M. (Bengaluru), Priya S. (Mumbai), Rahul K. (Delhi)
* Click Chat on any card and ask city-specific questions
* Example: "How does it handle hard water?"

### 5. Eco Mode + Sustainability Dashboard

* Enable Eco Mode from the navbar
* Visit `/sustainability`
* View your eco profile, company rankings, and sustainability metrics
* Toggle Eco Mode directly from the dashboard

### 6. Bundles (/bundles)

* Place an order first
* The "For You" section generates personalized bundles from purchase history
* Open a bundle to view included products, AI reasoning, and add-ons
* Add an entire setup to the cart with one action

### 7. Co-Planner

* Create a shared shopping plan
* Invite members using a token link
* Add items, assign responsibilities, vote, and discuss purchases
* Purchase tracking updates only within the originating shared plan

### 8. Amazon Sense

* Open the cart and visit the "Soon" tab
* View predicted reorders, personalized reminders, and estimated restock timelines
* Explore recommendations tailored to your shopping habits and purchase history, with a personalized "Sense Score" for each suggested product

### 9. Auth

* `/signup` — create an account stored in MongoDB
* `/login` — sign back in
* Without login, the app uses demo user "Arjun Kumar"

## API Reference

All endpoints served from http://localhost:5001.

| Method | Endpoint                   | Description                       |
| ------ | -------------------------- | --------------------------------- |
| GET    | /api/health                | Server status                     |
| GET    | /api/products              | All products (?category= ?limit=) |
| GET    | /api/products/             | Single product                    |
| POST   | /api/products/search       | Search with bundle detection      |
| GET    | /api/companies             | All company eco data              |
| GET    | /api/companies/stats       | Eco stats summary                 |
| GET    | /api/companies/            | Single company                    |
| GET    | /api/bundles               | Curated static bundles            |
| POST   | /api/bundles/ai            | AI-personalized bundles           |
| GET    | /api/witness/              | Owner personas                    |
| POST   | /api/witness/chat          | WitnessPanel chat                 |
| GET    | /api/sense/predictions     | Reorder predictions               |
| POST   | /api/sense/event           | Track usage event                 |
| GET    | /api/sense/profile         | Shopping DNA profile              |
| POST   | /api/sense/seller-trust    | Seller trust analysis             |
| GET    | /api/sense/risk/           | Product risk profile              |
| GET    | /api/sense/recommendations | Personalized recommendations      |
| POST   | /api/smart-search          | Natural language search           |
| POST   | /api/returns/suggestions   | Return recommendations            |
| GET    | /api/co-planner/my-plans   | User's shared plans               |
| POST   | /api/co-planner/create     | Create a shared plan              |
| POST   | /api/auth/signup           | Create account                    |
| POST   | /api/auth/login            | Sign in                           |

## Product Catalogue

38 hand-crafted products across major categories, each containing TrustLens scoring, historical pricing, review intelligence, sustainability metrics, and company eco linkage.

| Category     | Example Products                                                      |
| ------------ | --------------------------------------------------------------------- |
| Electronics  | Sony Bravia 55" 4K TV, Apple iPhone 15, Samsung 43" 4K TV             |
| Audio        | JBL Cinema SB271 Soundbar, boAt Airdopes 141, JBL Tune 760NC          |
| Smart Home   | Fire TV Stick 4K Max, Amazon Echo Dot, Wipro Smart Plug               |
| Kitchen      | Philips Air Fryer, Prestige Pressure Cooker, Pigeon Induction Cooktop |
| Office       | LG 24" Monitor, Logitech Webcam, Anker USB-C Hub                      |
| Gaming       | Redragon Keyboard, Razer Gaming Mouse, Samsung 27" 144Hz Monitor      |
| Eco Products | EcoSmile Bamboo Toothbrush, Milton Bottle, Recycled Notebooks         |

Green Choice products (eco score > 80):

* EcoSmile Bamboo Toothbrush (p009)
* Wipro Smart Bulb (p014)
* Philips LED Study Lamp (p019)
* Wipro Garnet Lamp (p033)
* Wipro Smart Plug (p038)

## Known Limitations

* Filter checkboxes in search results are UI-only
* Cart and orders are stored in localStorage
* WitnessPanel personas are fully implemented for Sony TV; other products use generated responses
* Co-Planner plans currently use server-side JSON storage instead of MongoDB
* Checkout flow is a demonstration workflow and does not process payments
