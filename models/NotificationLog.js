const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FullMember', required: true },
  type: { type: String, enum: ['WhatsApp', 'SMS', 'Email'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' },
  errorLogs: { type: String },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketingCampaign' }, // Optional, left blank if driven by cron automation
  triggerLogic: { type: String, enum: ['Bulk Campaign', 'Expiry Reminder', 'Payment Due', 'Birthday Wish'], default: 'Bulk Campaign' }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
