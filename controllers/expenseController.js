const Expense = require('../models/Expense');

// @desc    Get all expenses for the gym (with pagination/search)
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { gymId: req.user.gymId };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({ 
      success: true, 
      count: expenses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: expenses 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const expense = await Expense.create({
      title,
      amount,
      category,
      date,
      gymId: req.user.gymId
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get expense summary
// @route   GET /api/expenses/summary
// @access  Private
exports.getExpenseSummary = async (req, res) => {
  try {
    const summary = await Expense.aggregate([
      { $match: { gymId: req.user.gymId } },
      { 
        $group: { 
          _id: { $month: "$date" }, 
          totalAmount: { $sum: "$amount" } 
        } 
      },
      { $sort: { "_id": 1 } }
    ]);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
