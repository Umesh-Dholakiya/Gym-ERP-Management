// Middleware to enforce plan-based access control
// Usage: router.get('/premium-route', authMiddleware, planMiddleware('premium'), ...)

const planMiddleware = (...allowedPlans) => {
  return (req, res, next) => {
    // req.user will be available here because this runs after authMiddleware
    if (!req.user || !req.user.plan) {
      return res.status(403).json({
        success: false,
        message: 'No plan assigned to user, access denied.',
      });
    }

    // Convert everything to lowercase for safety
    const userPlan = req.user.plan.toLowerCase();
    const plansAllowed = allowedPlans.map((plan) => plan.toLowerCase());

    if (!plansAllowed.includes(userPlan)) {
      return res.status(403).json({
        success: false,
        message: `Plan role '${req.user.plan}' is not authorized to access this route. Upgrades required.`,
      });
    }

    next();
  };
};

module.exports = planMiddleware;
