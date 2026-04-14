const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide expense title'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide amount'],
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
