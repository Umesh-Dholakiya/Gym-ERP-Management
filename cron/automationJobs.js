const cron = require('node-cron');
const FullMember = require('../models/FullMember');
const NotificationLog = require('../models/NotificationLog');
const GymProfile = require('../models/GymProfile');
const Lead = require('../models/Lead');
const Gym = require('../models/Gym');
const { sendSMS, sendEmail, sendWhatsApp } = require('../services/communicationService');



// Helper to determine active communication channels
const communicateToMember = async (member, message, triggerLogic, io) => {
  // 1. WhatsApp (Priority)
  if (member.personalInfo.mobile) {
      const res = await sendWhatsApp(member.personalInfo.mobile, message);
      const status = res.success ? 'sent' : 'failed';
      await NotificationLog.create({
        memberId: member._id,
        type: 'WhatsApp',
        message: message,
        status: status,
        triggerLogic
      });
  }

  // 2. Email
  if (member.personalInfo.email) {
    const res = await sendEmail(member.personalInfo.email, 'Gym Notification', message);
    const emailStatus = res.success ? 'sent' : 'failed';
    // Log
    await NotificationLog.create({
      memberId: member._id,
      type: 'Email',
      message: message,
      status: emailStatus,
      triggerLogic
    });
  }

  // Real-time toast to admin tracking background firing
  if (io) {
    io.emit('automation-log', {
      memberId: member._id,
      name: member.personalInfo.fullName,
      trigger: triggerLogic,
      status: 'processed'
    });
  }
};

const initAutomationJobs = (io) => {
  // Run daily at 10:00 AM (Better time for notifications)
  cron.schedule('0 10 * * *', async () => {
    console.log('Running daily background automation jobs...');
    
    try {
      const profile = await GymProfile.findOne();
      const gymName = profile?.gymName || 'Our Gym';

      // ── 1. MEMBERSHIP EXPIRY REMINDER (3 days before)
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      const startOf3rdDay = new Date(in3Days.setHours(0,0,0,0));
      const endOf3rdDay = new Date(in3Days.setHours(23,59,59,999));
      
      const expiringSoon = await FullMember.find({
        'membershipInfo.endDate': {
          $gte: startOf3rdDay,
          $lte: endOf3rdDay
        },
        'attendanceInfo.membershipStatus': 'Active'
      });

      for (let member of expiringSoon) {
        const msg = `Hi ${member.personalInfo.fullName},

Your membership is expiring on ${member.membershipInfo.endDate ? new Date(member.membershipInfo.endDate).toLocaleDateString() : 'soon'}.

Renew now to continue your fitness journey 💪
Team ${gymName}`;

        await communicateToMember(member, msg, 'Expiry Reminder', io);
        

      }

      // ── 2. PAYMENT DUE REMINDER (Today is due date)
      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      const endOfToday = new Date();
      endOfToday.setHours(23,59,59,999);

      const paymentsDue = await FullMember.find({
        'membershipInfo.dueDate': {
          $gte: startOfToday,
          $lte: endOfToday
        },
        'membershipInfo.pendingAmount': { $gt: 0 }
      });

      for (let member of paymentsDue) {
        const msg = `Reminder ⚠️

Hi ${member.personalInfo.fullName},
Your pending payment of ₹${member.membershipInfo.pendingAmount} is due on ${member.membershipInfo.dueDate ? new Date(member.membershipInfo.dueDate).toLocaleDateString() : 'today'}.

Please clear it to continue your membership.
Team ${gymName}`;

        await communicateToMember(member, msg, 'Payment Reminder', io);
        

      }

      console.log('Daily jobs executed successfully.');
    } catch (err) {
      console.error('Error during daily cron tasks:', err);
    }
  });

  // Hourly cron job for neglected leads (> 6 hours without follow up)
  cron.schedule('0 * * * *', async () => {
    console.log('Running hourly background lead checks...');
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      
      const neglectedLeads = await Lead.find({
        status: 'New',
        createdAt: { $lte: sixHoursAgo },
        reminded: false
      }).populate('gymId');

      for (let lead of neglectedLeads) {
        if (!lead.gymId) continue;
        
        // Mark as reminded to avoid spam
        lead.reminded = true;
        await lead.save();

        const gymOwnerPhone = lead.gymId.phone; // Assuming the gym has the owner's phone

        if (gymOwnerPhone) {
          const msg = `🚨 New Lead Alert!
          
Hi DemoOwner,
Lead "${lead.name}" (${lead.phone}) has been waiting for > 6 hours.

Please follow up to secure this conversion!
Team GymERP`;

          // Mocking the owner message using standard communicate logic
          await sendWhatsApp(gymOwnerPhone, msg);
        }

        // ── TRIGGER: In-App Notification to Admin
        if (io) {
          await createNotification(io, {
            title: 'Neglected Lead Alert',
            message: `Lead ${lead.name} needs follow-up! (>6hrs)`,
            type: 'System',
            gymId: lead.gymId._id || lead.gymId, // Handle populated or unpopulated gymId
            metadata: { leadId: lead._id }
          });
        }
      }
    } catch (err) {
      console.error('Error during hourly lead check:', err);
    }
  });

  console.log('Automation Jobs initialized.');
};

module.exports = { initAutomationJobs };

