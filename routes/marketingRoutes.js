const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  getLogs,
  createAndRunCampaign,
  deleteCampaign
} = require('../controllers/marketingController');

// Campaigns
router.route('/campaigns')
  .get(getCampaigns)
  .post(createAndRunCampaign);

router.route('/campaigns/:id')
  .delete(deleteCampaign);

// Logs
router.route('/logs')
  .get(getLogs);

module.exports = router;
