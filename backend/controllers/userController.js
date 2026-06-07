const User = require("../models/User");
const ReadingHistory = require("../models/ReadingHistory");

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshTokens",
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
};

// POST /api/user/onboarding
// Called once after register - saves interests, countries, topics
exports.completeOnboarding = async (req, res) => {
  try {
    const {
      interests = [],
      followedCountries = [],
      followedTopics = [],
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        interests: interests.map((i) => i.toLowerCase().trim()),
        followedCountries: followedCountries.map((c) => c.toLowerCase().trim()),
        followedTopics: followedTopics.map((t) => t.toLowerCase().trim()),
        onboardingDone: true,
      },
      { new: true },
    ).select("-password -refreshTokens");

    res
      .status(200)
      .json({ success: true, message: "Onboarding complete", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Onboarding failed", error: error.message });
  }
};

// POST /api/user/follow-topic
exports.followTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const normalized = topic.toLowerCase().trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { followedTopics: normalized } },
      { new: true },
    ).select("followedTopics");

    res.status(200).json({
      success: true,
      message: `Now following "${normalized}"`,
      followedTopics: user.followedTopics,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to follow topic", error: error.message });
  }
};

// POST /api/user/unfollow-topic
exports.unfollowTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const normalized = topic.toLowerCase().trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { followedTopics: normalized } },
      { new: true },
    ).select("followedTopics");

    res.status(200).json({
      success: true,
      message: `Unfollowed "${normalized}"`,
      followedTopics: user.followedTopics,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to unfollow topic", error: error.message });
  }
};

// GET /api/user/topics
exports.getTopics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "interests followedCountries followedTopics onboardingDone",
    );
    res.status(200).json({ success: true, ...user.toObject() });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch topics", error: error.message });
  }
};

// PUT /api/user/interests
// Update interests/countries after onboarding
exports.updateInterests = async (req, res) => {
  try {
    const { interests = [], followedCountries = [] } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        interests: interests.map((i) => i.toLowerCase().trim()),
        followedCountries: followedCountries.map((c) => c.toLowerCase().trim()),
      },
      { new: true },
    ).select("interests followedCountries followedTopics");

    res.status(200).json({ success: true, user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update interests", error: error.message });
  }
};
