const express = require('express');
const router = express.Router();
const {
  register,
  login,
  resetPassword,
  logout
} = require('../controllers/authController');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', resetPassword);
router.post('/logout', logout);

module.exports = router;
