const mongoose = require('mongoose');

/**
 * GymSettings — stores all configurable options:
 *   trainers, batchTimings, workoutPlans, membershipPlans, paymentModes
 * 
 * One document per gym (singleton pattern).
 */
const GymSettingsSchema = new mongoose.Schema({
  gymName: { type: String, default: 'URBAN-FIT GYM & SPA' },
  website: { type: String, default: 'www.urbanfit.com' },
  trainers: [
    {
      name:       { type: String, required: true },
      phone:      { type: String },
      speciality: { type: String },
      active:     { type: Boolean, default: true },
    }
  ],
  batchTimings: [
    {
      label: { type: String, required: true },  // e.g. "Morning 6:00 AM"
      time:  { type: String },                  // e.g. "06:00"
      active:{ type: Boolean, default: true },
    }
  ],
  workoutPlans: [
    {
      name:        { type: String, required: true },  // e.g. "Weight Loss 3-Day"
      description: { type: String },
      active:      { type: Boolean, default: true },
    }
  ],
  membershipPlans: [
    {
      name:     { type: String, required: true },   // e.g. "Monthly"
      duration: { type: Number, required: true },   // days
      price:    { type: Number, default: 0 },
      active:   { type: Boolean, default: true },
    }
  ],
  paymentModes: [
    { label: String, active: { type: Boolean, default: true } }
  ],
}, { timestamps: true });

module.exports = mongoose.model('GymSettings', GymSettingsSchema);
