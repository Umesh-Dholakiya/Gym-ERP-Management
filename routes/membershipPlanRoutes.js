const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/membershipPlanController');

// GET  /api/plans/features  → list of available features
router.get('/features', ctrl.getFeatures);

// GET  /api/plans           → all plans
router.get('/', ctrl.getAllPlans);

// POST /api/plans           → create plan
router.post('/', ctrl.createPlan);

// PUT  /api/plans/:id       → update plan
router.put('/:id', ctrl.updatePlan);

// DELETE /api/plans/:id     → delete plan
router.delete('/:id', ctrl.deletePlan);

module.exports = router;
