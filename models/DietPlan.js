const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  description: String,
  goal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Keto', 'Vegan', 'Intermittent Fasting'],
    required: true
  },
  meals: [
    {
      time: String,
      mealName: String,
      items: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number
    }
  ],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFats: Number,
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
