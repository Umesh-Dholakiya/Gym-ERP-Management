const User = require('../models/User');

// @desc    Get all staff/trainers for the gym (with pagination/search)
// @route   GET /api/staff
// @access  Private (Admin only)
exports.getStaff = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {
      gymId: req.user.gymId,
      role: { $in: ['staff', 'trainer'] }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const staff = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: staff.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: staff
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new staff members
// @route   POST /api/staff
// @access  Private (Admin only)
exports.createStaff = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { name, email, password, role, permissions } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const payload = {
      name,
      email,
      password,
      systemPassword: password, // For UI demo display purposes
      role: role || 'staff',
      gymId: req.user.gymId
    };
    if (permissions) payload.permissions = permissions;

    const staff = await User.create(payload);
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private (Admin only)
exports.updateStaff = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const staff = await User.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    // Update fields manually so pre.save fires for password hashing
    const updates = Object.keys(req.body);
    updates.forEach((update) => {
      staff[update] = req.body[update];
      if (update === 'password') {
        staff.systemPassword = req.body.password; // Sync plain text
      }
    });

    await staff.save();
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private (Admin only)
exports.deleteStaff = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const staff = await User.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
