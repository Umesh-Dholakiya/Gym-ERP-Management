const express = require('express');
const router = express.Router();
const { getLeads, createLead, updateLead, convertLead, deleteLead } = require('../controllers/leadController');
const authMiddleware = require('../middleware/authMiddleware');

// Webhook must be accessible publicly (requires no JWT)
router.post('/webhook/:gymId', require('../controllers/leadController').webhookLeadCapture);

router.use(authMiddleware);

router.get('/', getLeads);
router.post('/', createLead);
router.put('/:id', updateLead);
router.post('/:id/convert', convertLead);
router.delete('/:id', deleteLead);

module.exports = router;
