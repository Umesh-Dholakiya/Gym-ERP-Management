const Gym = require('../models/Gym');

const planAccessConfig = {
  basic: [
    "dashboard",
    "members",
    "membership",
    "attendance",
    "trainers_view",
    "workout_basic",
    "billing"
  ],
  standard: [
    "dashboard",
    "members",
    "membership",
    "attendance",
    "trainers",
    "workout",
    "billing",
    "leads",
    "staff",
    "expenses",
    "reports_basic",
    "notifications_basic"
  ],
  premium: [
    "dashboard",
    "members",
    "membership",
    "attendance",
    "trainers",
    "workout",
    "billing",
    "leads",
    "staff",
    "expenses",
    "reports_advanced",
    "notifications_full",
    "subscription",
    "marketing",
    "inventory"
  ]
};

const checkPlanAccess = (moduleName) => {
  return async (req, res, next) => {
    try {
      const gym = await Gym.findById(req.user.gymId);
      
      if (!gym) {
        return res.status(404).json({ success: false, message: 'Gym not found' });
      }

      const currentPlan = gym.subscriptionPlan ? gym.subscriptionPlan.toLowerCase() : 'basic';
      
      // Ensure the plan exists in our config
      const allowedModules = planAccessConfig[currentPlan] || planAccessConfig['basic'];

      if (!allowedModules.includes(moduleName)) {
        return res.status(403).json({ 
          success: false, 
          message: 'This feature is not available in your current plan',
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      console.error('Plan Access Error:', error);
      res.status(500).json({ success: false, message: 'Error checking plan access' });
    }
  };
};

module.exports = {
  checkPlanAccess,
  planAccessConfig
};
