const axios = require("axios");
const User = require("../models/User");
const ReadingHistory = require("../models/ReadingHistory");
const { redis } = require("../config/redis");

const GNEWS_BASE = "https://gnews.io/api/v4";
const API_KEY = process.env.NEWS_API_KEY;
const MAX_PER_SOURCE = 10;
const CACHE_TTL = 600; // 10 minutes

function normalizeArticle(article) {
  return {
    title: article.title || "",
    description: article.description || "",
    url: article.url || "",
    urlToImage: article.image || "",
    publishedAt: article.publishedAt || "",
    author: article.source?.name || "",
    content: article.content || "",
    source: {
      id: article.source?.id || null,
      name: article.source?.name || "Unknown",
      url: article.source?.url || "",
      country: article.source?.country || "",
    },
  };
}

async function fetchByCategory(category) {
  try {
    const res = await axios.get(`${GNEWS_BASE}/top-headlines`, {
      params: {
        category,
        lang: "en",
        country: "in",
        max: MAX_PER_SOURCE,
        apikey: API_KEY,
      },
      timeout: 8000,
    });
    const count = res.data?.articles?.length || 0;
    console.log(`[ForYou] category=${category} → ${count} articles`);
    return (res.data?.articles || []).map(normalizeArticle);
  } catch (err) {
    console.error(
      `[ForYou] fetchByCategory(${category}) failed:`,
      err.response?.data || err.message,
    );
    return [];
  }
}

async function fetchByKeyword(keyword) {
  try {
    const res = await axios.get(`${GNEWS_BASE}/search`, {
      params: { q: keyword, lang: "en", max: MAX_PER_SOURCE, apikey: API_KEY },
      timeout: 8000,
    });
    const count = res.data?.articles?.length || 0;
    console.log(`[ForYou] keyword=${keyword} → ${count} articles`);
    return (res.data?.articles || []).map(normalizeArticle);
  } catch (err) {
    console.error(
      `[ForYou] fetchByKeyword(${keyword}) failed:`,
      err.response?.data || err.message,
    );
    return [];
  }
}

async function fetchByCountry(country) {
  try {
    const res = await axios.get(`${GNEWS_BASE}/top-headlines`, {
      params: { lang: "en", country, max: MAX_PER_SOURCE, apikey: API_KEY },
      timeout: 8000,
    });
    const count = res.data?.articles?.length || 0;
    console.log(`[ForYou] country=${country} → ${count} articles`);
    return (res.data?.articles || []).map(normalizeArticle);
  } catch (err) {
    console.error(
      `[ForYou] fetchByCountry(${country}) failed:`,
      err.response?.data || err.message,
    );
    return [];
  }
}

exports.getForYouFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `foryou:${userId}`;

    // Check cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[ForYou] Cache HIT for user ${userId}`);
        return res.status(200).json({ ...JSON.parse(cached), fromCache: true });
      }
    } catch (cacheErr) {
      console.warn(
        "[ForYou] Redis read failed, continuing without cache:",
        cacheErr.message,
      );
    }

    console.log(`[ForYou] Building feed for user ${userId}`);

    // Get user preferences
    const user = await User.findById(userId).select(
      "interests followedCountries followedTopics",
    );

    const interests = user?.interests || [];
    const countries = user?.followedCountries?.length
      ? user.followedCountries
      : ["in"];
    const topics = user?.followedTopics || [];

    // Implicit interests from reading history (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const implicitRaw = await ReadingHistory.aggregate([
      { $match: { userId, readAt: { $gte: last7Days } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);
    const implicit = implicitRaw
      .map((i) => i._id)
      .filter((c) => c && !interests.includes(c));

    console.log(
      `[ForYou] interests=${JSON.stringify(interests)} implicit=${JSON.stringify(implicit)} countries=${JSON.stringify(countries)} topics=${JSON.stringify(topics)}`,
    );

    // Build fetch tasks
    const fetchTasks = [];
    interests.forEach((cat) =>
      fetchTasks.push({ type: "category", value: cat }),
    );
    implicit.forEach((cat) =>
      fetchTasks.push({ type: "category", value: cat }),
    );
    topics.forEach((t) => fetchTasks.push({ type: "keyword", value: t }));
    countries.forEach((c) => fetchTasks.push({ type: "country", value: c }));

    if (fetchTasks.length === 0) {
      fetchTasks.push({ type: "country", value: "in" });
    }

    console.log(`[ForYou] ${fetchTasks.length} fetch tasks`);

    // Fetch all in parallel
    const results = await Promise.all(
      fetchTasks.map((task) => {
        if (task.type === "category") return fetchByCategory(task.value);
        if (task.type === "keyword") return fetchByKeyword(task.value);
        if (task.type === "country") return fetchByCountry(task.value);
        return Promise.resolve([]);
      }),
    );

    // Deduplicate by URL
    const articleMap = new Map();
    results.forEach((articles) => {
      articles.forEach((article) => {
        if (article.url && !articleMap.has(article.url)) {
          articleMap.set(article.url, article);
        }
      });
    });

    // Sort newest first
    const all = [...articleMap.values()].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    console.log(`[ForYou] Total unique articles: ${all.length}`);

    const payload = {
      success: true,
      message: "For You feed generated",
      data: {
        totalResults: all.length,
        articles: all,
        sources: {
          explicitInterests: interests,
          followedTopics: topics,
          implicitFromHistory: implicit,
          followedCountries: countries,
          totalFetchTasks: fetchTasks.length,
        },
      },
    };

    // Cache it
    try {
      await redis.set(cacheKey, JSON.stringify(payload), "EX", CACHE_TTL);
    } catch (cacheErr) {
      console.warn("[ForYou] Redis write failed:", cacheErr.message);
    }

    res.status(200).json(payload);
  } catch (error) {
    console.error("[ForYou] Fatal error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate For You feed",
      error: error.message,
    });
  }
};

exports.invalidateForYouCache = async (userId) => {
  try {
    await redis.del(`foryou:${userId}`);
    console.log(`[ForYou] Cache invalidated for user ${userId}`);
  } catch (err) {
    console.warn("[ForYou] Cache invalidation failed:", err.message);
  }
};
