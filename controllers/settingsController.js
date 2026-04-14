const GymProfile = require('../models/GymProfile');

exports.getSettings = async (req, res) => {
  try {
    let settings = await GymProfile.findOne();
    if (!settings) {
      settings = await GymProfile.create({});
    }
    // Return sanitized integration passwords/auth if necessary in a real app
    // Here we return everything raw as this is an Admin only route conceptually.
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await GymProfile.findOne();
    if (!settings) {
      settings = await GymProfile.create({});
    }

    // Merge deeply (especially for integrations object)
    // Overwriting keys
    const updated = await GymProfile.findByIdAndUpdate(settings._id, req.body, { new: true, runValidators: true });
    
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
