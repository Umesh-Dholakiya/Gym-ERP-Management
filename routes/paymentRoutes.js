const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/add', paymentController.addPayment);
router.get('/member/:memberId', paymentController.getMemberPayments);

module.exports = router;
