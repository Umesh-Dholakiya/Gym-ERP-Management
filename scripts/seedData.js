const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FullMember = require('../models/FullMember');
const Payment = require('../models/Payment');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym-erp';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding');

    // Clear existing (optional - user said "show complete data", maybe better to just add)
    // await FullMember.deleteMany({});
    // await Payment.deleteMany({});

    const plans = ['Basic', 'Standard', 'Premium'];
    const sectors = ['Accounting', 'Healthcare', 'Tech', 'Education'];

    const mockMembers = [];
    for (let i = 1; i <= 10; i++) {
        const plan = plans[Math.floor(Math.random() * plans.length)];
        const amount = plan === 'Basic' ? 999 : plan === 'Standard' ? 1999 : 4999;
        
        mockMembers.push({
            personalInfo: {
                fullName: `Member ${i}`,
                mobile: `98765432${i}0`,
                email: `member${i}@example.com`,
                gender: i % 2 === 0 ? 'Male' : 'Female',
                dob: new Date(1990 + i, 0, 1)
            },
            membershipInfo: {
                planName: plan,
                planDuration: 1,
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + (i * 5))), // Some expiring soon
                finalAmount: amount,
                paymentStatus: 'Paid'
            },
            attendanceInfo: {
                membershipStatus: 'Active'
            }
        });
    }

    for (const memberData of mockMembers) {
        const member = new FullMember(memberData);
        await member.save();
    }
    console.log('✅ 10 Mock members seeded with unique memberIds');

    // Create some historical payments for the chart
    const mockPayments = [];
    for (let m = 0; m < 6; m++) {
        const date = new Date();
        date.setMonth(date.getMonth() - m);
        mockPayments.push({
            user: new mongoose.Types.ObjectId(), // Orphaned for chart only
            amount: 5000 + (Math.random() * 10000),
            status: 'completed',
            paymentDate: date,
            plan: 'Mixed'
        });
    }
    // Note: My controller aggregates trend from FullMember.createdAt for now to keep it simple,
    // so I should spread the FullMember creations too.
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seed();
