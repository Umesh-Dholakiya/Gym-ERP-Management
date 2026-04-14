const Lead = require('../models/Lead');
const FullMember = require('../models/FullMember');

// @desc    Get all leads for the gym with pagination and search
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { gymId: req.user.gymId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({ 
      success: true, 
      count: leads.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: leads 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    const { name, phone, fitnessGoal, source } = req.body;
    const lead = await Lead.create({
      name,
      phone,
      fitnessGoal,
      source,
      gymId: req.user.gymId
    });
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update lead status
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      req.body,
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Convert lead to member
// @route   POST /api/leads/:id/convert
// @access  Private
exports.convertLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Create a member based on lead data
    // (In a real app, you'd probably collect more info, but this is the logic)
    const member = await FullMember.create({
      personalInfo: {
        fullName: lead.name,
        mobile: lead.phone,
        email: '' // can be updated later
      },
      fitnessInfo: {
        fitnessGoal: [lead.fitnessGoal]
      },
      gymId: req.user.gymId
    });

    lead.status = 'Converted';
    await lead.save();

    res.json({ success: true, message: 'Lead converted to member successfully', data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Webhook to capture external lead (e.g., from WhatsApp / Meta Ads)
// @route   POST /api/leads/webhook/:gymId
// @access  Public
exports.webhookLeadCapture = async (req, res) => {
  try {
    const { gymId } = req.params;
    const { name, phone, fitnessGoal, source } = req.body;
    
    // Simulate finding gym to ensure it exists
    const Gym = require('../models/Gym');
    const gym = await Gym.findById(gymId);
    if (!gym) return res.status(404).json({ success: false, message: 'Gym not found' });

    const lead = await Lead.create({
      name: name || 'Unknown Digital Lead',
      phone: phone || 'Not Provided',
      fitnessGoal: fitnessGoal || 'General Inquiry',
      source: source || 'Instagram',
      gymId,
      status: 'New'
    });

    // Notify gym admins via sockets
    const io = req.app.get('io');
    if (io) {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification(io, {
        title: 'New Automated Lead!',
        message: `${lead.name} has shown interest via ${lead.source}.`,
        type: 'System',
        gymId: gymId,
        metadata: { leadId: lead._id }
      });
    }

    res.status(201).json({ success: true, data: lead });
  } catch(error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
