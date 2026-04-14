const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide gym name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide gym email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
  },
  logo: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    default: 'basic',
  },
  planExpiry: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000), // 30 days default
  }
}, { timestamps: true });

// Note: Password hashing will be handled in a pre-save hook 
// but since Gym owners will also have a User record for logging into the dashboard,
// we might want to sync them or just use User model for all logins.
// The prompt asked for email and password in Gym model too.

const bcrypt = require('bcryptjs');

gymSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

gymSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Gym', gymSchema);
