// const jwt = require('jsonwebtoken');
// const User = require('../models/User');  // Assuming your model is in the 'models' directory
// const mongoose = require('mongoose');

// exports.protect = async (req, res, next) => {
//   try {
//     // Extract token from cookies or authorization header
//     const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

//     if (!token) {
//       return res.status(403).json({ error: 'No token provided' });
//     }

//     // Verify the token
//     jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
//       if (err) {
//         return res.status(401).json({ error: 'Invalid token' });
//       }

//       // decoded._id should be a valid ObjectId
//       if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
//         return res.status(400).json({ error: 'Invalid user ID in token' });
//       }

//       // Attach userId (ObjectId) to the request object
//       req.userId = decoded._id;

//       // Optionally, you could fetch the user from the database to confirm existence and status
//       const user = await User.findById(req.userId);
//       if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//       }

//       // Proceed to the next middleware or route handler
//       next();
//     });
//   } catch (error) {
//     return res.status(500).json({ error: 'An error occurred while verifying the token' });
//   }
// };

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

// Protect middleware: expects a short-lived access token in cookie `accessToken` or
// Authorization header Bearer <token>. Verifies and attaches `req.user`.
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const tokenFromHeader =
      authHeader && authHeader.split(" ")[0] === "Bearer"
        ? authHeader.split(" ")[1]
        : null;
    const token = req.cookies.accessToken || tokenFromHeader;

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

    // Expect payload to contain user id as `userId` or nested `user._id`
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
