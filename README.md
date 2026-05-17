RozanaNews is a full-stack, production-grade news platform built for the modern reader. No more tab chaos. No more generic feeds. Just the news that matters to you — fast, clean, and personalized.

🚀 What Makes It Different

⚡ Blazing fast feeds — Redis caching layer serves news in under 10ms after the first load
🔐 Bank-grade auth — JWT access + refresh token rotation with httpOnly cookies, automatic silent refresh, and server-side revocation
🌍 Your world, your feed — browse by category, country, or keyword.
📱 Clean card UI — distraction-free reading experience built with Angular 18
🛡️ Production-ready backend — rate limiting, Helmet.js security headers, Morgan logging, and a live health check endpoint

🛠️ Tech Stack

Frontend -> Angular 18 (Standalone Components)
Backend -> Node.js + Express.js
Database -> MongoDB + Mongoose
Cache -> Redis (Upstash)
Auth -> JWT + httpOnly cookies + refresh token rotation
News Data -> newsapi.org 
Security -> Helmet.js + express-rate-limit

✨ Features

🔑 Register, Login, Logout with secure token-based auth
🔄 Silent token refresh — users never get kicked out mid-session
📰 All News, Top Headlines, Country News feeds
🗂️ Category-based browsing — Business, Sports, Tech, Health & more
🌐 Country-based news — pick any country by ISO code
🔗 Social sharing — WhatsApp, Twitter, LinkedIn, Facebook, Email
⚙️ Redis caching — 15-minute TTL, 40-100x faster repeated requests
🏥 /api/health endpoint — live MongoDB + Redis status check
🚦 Rate limiting — brute force and API quota protection
