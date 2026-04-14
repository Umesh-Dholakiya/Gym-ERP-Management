const express = require('express');
const router = express.Router();
const { getSubscription, updateSubscription } = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getSubscription);
router.put('/', updateSubscription);

module.exports = router;
