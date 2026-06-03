const { redis, TTL } = require("../config/redis");

const buildKey = {
  allNews: (q, page, pageSize) => `news:all:${q}:${page}:${pageSize}`,
  headlines: (category, page, pageSize) =>
    `news:headlines:${category}:${page}:${pageSize}`,
  country: (iso, page, pageSize) => `news:country:${iso}:${page}:${pageSize}`,
};

// Get from Cache
async function getCache(key) {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    // Cache read failure should never crash the app - just fetch from API
    console.error("[Cache] GET error:", err.message);
    return null;
  }
}

// Set in Cache -> Stores object as JSON string with TTL in seconds
async function setCache(key, data, ttl = TTL.NEWS) {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch (err) {
    // Cache write failure should never crash the app - data still returned to user
    console.error("[Cache] SET error:", err.message);
  }
}

// Delete from Cache ─> Used when you want to force a fresh fetch (e.g. admin invalidation)
async function deleteCache(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("[Cache] DELETE error:", err.message);
  }
}

// Cache Wrapper
// Main helper used in controllers:
// 1. Check cache → if HIT return cached data immediately
// 2. If MISS → call fetchFn() → store result in cache → return result
async function withCache(key, fetchFn, ttl = TTL.NEWS) {
  // 1. Try cache first
  const cached = await getCache(key);
  if (cached) {
    console.log(`[Cache] HIT → ${key}`);
    return { ...cached, fromCache: true };
  }

  // 2. Cache miss - fetch from source
  console.log(`[Cache] MISS → ${key} - fetching from News API`);
  const freshData = await fetchFn();

  // 3. Only cache successful responses
  if (freshData && freshData.success) {
    await setCache(key, freshData, ttl);
  }

  return freshData;
}

module.exports = { buildKey, getCache, setCache, deleteCache, withCache };
