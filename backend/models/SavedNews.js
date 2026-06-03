const mongoose = require("mongoose");

// SavedNews Schema
// Stores articles that users explicitly save.
// articleId = md5(url) — stable unique identifier since NewsAPI has no article ID.
// collection — named reading list, defaults to "Reading List".
const savedNewsSchema = new mongoose.Schema(
  {
    // Who saved it
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Unique article identifier — md5(url)
    articleId: {
      type: String,
      required: true,
    },

    // Full article data stored locally so it persists after NewsAPI expiry (30 days)
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    urlToImage: { type: String, default: "" },
    publishedAt: { type: Date },
    author: { type: String, default: "Unknown" },
    source: {
      id: { type: String, default: null },
      name: { type: String, default: "Unknown" },
    },

    // Category the article was fetched under (business, sports, etc.)
    // Stored here so Week 3 analytics can group saved articles by category
    category: { type: String, default: "general" },

    // Named collection — "Reading List" is the default
    // Users can organize saves into named lists e.g. "My AI Reads", "Weekend"
    collectionName: {
      type: String,
      default: "Reading List",
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  },
);

// Compound unique index: one user can save each article only once
savedNewsSchema.index({ userId: 1, articleId: 1 }, { unique: true });

// Index for fetching all saves for a user fast
savedNewsSchema.index({ userId: 1, collectionName: 1 });

// Index for analytics — fetch by category per user
savedNewsSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model("SavedNews", savedNewsSchema);
