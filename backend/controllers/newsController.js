const axios = require("axios");
const { buildKey, withCache } = require("../utils/cacheUtils");

// GNews API Base Request
async function makeApiRequest(url) {
  try {
    const response = await axios.get(url);

    // Normalize GNews response to match the shape frontend already expects
    const raw = response.data;
    const normalized = {
      totalResults: raw.totalArticles || 0,
      articles: (raw.articles || []).map(normalizeArticle),
    };

    return {
      status: 200,
      success: true,
      message: "Successfully fetched the data",
      data: normalized,
    };
  } catch (error) {
    console.error(
      "[GNews] Request error:",
      error.response?.data || error.message,
    );

    // GNews returns error shape: { errors: ["message"] }
    const errMsg = error.response?.data?.errors?.[0] || error.message;
    return {
      status: error.response?.status || 500,
      success: false,
      message: "Failed to fetch data from GNews API",
      error: errMsg,
    };
  }
}

// Article Normalizer
// Maps GNews article shape → NewsAPI shape so frontend needs zero changes
function normalizeArticle(article) {
  return {
    title: article.title || "",
    description: article.description || "",
    url: article.url || "",
    urlToImage: article.image || "", // GNews uses 'image' not 'urlToImage'
    publishedAt: article.publishedAt || "",
    author: article.source?.name || "", // GNews has no author field — use source name
    content: article.content || "",
    source: {
      id: article.source?.id || null,
      name: article.source?.name || "Unknown",
      url: article.source?.url || "",
      country: article.source?.country || "",
    },
  };
}

// GET /api/news/all-news
// Query params: ?q=india&page=1&pageSize=10
// GNews max per request is 10 on free tier — pageSize capped accordingly
exports.getAllNews = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 10); // GNews free tier max = 10
  const q = req.query.q || "india"; // default india

  const cacheKey = buildKey.allNews(q, page, pageSize);

  const result = await withCache(cacheKey, () => {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=in&max=${pageSize}&page=${page}&apikey=${process.env.NEWS_API_KEY}`;
    return makeApiRequest(url);
  });

  res.status(result.status).json(result);
};

// GET /api/news/top-headlines
// Query params: ?category=general&page=1&pageSize=10
exports.getTopHeadlines = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 10);
  const category = req.query.category || "general";

  const cacheKey = buildKey.headlines(category, page, pageSize);

  const result = await withCache(cacheKey, () => {
    // GNews top-headlines endpoint with India default
    const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=in&max=${pageSize}&page=${page}&apikey=${process.env.NEWS_API_KEY}`;
    return makeApiRequest(url);
  });

  res.status(result.status).json(result);
};

// GET /api/news/country/:iso
// Route param: /api/news/country/in
exports.getTopHeadlinesByCountry = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 10);
  const country = req.params.iso;

  const cacheKey = buildKey.country(country, page, pageSize);

  const result = await withCache(cacheKey, () => {
    // GNews uses country param same way
    const url = `https://gnews.io/api/v4/top-headlines?country=${country}&lang=en&max=${pageSize}&page=${page}&apikey=${process.env.NEWS_API_KEY}`;
    return makeApiRequest(url);
  });

  res.status(result.status).json(result);
};

// POST /api/news/share-news
exports.shareNews = async (req, res) => {
  try {
    const { url, title } = req.body;
    if (!url || !title) {
      return res
        .status(400)
        .json({ success: false, message: "url and title are required" });
    }

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const socialMediaLinks = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=Check out this news: ${encodedUrl}`,
    };

    res.status(200).json({
      success: true,
      message: "Share links generated successfully",
      socialMediaLinks,
    });
  } catch (error) {
    console.error("[shareNews] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate share links",
      error: error.message,
    });
  }
};
