const Redis = require("ioredis");
require("dotenv").config();

// Connect to Redis using URL from environment variables

const redis = new Redis(process.env.REDIS_URL, {
  // Upstash requires TLS - ioredis handles this automatically when URL starts with rediss://
  tls: {
    rejectUnauthorized: false,
  },
  maxRetriesPerRequest: 3, // retry failed commands 3 times before throwing
  retryStrategy(times) {
    // exponential backoff: 200ms, 400ms, 800ms then give up
    if (times > 3) {
      console.error("[Redis] Max retries reached. Could not reconnect.");
      return null; // stop retrying
    }
    return Math.min(times * 200, 800);
  },
  reconnectOnError(err) {
    // reconnect on READONLY errors (common with cloud Redis failovers)
    const targetErrors = ["READONLY", "ECONNRESET", "ECONNREFUSED"];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

// Connection event handlers for logging and debugging

redis.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

redis.on("ready", () => {
  console.log("[Redis] Ready to accept commands");
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redis.on("close", () => {
  console.warn("[Redis] Connection closed");
});

redis.on("reconnecting", () => {
  console.log("[Redis] Reconnecting...");
});

// Health check function to verify Redis connectivity

// Used by /api/health endpoint to verify Redis is alive
async function isRedisHealthy() {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

// TTL values for different cache types (in seconds)

const TTL = {
  NEWS: parseInt(process.env.REDIS_TTL) || 900, // 15 minutes - news feeds
  BREAKING: 300, // 5  minutes - breaking news
  USER_SESSION: 3600, // 1  hour    - session flags
  RATE_LIMIT: 900, // 15 minutes - rate limit windows
};

module.exports = { redis, isRedisHealthy, TTL };
