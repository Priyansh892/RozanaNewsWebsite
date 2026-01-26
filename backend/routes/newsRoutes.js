const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// News fetching routes
router.get('/all-news', newsController.getAllNews);                     // GET /api/news?q=world&page=1&pageSize=80
router.get('/top-headlines', newsController.getTopHeadlines); // GET /api/news/top-headlines?category=general&page=1&pageSize=80
router.get('/country/:iso', newsController.getTopHeadlinesByCountry); // GET /api/news/top-headlines/us

// Social sharing
router.post('/share-news', newsController.shareNews);              // POST /api/news/share

// Uncomment if you implement saving news
// router.post('/save', newsController.saveNews);             // POST /api/news/save
// router.get('/saved', newsController.getSavedNews);         // GET /api/news/saved

module.exports = router;
