const express = require('express');
const router  = express.Router();
const GymSettings = require('../models/GymSettings');

// Helper: get/create singleton settings doc
const getSettings = async () => {
  let settings = await GymSettings.findOne();
  if (!settings) {
    settings = await GymSettings.create({
      trainers: [],
      batchTimings: [
        { label: 'Morning 6:00 AM',  time: '06:00', active: true },
        { label: 'Morning 8:00 AM',  time: '08:00', active: true },
        { label: 'Evening 5:00 PM',  time: '17:00', active: true },
        { label: 'Evening 7:00 PM',  time: '19:00', active: true },
      ],
      workoutPlans: [
        { name: 'Weight Loss 3-Day',  description: 'Fat burn cardio + weights', active: true },
        { name: 'Muscle Building 5-Day', description: 'Strength training split', active: true },
        { name: 'General Fitness',   description: 'Full body workout', active: true },
      ],
      membershipPlans: [
        { name: 'Monthly',     duration: 30,  price: 1500, active: true },
        { name: 'Quarterly',   duration: 90,  price: 4000, active: true },
        { name: 'Half-Yearly', duration: 180, price: 7000, active: true },
        { name: 'Yearly',      duration: 365, price: 12000, active: true },
      ],
      paymentModes: [
        { label: 'Cash', active: true },
        { label: 'UPI',  active: true },
        { label: 'Card', active: true },
        { label: 'Net Banking', active: true },
      ],
    });
  }
  return settings;
};

// GET /api/gym-settings — fetch all settings
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/gym-settings — update top-level settings (gymName, website, etc.)
router.put('/', async (req, res) => {
  try {
    const settings = await getSettings();
    const { gymName, website } = req.body;
    if (gymName) settings.gymName = gymName;
    if (website) settings.website = website;
    await settings.save();
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── TRAINERS ──────────────────────────────────────────────────────────────────
router.post('/trainers', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.trainers.push(req.body);
    await settings.save();
    res.json(settings.trainers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/trainers/:tid', async (req, res) => {
  try {
    const settings = await getSettings();
    const t = settings.trainers.id(req.params.tid);
    if (!t) return res.status(404).json({ message: 'Trainer not found' });
    Object.assign(t, req.body);
    await settings.save();
    res.json(settings.trainers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/trainers/:tid', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.trainers.pull({ _id: req.params.tid });
    await settings.save();
    res.json(settings.trainers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── BATCH TIMINGS ─────────────────────────────────────────────────────────────
router.post('/batch-timings', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.batchTimings.push(req.body);
    await settings.save();
    res.json(settings.batchTimings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/batch-timings/:bid', async (req, res) => {
  try {
    const settings = await getSettings();
    const b = settings.batchTimings.id(req.params.bid);
    if (!b) return res.status(404).json({ message: 'Batch not found' });
    Object.assign(b, req.body);
    await settings.save();
    res.json(settings.batchTimings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/batch-timings/:bid', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.batchTimings.pull({ _id: req.params.bid });
    await settings.save();
    res.json(settings.batchTimings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── WORKOUT PLANS ─────────────────────────────────────────────────────────────
router.post('/workout-plans', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.workoutPlans.push(req.body);
    await settings.save();
    res.json(settings.workoutPlans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/workout-plans/:wid', async (req, res) => {
  try {
    const settings = await getSettings();
    const w = settings.workoutPlans.id(req.params.wid);
    if (!w) return res.status(404).json({ message: 'Plan not found' });
    Object.assign(w, req.body);
    await settings.save();
    res.json(settings.workoutPlans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/workout-plans/:wid', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.workoutPlans.pull({ _id: req.params.wid });
    await settings.save();
    res.json(settings.workoutPlans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── MEMBERSHIP PLANS ──────────────────────────────────────────────────────────
router.post('/membership-plans', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.membershipPlans.push(req.body);
    await settings.save();
    res.json(settings.membershipPlans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/membership-plans/:mid', async (req, res) => {
  try {
    const settings = await getSettings();
    const m = settings.membershipPlans.id(req.params.mid);
    if (!m) return res.status(404).json({ message: 'Plan not found' });
    Object.assign(m, req.body);
    await settings.save();
    res.json(settings.membershipPlans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/membership-plans/:mid', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.membershipPlans.pull({ _id: req.params.mid });
    await settings.save();
    res.json(settings.membershipPlans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
