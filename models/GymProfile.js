const mongoose = require('mongoose');

const gymProfileSchema = new mongoose.Schema({
  // 1. Gym Profile Section
  gymName: { type: String, default: 'URBAN-FIT GYM & SPA', required: true },
  logoUrl: { type: String, default: '' },
  ownerName: { type: String, default: 'Admin User' },
  ownerEmail: { type: String, default: 'admin@gyml.com' },
  phone: { type: String, default: '+919000000000' },
  addressLine: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: 'India' },
  pincode: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  description: { type: String, default: '' },

  // 2. Account & Notifications Config
  enableNotifications: { type: Boolean, default: true },
  notificationEmail: { type: String, default: '' },

  // 3. Integration Settings
  integrations: {
    whatsapp: {
      provider: { type: String, enum: ['Twilio', 'Meta Cloud'], default: 'Twilio' },
      apiKey: { type: String, default: '' },
      phoneNumberId: { type: String, default: '' }, // For Meta or Twilio "From" number
      authToken: { type: String, default: '' },      // Usually for Twilio
    },
    sms: {
      provider: { type: String, default: 'Twilio' },
      apiKey: { type: String, default: '' },
      apiSecret: { type: String, default: '' },
      senderId: { type: String, default: '' },
    },
    smtp: {
      host: { type: String, default: 'smtp.gmail.com' },
      port: { type: Number, default: 587 },
      user: { type: String, default: '' },
      password: { type: String, default: '' },
    },
    paymentGateway: {
      provider: { type: String, enum: ['Razorpay', 'Stripe'], default: 'Razorpay' },
      keyId: { type: String, default: '' },
      keySecret: { type: String, default: '' },
    }
  },

  // 4 & 5. Role Settings & Plan controls
  // This helps toggle global UI features based on subscription limits.
  planControl: {
    tier: { type: String, enum: ['Basic', 'Standard', 'Premium'], default: 'Premium' }
  },

  // NEW: Deep role-based module access control (Premium feature)
  // Maps Role Name -> List of allowed modules
  roleSettings: {
    admin:   [{ type: String, default: 'all' }],
    staff:   [{ type: String, default: 'members' }, { type: String, default: 'attendance' }, { type: String, default: 'billing' }],
    trainer: [{ type: String, default: 'workout' }, { type: String, default: 'diet' }, { type: String, default: 'attendance' }]
  }
}, { timestamps: true });

module.exports = mongoose.model('GymProfile', gymProfileSchema);
