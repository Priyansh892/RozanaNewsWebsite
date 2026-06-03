const mongoose = require("mongoose");

// ReadingHistory Schema
// Auto-logged when a user clicks on an article card.
// Drives Week 3 analytics: streaks, category breakdown, read counts.
// One document per read event — same article can appear multiple times
// (user may read the same article on different days).
const readingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // md5(url) — links back to the article consistently
    articleId: {
      type: String,
      required: true,
    },

    // Store minimal article info for display in history page
    // without needing to re-fetch from NewsAPI (which may have expired)
    title: { type: String, default: "" },
    url: { type: String, default: "" },
    urlToImage: { type: String, default: "" },
    source: {
      name: { type: String, default: "Unknown" },
    },

    // Category the article belonged to — used for analytics pie chart
    category: { type: String, default: "general" },

    // Exact timestamp of when the article was clicked
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // readAt is our timestamp — no need for createdAt/updatedAt
  },
);

// Indexes
// Fetch all history for a user sorted by time — most common query
readingHistorySchema.index({ userId: 1, readAt: -1 });

// Analytics: count reads per category per user
readingHistorySchema.index({ userId: 1, category: 1 });

// Streak calculation: find distinct days user read something
readingHistorySchema.index({ userId: 1, readAt: 1 });

module.exports = mongoose.model("ReadingHistory", readingHistorySchema);
