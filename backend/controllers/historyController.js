const ReadingHistory = require("../models/ReadingHistory");
const { generateArticleId } = require("../utils/articleUtils");

// POST /api/history/log
// Auto-called when user clicks an article card on the frontend.
// Logs silently - does not block the user from opening the article.
// Prevents duplicate logs within 1 hour (same user + same article).
exports.logRead = async (req, res) => {
  try {
    const { article, category } = req.body;
    if (!article || !article.url) {
      return res
        .status(400)
        .json({ success: false, message: "Article URL is required" });
    }

    const articleId = generateArticleId(article.url);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Deduplicate: don't log the same article twice within 1 hour
    const recentRead = await ReadingHistory.findOne({
      userId: req.user._id,
      articleId,
      readAt: { $gte: oneHourAgo },
    });

    if (recentRead) {
      return res
        .status(200)
        .json({ success: true, message: "Already logged recently" });
    }

    await ReadingHistory.create({
      userId: req.user._id,
      articleId,
      title: article.title || "",
      url: article.url,
      urlToImage: article.urlToImage || "",
      source: { name: article.source?.name || "Unknown" },
      category: category || "general",
    });

    res.status(201).json({ success: true, message: "Read logged" });
  } catch (error) {
    console.error("[logRead] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to log read",
        error: error.message,
      });
  }
};

// GET /api/history
// Get reading history for the logged-in user
exports.getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const history = await ReadingHistory.find({ userId: req.user._id })
      .sort({ readAt: -1 }) // most recent first
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await ReadingHistory.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      history,
    });
  } catch (error) {
    console.error("[getHistory] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch history",
        error: error.message,
      });
  }
};

// DELETE /api/history
// Clear all reading history for the logged-in user
exports.clearHistory = async (req, res) => {
  try {
    await ReadingHistory.deleteMany({ userId: req.user._id });
    res.status(200).json({ success: true, message: "Reading history cleared" });
  } catch (error) {
    console.error("[clearHistory] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to clear history",
        error: error.message,
      });
  }
};

// DELETE /api/history/:articleId
// Remove a single article from reading history
exports.removeFromHistory = async (req, res) => {
  try {
    const { articleId } = req.params;
    await ReadingHistory.deleteMany({
      userId: req.user._id,
      articleId,
    });
    res
      .status(200)
      .json({ success: true, message: "Article removed from history" });
  } catch (error) {
    console.error("[removeFromHistory] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to remove from history",
        error: error.message,
      });
  }
};
