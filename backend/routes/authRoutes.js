const express = require("express");
const router = express.Router();
const {
  register,
  login,
  resetPassword,
  logout,
  refreshToken,
} = require("../controllers/authController");

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", resetPassword);
router.post("/logout", logout);
// Refresh endpoint to obtain new access token using refresh token (cookie or body)
router.post("/refresh-token", refreshToken);

module.exports = router;
