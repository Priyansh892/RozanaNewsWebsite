const passport = require("passport");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const ACCESS_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY;
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET_KEY + "_refresh";

function generateAccessToken(user) {
  return jwt.sign({ userId: user._id }, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function generateRefreshToken(user, tokenId) {
  return jwt.sign({ userId: user._id, tokenId }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };
}

function parseExpiryToMs(exp) {
  const match = /^([0-9]+)([smhd])$/.exec(exp);
  if (!match) return 0;
  const v = Number(match[1]);
  switch (match[2]) {
    case "s":
      return v * 1000;
    case "m":
      return v * 60 * 1000;
    case "h":
      return v * 60 * 60 * 1000;
    case "d":
      return v * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

async function persistRefreshToken(user, tokenId) {
  const expiresAt = new Date(
    Date.now() + parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN),
  );
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ tokenId, expiresAt });
  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.expiresAt > new Date(),
  );
  await user.save();
}

// Step 1 — redirect to Google consent screen
exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

// Step 2 — Google redirects back here
exports.googleCallback = [
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:4200"}/login?error=google_auth_failed`,
  }),

  async (req, res) => {
    try {
      const user = req.user;

      const accessToken = generateAccessToken(user);
      const tokenId = crypto.randomBytes(32).toString("hex");
      await persistRefreshToken(user, tokenId);
      const refreshToken = generateRefreshToken(user, tokenId);

      // refreshToken → HttpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        ...refreshCookieOptions(),
        maxAge: parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN),
      });

      // accessToken + user info → redirect query params so Angular can store in memory
      const clientUser = { username: user.username, email: user.email };
      const encoded = Buffer.from(JSON.stringify(clientUser)).toString(
        "base64",
      );
      const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";

      res.redirect(
        `${clientUrl}/auth/google/success?user=${encoded}&accessToken=${accessToken}`,
      );
    } catch (err) {
      console.error("Google callback error:", err);
      const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
      res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }
  },
];
