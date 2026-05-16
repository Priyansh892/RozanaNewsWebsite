const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // store refresh tokens (token id + expiry) for rotation and revocation
  refreshTokens: [
    {
      tokenId: { type: String },
      expiresAt: { type: Date },
    },
  ],
});
module.exports = mongoose.model("User", userSchema);
