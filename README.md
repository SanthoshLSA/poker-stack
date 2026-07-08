# 🃏 PokerStack — Poker Session & Bankroll Manager

> Track every chip. No more miscounts. No more disputes.

A full-stack MERN web app for managing private poker sessions with live bankroll tracking, transaction audit trails, group leaderboards, and Vercel deployment.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free M0 cluster)

### 1. Clone & Install

```bash
# Install server deps
cd server
npm install

# Install client deps
cd ../client
npm install
```

### 2. Environment Setup

**Server** — create `server/.env` (copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/pokerstack
JWT_SECRET=change_this_to_a_long_random_string
JWT_REFRESH_SECRET=change_this_too
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client** — create `client/.env`:
```env
VITE_API_URL=/api
```

### 3. Run

Open two terminals:

```bash
# Terminal 1: Start backend (port 5000)
cd server
npm run dev

# Terminal 2: Start frontend (port 5173)
cd client
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

---

## ☁️ Deploy to Vercel

### Option A: Separate Frontend + Backend (Recommended)

**Deploy the backend first:**
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import the `poker-stack` repo, set **Root Directory** to `server`
3. Add environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string
   - `JWT_REFRESH_SECRET` — another long random string
   - `CLIENT_URL` — your frontend Vercel URL (add after deploying frontend)
   - `NODE_ENV=production`
4. Deploy → copy the backend URL

**Deploy the frontend:**
1. New Project → same repo, **Root Directory** = `client`
2. Add env var: `VITE_API_URL=https://your-backend.vercel.app/api`
3. Deploy

**Update CORS:**
After deploying frontend, go back to backend Vercel project → Settings → Environment Variables → update `CLIENT_URL` to your frontend URL → Redeploy.

### Option B: Monorepo (using root vercel.json)
Import the root directory — Vercel will use `vercel.json` to route `/api` to Express and everything else to the React build.

---

## 📁 Project Structure

```
poker-stack/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/api.js          # Axios API calls
│   │   ├── components/         # Navbar, FloatingNav, Toast, AnimatedCounter
│   │   ├── context/            # AuthContext (JWT auth)
│   │   ├── pages/              # All route pages
│   │   └── styles/index.css    # Full CSS design system
│   └── vite.config.js
└── server/                     # Express + MongoDB backend
    ├── models/                 # User, Group, Session, PlayerResult
    ├── routes/                 # auth, groups, sessions, leaderboard
    ├── middleware/auth.js      # JWT middleware
    └── index.js                # App entry
```

---

## ✨ Features

### 🔐 User Accounts
- Register/login with email or username
- JWT authentication (7-day tokens)
- Avatar color customization
- Privacy mode (hide P/L from global leaderboard)
- Password change

### 🃏 Session Management
- Create sessions as admin with initial bank amount
- Join via 6-character room code
- **Admin-only** transaction recording
- Auto-refreshes every 10 seconds for all players

### 💰 Money Conservation
The core invariant: `initialBank = currentBank + Σ(all player stacks)` at ALL times.

- **Buy-in from bank**: deducted from bank, added to player
- **Rebuy from bank**: same as buy-in
- **Player transfer**: moves chips between players (bank unaffected)
- **End session**: conservation check before finalizing, P/L saved to DB

### 👥 Groups
- Create groups with auto-generated 6-char invite codes
- Join by invite code
- Group-specific leaderboard showing all-time P/L within the group

### 🏆 Leaderboard
- Global leaderboard (players with private mode show 🔒)
- Podium display for top 3
- Sortable by Profit, Sessions, Win Rate

---

## 🗄️ MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user (remember password)
4. Allow network access: `0.0.0.0/0` (or Vercel IPs)
5. Get the connection string: `Databases → Connect → Compass/Driver`
6. Replace `<password>` in the connection string

---

## 🎨 Design System

- **Colors**: Charcoal `#07080d`, Gold `#c9a84c`, Red `#c0392b`, Felt Green `#0a1a0a`
- **Fonts**: Outfit (display), Space Grotesk (body), JetBrains Mono (code)
- **Cards**: Glassmorphism with gold border glow on hover
- **Navigation**: Sticky frosted glass navbar + right-side floating icon nav
- **Animations**: Smooth counter animations, orb backgrounds, micro-interactions

---

## 📡 API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| PATCH | `/api/auth/profile` | ✓ | Update profile |
| PATCH | `/api/auth/change-password` | ✓ | Change password |
| POST | `/api/groups` | ✓ | Create group |
| GET | `/api/groups/mine` | ✓ | My groups |
| POST | `/api/groups/join` | ✓ | Join group |
| GET | `/api/groups/:id` | ✓ | Group details |
| GET | `/api/groups/:id/leaderboard` | ✓ | Group leaderboard |
| POST | `/api/sessions` | ✓ | Create session |
| POST | `/api/sessions/join` | ✓ | Join session |
| GET | `/api/sessions/my` | ✓ | My sessions |
| GET | `/api/sessions/:code` | ✓ | Session state |
| POST | `/api/sessions/:code/transaction` | ✓ Admin | Record transaction |
| POST | `/api/sessions/:code/end` | ✓ Admin | End session |
| GET | `/api/sessions/:code/history` | ✓ | Transaction log |
| GET | `/api/leaderboard` | ✓ | Global leaderboard |
| GET | `/api/leaderboard/user/:id` | ✓ | User stats |
