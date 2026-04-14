const InAppNotification = require('../models/InAppNotification');

/**
 * Utility to create a notification in the DB and emit a socket event.
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Notification data { title, message, type, userId, gymId }
 */
const createNotification = async (io, data) => {
  try {
    // Validate required fields for the schema
    if (!data.userId || !data.gymId) {
      console.error('Missing userId or gymId for notification creation');
      return null;
    }

    const notification = new InAppNotification({
      title: data.title,
      message: data.message,
      type: data.type || 'System',
      userId: data.userId,
      gymId: data.gymId
    });
    
    await notification.save();
    
    if (io) {
      // Emit to the specific gym/user room if socket.io is configured that way
      // For now, simple emit to all (can be refined to io.to(gymId).emit)
      io.emit('new-notification', notification);
    }
    
    return notification;
  } catch (err) {
    console.error('Error creating in-app notification:', err);
    return null;
  }
};

module.exports = { createNotification };
