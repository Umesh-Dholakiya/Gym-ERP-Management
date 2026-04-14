const MembershipPlan = require('../models/MembershipPlan');
const FullMember = require('../models/FullMember');
const { paginateQuery } = require('../utils/queryHelper');

// ── Available Features List ────────────────────────────────────────────────────
const AVAILABLE_FEATURES = [
  'Attendance',
  'Trainer Access',
  'Diet Plan',
  'Inventory Access',
  'Workout Plan',
  'Reports',
  'Massage',
  'Locker',
];

// GET /api/plans/features — return master list of features
exports.getFeatures = (req, res) => {
  res.json({ success: true, features: AVAILABLE_FEATURES });
};

// GET /api/plans — all plans (Paginated, Searchable, Sortable)
exports.getAllPlans = async (req, res) => {
  try {
    const { status, minPrice, maxPrice, minValidity, maxValidity } = req.query;
    let baseQuery = {};

    // Filters
    if (status) baseQuery.isActive = status === 'Active';
    if (minPrice || maxPrice) {
      baseQuery.price = {};
      if (minPrice) baseQuery.price.$gte = Number(minPrice);
      if (maxPrice) baseQuery.price.$lte = Number(maxPrice);
    }
    if (minValidity || maxValidity) {
      baseQuery['duration.value'] = {};
      if (minValidity) baseQuery['duration.value'].$gte = Number(minValidity);
      if (maxValidity) baseQuery['duration.value'].$lte = Number(maxValidity);
    }

    const response = await paginateQuery(MembershipPlan, {
      ...req.query,
      searchFields: ['name'],
      baseQuery
    });

    // Add usage count for each plan
    const enhancedData = await Promise.all(response.data.map(async (plan) => {
      const usageCount = await FullMember.countDocuments({ 'membershipInfo.planName': plan.name });
      return { ...plan, usageCount };
    }));

    res.json({ 
      success: true, 
      data: enhancedData, 
      pagination: response.pagination 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/plans — create plan
exports.createPlan = async (req, res) => {
  try {
    const { name, price, duration, features, description, isActive } = req.body;

    // Check if plan name exists (Case-Insensitive)
    const existingPlan = await MembershipPlan.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    if (existingPlan) {
      return res.status(400).json({ 
        success: false, 
        message: 'This plan name is already architected. Try another identity.',
        field: 'name'
      });
    }

    const plan = await MembershipPlan.create({ 
      name, 
      price, 
      duration, 
      features, 
      description,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, data: plan, message: 'Plan created successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/plans/:id — update plan
exports.updatePlan = async (req, res) => {
  try {
    const { name, price, duration, features, description, isActive } = req.body;
    
    // Fetch the target plan to check for changes
    const targetPlan = await MembershipPlan.findById(req.params.id);
    if (!targetPlan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Only check name uniqueness if the name is actually being changed
    if (name && name.trim().toLowerCase() !== targetPlan.name.toLowerCase()) {
      const existingPlan = await MembershipPlan.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, 
        _id: { $ne: req.params.id } 
      });
      if (existingPlan) {
        return res.status(400).json({ 
          success: false, 
          message: 'Already exists', 
          field: 'name' 
        });
      }
    }

    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      { name, price, duration, features, description, isActive },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: plan, message: 'Plan updated successfully' });
  } catch (err) {
    console.error("Update validation error:", err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE /api/plans/:id — Safe delete (check for usage)
exports.deletePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Check if any member is using this plan
    const memberCount = await FullMember.countDocuments({ 'membershipInfo.planName': plan.name });
    if (memberCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Deletion blocked: This plan is currently assigned to ${memberCount} members.` 
      });
    }

    await MembershipPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
