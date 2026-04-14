const express = require('express');
const router = express.Router();
const { 
  getWorkoutPlans, 
  createWorkoutPlan, 
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getDietPlans, 
  createDietPlan,
  updateDietPlan,
  deleteDietPlan
} = require('../controllers/planController');

// Workout Plans
router.route('/workouts')
  .get(getWorkoutPlans)
  .post(createWorkoutPlan);

router.route('/workouts/:id')
  .put(updateWorkoutPlan)
  .delete(deleteWorkoutPlan);

// Diet Plans
router.route('/diets')
  .get(getDietPlans)
  .post(createDietPlan);

router.route('/diets/:id')
  .put(updateDietPlan)
  .delete(deleteDietPlan);

module.exports = router;
