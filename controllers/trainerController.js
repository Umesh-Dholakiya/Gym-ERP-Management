const Trainer = require('../models/Trainer');
const FullMember = require('../models/FullMember');

// Get all trainers (with pagination, search and filters)
exports.getTrainers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { trainerId: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.shift && req.query.shift !== 'All') {
      query.shift = req.query.shift;
    }
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    const total = await Trainer.countDocuments(query);
    const trainers = await Trainer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    if (trainers.length === 0) {
      return res.json({ 
        success: true, 
        count: 0, 
        data: [],
        pagination: { total, page, limit, totalPages: 0 }
      });
    }

    // Faster enrichment using aggregation to count members for all trainers at once
    const trainerIds = trainers.map(t => t._id);
    const trainerNames = trainers.map(t => t.name);

    const counts = await FullMember.aggregate([
      { 
        $match: { 
          $or: [
            { 'trainerInfo.trainerId': { $in: trainerIds } },
            { 'trainerInfo.assignedTrainer': { $in: trainerNames } }
          ]
        } 
      },
      {
        $group: {
          _id: '$trainerInfo.trainerId',
          name: { $first: '$trainerInfo.assignedTrainer' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Map counts back to trainers
    const enrichedTrainers = trainers.map(trainer => {
      const match = counts.find(c => 
        (c._id && c._id.toString() === trainer._id.toString()) || 
        (c.name === trainer.name)
      );
      return { 
        ...trainer, 
        assignedMembersCount: match ? match.count : 0 
      };
    });

    res.json({ 
      success: true, 
      count: enrichedTrainers.length, 
      data: enrichedTrainers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching trainers:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


// Get single trainer
exports.getTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id).lean();
    if (!trainer) return res.status(404).json({ success: false, error: 'Trainer not found' });
    
    // Get assigned members (Using both ID and name as fallback)
    const members = await FullMember.find({ 
      $or: [
        { 'trainerInfo.trainerId': trainer._id },
        { 'trainerInfo.assignedTrainer': trainer.name }
      ]
    }).select('personalInfo identity attendanceInfo membershipInfo');
    
    res.json({ 
      success: true, 
      data: { 
        ...trainer, 
        assignedMembers: members,
        assignedMembersCount: members.length
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Create trainer
exports.createTrainer = async (req, res) => {
  try {
    // Check for unique mobile/email if not already handled by Mongoose
    const existingPhone = await Trainer.findOne({ phone: req.body.phone });
    if (existingPhone) return res.status(400).json({ success: false, error: 'Phone number already registered' });

    const existingEmail = await Trainer.findOne({ email: req.body.email });
    if (existingEmail) return res.status(400).json({ success: false, error: 'Email already registered' });

    const trainer = await Trainer.create(req.body);
    res.status(201).json({ success: true, data: trainer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Update trainer
exports.updateTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!trainer) return res.status(404).json({ success: false, error: 'Trainer not found' });
    res.json({ success: true, data: trainer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete trainer
exports.deleteTrainer = async (req, res) => {
  try {
    // Safety check: is trainer assigned to any members?
    const memberCount = await FullMember.countDocuments({ 'trainerInfo.trainerId': req.params.id });
    if (memberCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete trainer. There are ${memberCount} members assigned to this trainer. Please reassign them first.` 
      });
    }

    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, error: 'Trainer not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

