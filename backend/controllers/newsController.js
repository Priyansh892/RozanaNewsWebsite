const axios = require("axios");
const { buildKey, withCache } = require("../utils/cacheUtils");
const SavedNews = require('../models/SavedNews');
const User=require('../models/User');
async function makeApiRequest(url) {
  try {
    const response = await axios.get(url);
    return {
      status: 200,
      success: true,
      message: "Successfully fetched the data",
      data: response.data,
    };
  } catch (error) {
    console.error(
      "[NewsAPI] Request error:",
      error.response?.data || error.message,
    );
    return {
      status: 500,
      success: false,
      message: "Failed to fetch data from the News API",
      error: error.response?.data || error.message,
    };
  }
}

exports.getAllNews = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 80;
  const q = req.query.q || "world";

  const cacheKey = buildKey.allNews(q, page, pageSize);

  const result = await withCache(cacheKey, () => {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.NEWS_API_KEY}`;
    return makeApiRequest(url);
  });

  res.status(result.status).json(result);
};

exports.getTopHeadlines = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 80;
  const category = req.query.category || "general";

  const cacheKey = buildKey.headlines(category, page, pageSize);

  const result = await withCache(cacheKey, () => {
    const url = `https://newsapi.org/v2/top-headlines?category=${category}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.NEWS_API_KEY}`;
    return makeApiRequest(url);
  });

  res.status(result.status).json(result);
};

exports.getTopHeadlinesByCountry = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 80;
  const country = req.params.iso;

  const cacheKey = buildKey.country(country, page, pageSize);

  const result = await withCache(cacheKey, () => {
    const url = `https://newsapi.org/v2/top-headlines?country=${country}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.NEWS_API_KEY}`;
    return makeApiRequest(url);
  });

  res.status(result.status).json(result);
};

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

// exports.saveNews = async (req, res) => {
//   try {
//     // Extract news data from request body
//     const { title, description, url, urlToImage, publishedAt, author, source } = req.body;
//     const userId = req.userId;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: User ID is missing"
//       });
//     }

//     // Create a new news document
//     const news = new SavedNews({
//       title,
//       description,
//       url,
//       urlToImage,
//       publishedAt,
//       author,
//       source,
//       userId,
//     });

//     // Save the news document to the database
//     await news.save();

//     // Respond with success
//     res.status(201).json({
//       success: true,
//       message: "News saved successfully!",
//       news,
//     });
//   } catch (error) {
//     console.error("Error saving news:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to save news",
//       error: error.message,
//     });
//   }
// };

// exports.getSavedNews = async (req, res) => {
//   try {
//     const userId = req.userId;
//     // Find all saved news for the user
//     const savedNews = await SavedNews.find({ userId });
//     res.status(200).json({
//       success: true,
//       news: savedNews
//     });
//   } catch (error) {
//     console.error("Error fetching saved news:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch saved news",
//       error: error.message,
//     });
//   }
// };
