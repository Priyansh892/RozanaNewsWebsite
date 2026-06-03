const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  logRead,
  getHistory,
  clearHistory,
  removeFromHistory,
} = require("../controllers/historyController");

// All routes protected
router.use(protect);

router.post("/log", logRead); // POST /api/history/log
router.get("/", getHistory); // GET /api/history?page=1&limit=20
router.delete("/", clearHistory); // DELETE /api/history
router.delete("/:articleId", removeFromHistory); // DELETE /api/history/:articleId

module.exports = router;
