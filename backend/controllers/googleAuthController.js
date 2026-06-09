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

// Duplicated here so this file is self-contained.
// Consider extracting these four helpers into a shared auth.utils.js.
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

function cookieOptions() {
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
//   GET /api/auth/google
exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

// Step 2 — Google redirects back here with ?code=...
//   GET /api/auth/google/callback
//
// On success → sets the same HttpOnly JWT cookies as email/password login
//              → redirects client to /auth/google/success?user=<base64json>
// On failure → redirects to /login?error=google_auth_failed
exports.googleCallback = [
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:4200"}/login?error=google_auth_failed`,
  }),

  async (req, res) => {
    try {
      const user = req.user; // attached by Passport strategy

      const accessToken = generateAccessToken(user);
      const tokenId = crypto.randomBytes(32).toString("hex");
      await persistRefreshToken(user, tokenId);
      const refreshToken = generateRefreshToken(user, tokenId);

      res.cookie("accessToken", accessToken, {
        ...cookieOptions(),
        maxAge: parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN),
      });
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions(),
        maxAge: parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN),
      });

      const clientUser = {
        username: user.username,
        email: user.email,
      };
      const encoded = Buffer.from(JSON.stringify(clientUser)).toString(
        "base64",
      );

      const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
      res.redirect(`${clientUrl}/auth/google/success?user=${encoded}`);
    } catch (err) {
      console.error("Google callback error:", err);
      const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
      res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }
  },
];
