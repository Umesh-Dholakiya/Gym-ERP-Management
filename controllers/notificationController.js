const InAppNotification = require('../models/InAppNotification');

// @desc    Get notifications for the logged in user (with pagination)
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const query = { 
      gymId: req.user.gymId,
      $or: [
        { userId: req.user._id },
        { userId: { $exists: false } },
        { userId: null }
      ]
    };

    const total = await InAppNotification.countDocuments(query);
    const notifications = await InAppNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({ 
      success: true, 
      count: notifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: notifications 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await InAppNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create a notification (System/Admin)
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;
    const notification = await InAppNotification.create({
      title,
      message,
      type,
      userId: userId || req.user._id,
      gymId: req.user.gymId
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
