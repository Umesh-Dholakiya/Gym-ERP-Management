const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide lead name'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
  },
  fitnessGoal: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    enum: ['Instagram', 'Walk-in', 'Referral', 'Other'],
    default: 'Walk-in',
  },
  status: {
    type: String,
    enum: ['New', 'Follow-up', 'Converted', 'Lost'],
    default: 'New',
  },
  reminded: {
    type: Boolean,
    default: false
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
