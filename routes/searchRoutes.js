const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * @route GET /api/search/global
 */
router.get('/global', searchController.globalSearch);

module.exports = router;
