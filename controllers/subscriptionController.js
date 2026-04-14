const Gym = require('../models/Gym');

// @desc    Get current gym subscription plan
// @route   GET /api/subscription
// @access  Private (Admin only)
exports.getSubscription = async (req, res) => {
  try {
    let gym = await Gym.findById(req.user.gymId);
    if (!gym) {
      // Fallback for legacy admin users without a corresponding Gym document
      gym = { subscriptionPlan: 'premium', planExpiry: new Date(Date.now() + 31536000000) };
    }

    // Available plans info (Static for now)
    const plans = [
      { name: 'Basic', price: 99, features: ['Members Management', 'Attendance', 'Reports'] },
      { name: 'Standard', price: 199, features: ['All Basic', 'Inventory', 'Billing'] },
      { name: 'Premium', price: 299, features: ['All Standard', 'Marketing', 'Custom Branding'] }
    ];

    res.json({ 
      success: true, 
      data: {
        currentPlan: gym.subscriptionPlan || 'basic',
        expiryDate: gym.planExpiry || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        availablePlans: plans
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade/Downgrade subscription (UI only)
// @route   PUT /api/subscription
// @access  Private (Admin only)
exports.updateSubscription = async (req, res) => {
  try {
    const { planName } = req.body;
    const gym = await Gym.findByIdAndUpdate(
      req.user.gymId,
      { subscriptionPlan: planName.toLowerCase() },
      { new: true }
    );
    res.json({ success: true, message: `Plan updated to ${planName}`, data: gym });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
