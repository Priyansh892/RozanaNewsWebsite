const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const http = require("http");
const app = express();
connectDB();
require("./config/redis");

// Security Headers (Helmet)
// Sets 14 HTTP headers automatically to protect against common attacks:
// XSS, clickjacking, MIME sniffing, etc.
app.use(helmet());

// Request Logging (Morgan)
// 'dev' format: METHOD /path STATUS response-time
// e.g: GET /api/news/all-news 200 42.3 ms
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// Rate Limiters
const {
  authLimiter,
  newsLimiter,
  generalLimiter,
} = require("./middleware/rateLimiter");
app.use("/api/auth", authLimiter); // strict  - 10 req / 15min (brute force protection)
app.use("/api/news", newsLimiter); // moderate - 100 req / 15min (API quota protection)
app.use(generalLimiter); // fallback - 200 req / 15min (everything else)

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/saved", require("./routes/savedNewsRoutes"));
app.use("/api/history", require("./routes/historyRoutes"));

// Health Check to verify all services are running
const mongoose = require("mongoose");
const { isRedisHealthy } = require("./config/redis");

app.get("/api/health", async (req, res) => {
  const redisOk = await isRedisHealthy();
  const mongoOk = mongoose.connection.readyState === 1; // 1 = connected

  const startTime = process.hrtime();
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  const allHealthy = redisOk && mongoOk;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    services: {
      mongodb: mongoOk ? "connected" : "disconnected",
      redis: redisOk ? "connected" : "disconnected",
    },
  });
});

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
