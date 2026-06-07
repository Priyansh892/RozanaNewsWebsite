const axios = require("axios");
const User = require("../models/User");
const ReadingHistory = require("../models/ReadingHistory");
const { buildKey, withCache } = require("../utils/cacheUtils");

const GNEWS_BASE = "https://gnews.io/api/v4";
const API_KEY = process.env.NEWS_API_KEY;

// Article normalizer
function normalizeArticle(article, sourceTopic) {
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
    _sourceTopic: sourceTopic, // used for deduplication context
  };
}

// Fetch from GNews with error handling
async function fetchGNews(params) {
  try {
    const response = await axios.get(`${GNEWS_BASE}/search`, {
      params: { ...params, apikey: API_KEY },
    });
    return response.data?.articles || [];
  } catch {
    return [];
  }
}

async function fetchTopHeadlines(params) {
  try {
    const response = await axios.get(`${GNEWS_BASE}/top-headlines`, {
      params: { ...params, apikey: API_KEY },
    });
    return response.data?.articles || [];
  } catch {
    return [];
  }
}

// GET /api/news/for-you
exports.getForYouFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 10);

    // Step 1: Fetch user preferences
    const user = await User.findById(userId).select(
      "interests followedCountries followedTopics",
    );

    const explicit = {
      interests: user.interests || [],
      countries: user.followedCountries || [],
      topics: user.followedTopics || [],
    };

    // Step 2: Derive implicit interests from history
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const implicitRaw = await ReadingHistory.aggregate([
      { $match: { userId, readAt: { $gte: last7Days } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);
    const implicit = implicitRaw.map((i) => i._id).filter(Boolean);

    // Step 3: Build scored fetch plan
    // Higher weight = fetched first = more likely in feed
    const fetchPlan = [];

    // Explicit interests (weight 3) - most important
    explicit.interests.forEach((cat) => {
      fetchPlan.push({ type: "category", value: cat, weight: 3 });
    });

    // Followed topics / keywords (weight 3)
    explicit.topics.forEach((topic) => {
      fetchPlan.push({ type: "keyword", value: topic, weight: 3 });
    });

    // Implicit from reading history (weight 2)
    implicit.forEach((cat) => {
      if (!explicit.interests.includes(cat)) {
        fetchPlan.push({ type: "category", value: cat, weight: 2 });
      }
    });

    // Followed countries (weight 1)
    explicit.countries.forEach((country) => {
      fetchPlan.push({ type: "country", value: country, weight: 1 });
    });

    // Fallback - if user has no preferences yet, show India news
    if (fetchPlan.length === 0) {
      fetchPlan.push({ type: "country", value: "in", weight: 1 });
    }

    // Step 4: Fetch articles for each plan item
    const cacheKey = `foryou:${userId}:${page}`;

    const result = await withCache(
      cacheKey,
      async () => {
        const articleMap = new Map(); // url → article (deduplication)

        // Sort by weight descending, then fetch
        fetchPlan.sort((a, b) => b.weight - a.weight);

        const fetches = fetchPlan.slice(0, 6).map(async (plan) => {
          let articles = [];

          if (plan.type === "category") {
            articles = await fetchTopHeadlines({
              category: plan.value,
              lang: "en",
              country: "in",
              max: 5,
            });
          } else if (plan.type === "keyword") {
            articles = await fetchGNews({
              q: plan.value,
              lang: "en",
              country: "in",
              max: 5,
            });
          } else if (plan.type === "country") {
            articles = await fetchTopHeadlines({
              lang: "en",
              country: plan.value,
              max: 5,
            });
          }

          // Add to map (first occurrence wins - deduplication by URL)
          articles.forEach((a) => {
            if (a.url && !articleMap.has(a.url)) {
              articleMap.set(a.url, normalizeArticle(a, plan.value));
            }
          });
        });

        await Promise.all(fetches);

        // Step 5: Shuffle for variety
        const all = [...articleMap.values()];
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }

        return {
          status: 200,
          success: true,
          message: "For You feed generated",
          data: {
            totalResults: all.length,
            articles: all,
            sources: {
              explicitInterests: explicit.interests,
              followedTopics: explicit.topics,
              implicitFromHistory: implicit,
              followedCountries: explicit.countries,
            },
          },
        };
      },
      300,
    ); // 5-minute cache

    res.status(result.status).json(result);
  } catch (error) {
    console.error("[ForYou] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate For You feed",
      error: error.message,
    });
  }
};
