const crypto = require("crypto");

// Article ID
// NewsAPI doesn't provide a unique ID per article - only a URL.
// We generate a stable md5 hash of the URL to use as a consistent identifier
// across saved articles, reading history, reactions, and comments.

function generateArticleId(url) {
  if (!url) throw new Error("URL is required to generate article ID");
  return crypto.createHash("md5").update(url).digest("hex");
}

// Article Sanitizer
// Strips out null/undefined fields from NewsAPI response before storing
// Ensures consistent shape in MongoDB regardless of what NewsAPI returns
function sanitizeArticle(article) {
  return {
    articleId: generateArticleId(article.url),
    title: article.title || "",
    description: article.description || "",
    url: article.url || "",
    urlToImage: article.urlToImage || "",
    publishedAt: article.publishedAt
      ? new Date(article.publishedAt)
      : new Date(),
    author: article.author || "Unknown",
    source: {
      id: article.source?.id || null,
      name: article.source?.name || "Unknown",
    },
  };
}

module.exports = { generateArticleId, sanitizeArticle };
