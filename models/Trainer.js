const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  trainerId: {
    type: String,
  },
  name: {
    type: String,
    required: [true, 'Trainer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dob: {
    type: Date
  },
  address: {
    type: String,
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  specialization: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0
  },
  certification: {
    type: String,
    default: ''
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Full Day'],
    default: 'Morning'
  },
  shiftTime: {
    type: String,
    default: '06:00 AM - 11:00 AM'
  },
  availabilityStatus: {
    type: String,
    enum: ['Active', 'On Leave'],
    default: 'Active'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
  }
}, { timestamps: true });

// Compound unique index for multi-tenancy
trainerSchema.index({ email: 1, gymId: 1 }, { unique: true });
trainerSchema.index({ phone: 1, gymId: 1 }, { unique: true });

// Auto-generate trainerId before saving
trainerSchema.pre('save', async function (next) {
  try {
    if (!this.trainerId) {
      const count = await this.constructor.countDocuments({ gymId: this.gymId });
      this.trainerId = `${this.gymId.toString().slice(-4).toUpperCase()}-TRN-${String(count + 1).padStart(3, '0')}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Trainer', trainerSchema);
