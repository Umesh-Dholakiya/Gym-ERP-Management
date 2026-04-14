const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // Ensure password is not returned by default
  },
  systemPassword: {
    type: String // Insecure UI display requirement for demo
  },
  plan: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    default: 'basic',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'trainer', 'staff'],
    default: 'admin',
    required: true,
  },
  permissions: {
    type: Object,
    default: {
      members: ['view', 'create', 'edit', 'delete'],
      billing: ['view', 'create', 'edit', 'delete'],
      attendance: ['view', 'create', 'edit', 'delete'],
      inventory: ['view', 'create', 'edit', 'delete'],
      classes: ['view', 'create', 'edit', 'delete'],
      reports: ['view'],
      settings: ['view', 'edit']
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending'],
    default: 'active',
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
  }
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


const User = mongoose.model('User', userSchema);
module.exports = User;
