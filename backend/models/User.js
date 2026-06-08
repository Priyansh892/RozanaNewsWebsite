const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  googleId: { type: String, default: null, unique: true, sparse: true },
  avatar: { type: String, default: null },

  refreshTokens: [
    {
      tokenId: { type: String },
      expiresAt: { type: Date },
    },
  ],

  // Personalization
  // Set during onboarding
  interests: {
    type: [String],
    default: [],
  },

  // Set during onboarding
  followedCountries: {
    type: [String],
    default: [],
  },

  // Custom keywords user follows (Follow chips on cards)
  followedTopics: {
    type: [String],
    default: [],
  },

  // Onboarding completion flag
  // false = show onboarding after register
  // true  = skip onboarding, go straight to /all-news
  onboardingDone: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
