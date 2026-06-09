# RozanaNews 📰

> **Your world. Your feed. No noise.**

RozanaNews is a full-stack, production-grade news platform built for the modern reader. No more tab chaos. No more generic feeds. Just the news that matters to you - fast, clean, and deeply personalized.

**[Live Demo](https://rozana-news-website.vercel.app)**

---

## ✨ Features

### 📰 News Feeds
Browse All News, Top Headlines, and Country News. Filter by category - Business, Sports, Tech, Health, and more. Pick any country by ISO code for hyper-local coverage.

### 💾 Saved Articles
Bookmark any article with one click. Organize saves into named collections and move articles between them whenever you want.

### 🕓 Reading History
Every article you open is automatically logged. Pick up where you left off, or revisit something you half-read yesterday.

### 📊 My Analytics
Visual breakdown of your reading habits by category, activity timeline, and top topics - so you know exactly what kind of reader you are.

### 🔗 Social Sharing
Share any article directly to WhatsApp, Twitter, LinkedIn, Facebook, or Email straight from the card.

### 🔑 Authentication
Register, login, and logout with secure token-based auth. Silent token refresh means users are never kicked out mid-session. Google OAuth for one-click sign-in.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 18 (Standalone Components, SSR) |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Cache** | Redis (Upstash) |
| **Auth** | JWT + HttpOnly cookies + refresh token rotation |
| **News Data** | [GNews API](https://docs.gnews.io/) |
| **Security** | Helmet.js + express-rate-limit |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [GNews API Key](https://gnews.io) (free tier available)
- A [MongoDB Atlas](https://mongodb.com/atlas) cluster or local MongoDB
- An [Upstash Redis](https://upstash.com) database (free tier available)
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 credential (for Google login)

### Installation

```bash
# Clone the repository
git clone https://github.com/Priyansh892/RozanaNewsWebsite.git
cd RozanaNewsWebsite
```

### Backend

```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

---

### Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb://localhost:27017/rozana

ACCESS_TOKEN_SECRET=your_64_char_random_hex_string
REFRESH_TOKEN_SECRET=your_64_char_random_hex_string
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

COOKIE_SECURE=false

NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

UPSTASH_REDIS_REST_URL=https://xxx-xxx-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REDIS_URL=rediss://default:xxxxxxxxxxxx@xxx-xxx-xxxxx.upstash.io:6379
REDIS_TTL=900

GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx

CLIENT_URL=http://localhost:4200
SERVER_URL=http://localhost:5000
```

**Getting your keys:**
- **GNews API Key** → [gnews.io](https://gnews.io) → Dashboard → API Key
- **JWT Secrets** → `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`  (run twice)
- **Google OAuth** → [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client
- **Upstash Redis** → [upstash.com](https://upstash.com) → Create Database → REST API tab

---

## 📁 Project Structure

```
RozanaNewsWebsite/
├── backend/
│   ├── config/              # DB, Redis, Passport config
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, rate limiter
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── app/
        │   ├── components/  # Reusable UI components
        │   ├── pages/       # Route-level components
        │   └── services/    # HTTP + state services
        └── environments/    # environment.ts / environment.prod.ts
```

---

## 🔒 Security

- HttpOnly cookies - tokens are never accessible to JavaScript
- Refresh token rotation - each refresh issues a new token and revokes the old one
- Server-side token revocation - logout invalidates the refresh token in the database
- Helmet.js - 14 HTTP security headers set automatically
- Rate limiting - brute force protection on auth routes, quota protection on news routes
- API keys stored in `.env` and never committed to Git

---

## 🏥 Health Check

```
GET /api/health
```

Returns live status of MongoDB and Redis:

```json
{
  "status": "ok",
  "uptime": "2h 14m 33s",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

## 👨‍💻 Author

**Priyansh Agarwal**

- GitHub: [Priyansh892](https://github.com/Priyansh892)
- LinkedIn: [linkedin.com/in/priyansh-agarwal-sde](https://www.linkedin.com/in/priyansh-agarwal-sde/)

---

## 🙏 Acknowledgements

- [GNews](https://gnews.io) for the news data API
- [Upstash](https://upstash.com) for serverless Redis
- [MongoDB Atlas](https://mongodb.com/atlas) for the managed database
- [Render](https://render.com) for backend hosting
- [Vercel](https://vercel.com) for frontend hosting