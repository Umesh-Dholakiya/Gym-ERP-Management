const mongoose = require('mongoose');

const marketingCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['WhatsApp', 'SMS', 'Email'], required: true },
  audience: { type: String, enum: ['All Members', 'Active Members', 'Expired Members', 'Specific Plan Members'], required: true },
  message: { type: String, required: true },
  scheduleTime: { type: Date },
  status: { type: String, enum: ['scheduled', 'running', 'completed', 'failed'], default: 'scheduled' },
  audienceCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('MarketingCampaign', marketingCampaignSchema);
