const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Flexibility'],
    required: true
  },
  exercises: [
    {
      name: String,
      sets: Number,
      reps: String,
      rest: String,
      notes: String
    }
  ],
  durationWeeks: {
    type: Number,
    default: 4
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
