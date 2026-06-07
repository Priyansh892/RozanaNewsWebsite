const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getProfile,
  completeOnboarding,
  followTopic,
  unfollowTopic,
  getTopics,
  updateInterests,
} = require("../controllers/userController");

router.use(protect);

router.get("/profile", getProfile);
router.post("/onboarding", completeOnboarding);
router.get("/topics", getTopics);
router.put("/interests", updateInterests);
router.post("/follow-topic", followTopic);
router.post("/unfollow-topic", unfollowTopic);

module.exports = router;
