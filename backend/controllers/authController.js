const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");

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

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };
}

async function persistRefreshToken(user, tokenId) {
  const expiresAt = new Date(
    Date.now() + parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN),
  );
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ tokenId, expiresAt });
  // Prune expired tokens on every write to keep the array lean
  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.expiresAt > new Date(),
  );
  await user.save();
}

function parseExpiryToMs(exp) {
  const match = /^([0-9]+)([smhd])$/.exec(exp);
  if (!match) return 0;
  const v = Number(match[1]);
  const u = match[2];
  switch (u) {
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

exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res
        .status(400)
        .json({
          message: "All fields (username, password, and email) are required.",
        });
    }
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username is already taken." });
      }
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const accessToken = generateAccessToken(newUser);
    const tokenId = crypto.randomBytes(32).toString("hex");
    await persistRefreshToken(newUser, tokenId);
    const refreshToken = generateRefreshToken(newUser, tokenId);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions(),
      maxAge: parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN),
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions(),
      maxAge: parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN),
    });

    res
      .status(201)
      .json({ message: "User registered", user: { username, email } });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

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

    res
      .status(200)
      .json({
        message: "Login successful",
        user: { username: user.username, email: user.email },
      });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token)
      return res.status(401).json({ message: "Refresh token missing" });

    let payload;
    try {
      payload = jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { userId, tokenId } = payload;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const matched = (user.refreshTokens || []).find(
      (rt) => rt.tokenId === tokenId && rt.expiresAt > new Date(),
    );
    if (!matched) {
      return res
        .status(401)
        .json({ message: "Refresh token revoked or expired" });
    }

    // Rotate: remove old tokenId, issue new one
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.tokenId !== tokenId,
    );
    const newTokenId = crypto.randomBytes(32).toString("hex");
    await persistRefreshToken(user, newTokenId);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user, newTokenId);

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions(),
      maxAge: parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN),
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions(),
      maxAge: parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN),
    });

    res.status(200).json({ message: "Tokens refreshed" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Could not refresh token", error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      try {
        const payload = jwt.verify(token, REFRESH_SECRET);
        const { userId, tokenId } = payload;
        const user = await User.findById(userId);
        if (user) {
          user.refreshTokens = (user.refreshTokens || []).filter(
            (rt) => rt.tokenId !== tokenId,
          );
          await user.save();
        }
      } catch (e) {
        // Ignore invalid/expired token during logout - still clear cookies
      }
    }

    res.clearCookie("accessToken", cookieOptions());
    res.clearCookie("refreshToken", cookieOptions());
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { username, newPassword, confirmPassword } = req.body;
    if (!username || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if new password is the same as the current one.
    // Returns 409 so the frontend can show a specific message and prompt login.
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(409).json({
        message: "New password must be different from your current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    // Revoke all refresh tokens on password reset for security
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Reset failed", error: error.message });
  }
};

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshTokens",
  );
  if (user) {
    res.json({ _id: user._id, username: user.username, email: user.email });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
