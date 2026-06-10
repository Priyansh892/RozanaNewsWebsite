const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

// Protect middleware: expects accessToken as Bearer token in Authorization header.
// The token is stored in memory by AuthService and attached to every request
// by the Angular AuthInterceptor via: Authorization: Bearer <token>
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token =
      authHeader && authHeader.split(" ")[0] === "Bearer"
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res.status(401).json({ error: "Access token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY,
      );
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Access token expired" });
      }
      return res.status(401).json({ error: "Invalid access token" });
    }

    const userId =
      decoded.userId || (decoded.user && decoded.user._id) || decoded._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id in token" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while verifying the token" });
  }
};
