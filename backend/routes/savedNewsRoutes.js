const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  saveArticle,
  unsaveArticle,
  getSavedArticles,
  getCollections,
  moveToCollection,
  checkSaved,
  getSavedIds,
} = require("../controllers/savedNewsController");

// All routes protected
router.use(protect);

router.post("/save", saveArticle); // POST /api/saved/save
router.get("/", getSavedArticles); // GET  /api/saved?collection=Reading List
router.get("/collections", getCollections); // GET /api/saved/collections
router.get("/ids", getSavedIds); // GET /api/saved/ids
router.get("/check/:articleId", checkSaved); // GET /api/saved/check/:articleId
router.delete("/:articleId", unsaveArticle); // DELETE /api/saved/:articleId
router.patch("/:articleId/move", moveToCollection); // PATCH /api/saved/:articleId/move

module.exports = router;
