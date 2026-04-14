const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Gym = require('../models/Gym');

// Generate JWT token including gymId and role
const generateToken = (id, gymId, role) => {
  return jwt.sign({ id, gymId, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new Gym & Owner
// @route   POST /api/auth/register
// @access  Public
const registerOwner = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;
    const phone = req.body.phone || '0000000000'; // Default phone if not provided

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if gym already exists with this email
    const gymExists = await Gym.findOne({ email });
    if (gymExists) {
      return res.status(400).json({ success: false, message: 'Gym with this email already exists' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // 1. Create Gym
    const gym = await Gym.create({
      name,
      email,
      password, // Password hashed in model hook
      phone,
      address,
      subscriptionPlan: 'premium' // Default for trial
    });

    // 2. Create Admin User for the Gym
    const user = await User.create({
      name,
      email,
      password, // Password hashed in model hook
      role: 'admin',
      gymId: gym._id
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gymId,
        token: generateToken(user._id, user.gymId, user.role),
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists (include password since select is false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          gymId: user.gymId,
          token: generateToken(user._id, user.gymId, user.role),
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('gymId');

    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          gymId: user.gymId ? (user.gymId._id || user.gymId) : null,
          gymName: user.gymId && user.gymId.name ? user.gymId.name : 'Unknown Gym',
          plan: user.gymId && user.gymId.subscriptionPlan ? user.gymId.subscriptionPlan : 'premium',
          permissions: user.permissions
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  registerOwner,
  loginUser,
  getMe
};
