const SavedNews = require("../models/SavedNews");
const { sanitizeArticle } = require("../utils/articleUtils");

// POST /api/saved/save
// Save an article. Defaults to "Reading List" collection.
// Returns 409 if already saved (duplicate index) with a friendly message.
exports.saveArticle = async (req, res) => {
  try {
    const { article, category, collectionName } = req.body;
    if (!article || !article.url) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Article with a valid URL is required",
        });
    }

    const sanitized = sanitizeArticle(article);

    const saved = await SavedNews.create({
      userId: req.user._id,
      ...sanitized,
      category: category || "general",
      collectionName: collectionName || "Reading List",
    });

    res.status(201).json({
      success: true,
      message: "Article saved successfully",
      saved,
    });
  } catch (error) {
    // Duplicate key — user already saved this article
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Article already saved",
      });
    }
    console.error("[saveArticle] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to save article",
        error: error.message,
      });
  }
};

// DELETE /api/saved/:articleId
// Unsave an article by its articleId (md5 hash)
exports.unsaveArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await SavedNews.findOneAndDelete({
      userId: req.user._id,
      articleId,
    });

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Saved article not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Article removed from saved" });
  } catch (error) {
    console.error("[unsaveArticle] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to unsave article",
        error: error.message,
      });
  }
};

// GET /api/saved
// Get all saved articles for the logged-in user
exports.getSavedArticles = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.collection) {
      filter.collectionName = req.query.collection;
    }

    const saved = await SavedNews.find(filter)
      .sort({ createdAt: -1 }) // newest saved first
      .select("-__v");

    res.status(200).json({
      success: true,
      count: saved.length,
      saved,
    });
  } catch (error) {
    console.error("[getSavedArticles] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch saved articles",
        error: error.message,
      });
  }
};

// GET /api/saved/collections
// Get all unique collection names for the logged-in user
// Used to populate the collections sidebar/dropdown
exports.getCollections = async (req, res) => {
  try {
    const collections = await SavedNews.distinct("collectionName", {
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      collections, // e.g. ["Reading List", "My AI Reads", "Weekend"]
    });
  } catch (error) {
    console.error("[getCollections] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch collections",
        error: error.message,
      });
  }
};

// PATCH /api/saved/:articleId/move
// Move a saved article to a different collection
exports.moveToCollection = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { collectionName } = req.body;

    if (!collectionName) {
      return res
        .status(400)
        .json({ success: false, message: "collectionName is required" });
    }

    const updated = await SavedNews.findOneAndUpdate(
      { userId: req.user._id, articleId },
      { collectionName },
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Saved article not found" });
    }

    res.status(200).json({
      success: true,
      message: `Moved to "${collectionName}"`,
      saved: updated,
    });
  } catch (error) {
    console.error("[moveToCollection] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to move article",
        error: error.message,
      });
  }
};

// GET /api/saved/ids
// Returns all saved articleIds for the user as a flat array
// Used by frontend to bulk-check saved state across all cards in one request
exports.getSavedIds = async (req, res) => {
  try {
    const saved = await SavedNews.find({ userId: req.user._id }).select(
      "articleId",
    );
    const ids = saved.map((s) => s.articleId);
    res.status(200).json({ success: true, ids });
  } catch (error) {
    console.error("[getSavedIds] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch saved IDs",
        error: error.message,
      });
  }
};

// GET /api/saved/check/:articleId
// Check if a specific article is already saved by the user
// Used by the frontend to show filled/outlined save icon on article cards
exports.checkSaved = async (req, res) => {
  try {
    const { articleId } = req.params;
    const saved = await SavedNews.findOne({
      userId: req.user._id,
      articleId,
    }).select("collectionName");

    res.status(200).json({
      success: true,
      isSaved: !!saved,
      collectionName: saved?.collectionName || null,
    });
  } catch (error) {
    console.error("[checkSaved] Error:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to check saved status",
        error: error.message,
      });
  }
};
