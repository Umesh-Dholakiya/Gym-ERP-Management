const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');

// --- Workout Plan Controllers ---
exports.getWorkoutPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ status: 'Active' }).sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// --- Diet Plan Controllers ---
exports.getDietPlans = async (req, res) => {
  try {
    const plans = await DietPlan.find({ status: 'Active' }).sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createDietPlan = async (req, res) => {
  try {
    const plan = await DietPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateDietPlan = async (req, res) => {
  try {
    const plan = await DietPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteDietPlan = async (req, res) => {
  try {
    const plan = await DietPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
