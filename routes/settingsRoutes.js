const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.route('/')
  .get(getSettings)
  .put(updateSettings)
  .post(updateSettings);

module.exports = router;
