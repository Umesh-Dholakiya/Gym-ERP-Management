const mongoose = require('mongoose');

const inAppNotificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Member', 'Payment', 'Expiry', 'System', 'Lead', 'Expense'], 
    default: 'System' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false
  },
  gymId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Gym',
    required: true
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('InAppNotification', inAppNotificationSchema);
