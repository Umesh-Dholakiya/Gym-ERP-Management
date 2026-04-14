const mongoose = require('mongoose');

const trainerSessionSchema = new mongoose.Schema({
  trainerName: {
    type: String,
    required: true,
  },
  assignedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  sessionDate: {
    type: Date,
    required: true,
  },
  durationMinutes: {
    type: Number,
    default: 60,
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  }
}, { timestamps: true });

const TrainerSession = mongoose.model('TrainerSession', trainerSessionSchema);
module.exports = TrainerSession;
