const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSummary } = require('../controllers/analyticsController');

router.use(protect);

router.get('/summary', getSummary); // GET /api/analytics/summary

module.exports = router;