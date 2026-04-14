const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FullMember = require('../models/FullMember');
const Payment = require('../models/Payment');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym-erp';

const clear = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🧹 Connected to MongoDB for cleanup');

    const memberResult = await FullMember.deleteMany({});
    const paymentResult = await Payment.deleteMany({});

    console.log(`✅ Cleared ${memberResult.deletedCount} members`);
    console.log(`✅ Cleared ${paymentResult.deletedCount} payments`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup error:', err);
    process.exit(1);
  }
};

clear();
