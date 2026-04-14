const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, getExpenseSummary, deleteExpense } = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/summary', getExpenseSummary);
router.delete('/:id', deleteExpense);

module.exports = router;
