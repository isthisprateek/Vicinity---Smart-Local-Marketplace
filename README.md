# Smart Market - Smart Local Marketplace

Smart Market is an intelligent hyper-local marketplace that bridges the gap between buyers and city-wide local sellers. By incorporating Natural Language query processing and Neo4j Graph Database logic, it parses arbitrary intents like "I have a headache" into fully populated cart recommendations spanning optimal local sellers.

##  Key Features

- **Smart Search Intents:** Search by symptom or need (e.g. "fever") — the backend evaluates intent and sources a curative bundle of relevant products.
- **Live Delivery Tracking:** Real-time map visualization showing the complete route from seller to buyer with animated delivery progress.
- **Unified Seller & Buyer Roles:** Seamlessly transition between purchasing goods or running your own digital storefronts from a unified UI.
- **Smart Cart Splitting:** Multi-vendor purchases grouped transparently into one Razorpay checkout session.
- **AI Recommendation Chatbot:** Floating helper modal that curates product bundles based on dietary needs, symptoms, or recipes.
- **Seller Dashboard:** Inline CRUD tools for inventory management with live buyer address visualization.
- **Robust Authentication:** JWT-based auth with role gating (buyer, seller, admin).

## 🛠 Tech Stack

**Frontend:** React 19, TypeScript, Vite, Framer Motion, React Leaflet, TailwindCSS

**Backend:** Node.js, Express, TypeScript, MongoDB, Neo4j, JWT, Razorpay, Google Gemini AI

## ⚙️ Setup

### 1. Clone & Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

Copy the example files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See `backend/.env.example` and `frontend/.env.example` for required variables.

### 3. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` — Register a buyer or seller account
- `POST /api/auth/login` — Email/password login
- `POST /api/auth/face/login` — Face descriptor login

### Products & Shops
- `GET /api/products` — List all products
- `GET /api/products/:id` — Get product details
- `GET /api/shops` — Browse shops
- `GET /api/shops/:id` — Shop details and inventory

### Search & AI
- `GET /api/search/intent?q=query` — AI-powered intent search
- `GET /api/graph-search?q=query` — Neo4j graph traversal
- `GET /api/delivery/:productId` — Delivery route data

## 🔐 Test Accounts

There are no pre-seeded accounts. Create them via the signup flow:

- **Buyer** — register with role: Buyer
- **Seller** — register with role: Seller, then create a shop and add products from the Seller Dashboard
- **Admin** — configure the admin email in your `.env` / source as needed
