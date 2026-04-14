const express = require('express');
const router = express.Router();

const GymProfile = require('../models/GymProfile');

// GET /api/gym/info — returns dynamic gym branding/plan info from MongoDB
router.get('/info', async (req, res) => {
  try {
    let settings = await GymProfile.findOne();
    if (!settings) {
      settings = await GymProfile.create({});
    }
    res.json({
      gymName: settings.gymName,
      logoUrl: settings.logoUrl,
      plan: settings.planControl?.tier || 'Premium',
      roleSettings: settings.roleSettings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gym info' });
  }
});

module.exports = router;
