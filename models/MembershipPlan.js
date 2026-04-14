const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than 0'],
    },
    duration: {
      value: {
        type: Number,
        required: [true, 'Validity in months is required'],
        min: [1, 'Validity must be at least 1 month'],
      },
      unit: {
        type: String,
        default: 'months',
      },
    },
    features: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
    }
  },
  { timestamps: true }
);

// Compound index for uniqueness per gym
membershipPlanSchema.index({ name: 1, gymId: 1 }, { unique: true });
membershipPlanSchema.index({ isActive: 1 });
membershipPlanSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
