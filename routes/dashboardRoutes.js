const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// All routes are prefixed with /api/dashboard
router.get('/stats', dashboardController.getStats);
router.get('/revenue-trends', dashboardController.getRevenueTrends);
router.get('/activity', dashboardController.getRecentActivity);

module.exports = router;
