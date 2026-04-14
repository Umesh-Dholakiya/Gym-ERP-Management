const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/members — get all members with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', plan = '' } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (status) query.status = status;
    if (plan)   query.plan = plan;

    const total   = await User.countDocuments(query);
    const members = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ members, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  try {
    const member = await User.findById(req.params.id).select('-password');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/members — create new member
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, plan, status, joinDate } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const member = new User({
      name, email,
      password: 'changeme123',   // default password, member must reset
      phone, plan: plan || 'basic',
      status: status || 'active',
      joinDate: joinDate || new Date(),
    });
    await member.save();
    const saved = member.toObject();
    delete saved.password;
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/members/:id — update member
router.put('/:id', async (req, res) => {
  try {
    const { password, ...updates } = req.body;  // don't allow password reset here
    const member = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  try {
    const member = await User.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
