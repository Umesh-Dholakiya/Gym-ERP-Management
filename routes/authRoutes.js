const express = require('express');
const router = express.Router();
const { registerOwner, loginUser, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', registerOwner);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getMe);

module.exports = router;
