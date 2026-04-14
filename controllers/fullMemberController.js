const FullMember = require('../models/FullMember');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const MembershipPlan = require('../models/MembershipPlan');
const GymProfile = require('../models/GymProfile');
const { paginateQuery } = require('../utils/queryHelper');
const { createNotification } = require('../utils/notificationHelper');
const { sendWhatsApp } = require('../services/communicationService');


const parseDate = (val) => {
  if (!val || val === 'undefined' || val === 'null' || val === '') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Get all members with high-performance server-side grouping, search and pagination.
 */
exports.getAllMembers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      paymentStatus = '',
      plan = '', 
      trainer = '', 
      date = '', 
      sortField = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    // ── Auto-Sync Status: Membership expiry check
    const now = new Date();
    await FullMember.updateMany(
      { 
        "membershipInfo.endDate": { $lt: now }, 
        "attendanceInfo.membershipStatus": "Active" 
      },
      { $set: { "attendanceInfo.membershipStatus": "Expired" } }
    );
    
    // Search & Filter Logic
    const searchFields = ['personalInfo.fullName', 'personalInfo.mobile', 'identity.memberId', 'membershipInfo.planName'];
    const filters = { gymId: req.user.gymId };
    
    if (status) filters['attendanceInfo.membershipStatus'] = status;
    if (paymentStatus) filters['membershipInfo.paymentStatus'] = paymentStatus;
    if (plan) filters['membershipInfo.planName'] = plan;
    if (trainer) filters['trainerInfo.assignedTrainer'] = trainer;
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      // Check for either bill date or payment date
      filters.$or = [
        { 'paymentInfo.paymentDate': { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } }
      ];
    }

    const result = await paginateQuery(FullMember, {
      page,
      limit,
      search,
      searchFields,
      baseQuery: filters,
      sortField,
      sortOrder
    });

    // ── Check Attendance for Today for each member returned
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      user: { $in: result.data.map(m => m._id) },
      checkInTime: { $gte: startOfDay, $lte: endOfDay }
    }).select('user');

    const presentMemberIds = new Set(attendances.map(a => a.user.toString()));

    const membersWithAttendance = result.data.map(m => ({
      ...m,
      isTodayPresent: presentMemberIds.has(m._id.toString())
    }));

    res.json({
      success: true,
      data: membersWithAttendance,
      pagination: result.pagination
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Add a new member (Logic moved from route file)
 */
exports.addMember = async (req, res) => {
  try {
    const b = req.body;
    const files = req.files || {};

    const doc = {
      personalInfo: {
        fullName: b['personalInfo.fullName'],
        mobile: b['personalInfo.mobile'],
        email: b['personalInfo.email'],
        gender: b['personalInfo.gender'] || 'Male',
        dob: parseDate(b['personalInfo.dob']),
        age: b['personalInfo.age'] ? Number(b['personalInfo.age']) : null,
        address: b['personalInfo.address'],
        emergencyContactName: b['personalInfo.emergencyContactName'],
        emergencyContactPhone: b['personalInfo.emergencyContactPhone'],
      },
      identity: {
        idProofType: b['identity.idProofType'],
        idProofNumber: b['identity.idProofNumber'],
        emergencyContact: b['identity.emergencyContact'],
        profilePhoto: files.profilePhoto?.[0]?.filename || '',
      },
      fitnessInfo: {
        height: b['fitnessInfo.height'] ? Number(b['fitnessInfo.height']) : null,
        weight: b['fitnessInfo.weight'] ? Number(b['fitnessInfo.weight']) : null,
        bmi: b['fitnessInfo.bmi'] ? Number(b['fitnessInfo.bmi']) : null,
        fitnessGoal: b['fitnessInfo.fitnessGoal'],
        medicalConditions: b['fitnessInfo.medicalConditions'],
        injuries: b['fitnessInfo.injuries'],
      },
      membershipInfo: {
        planName: b['membershipInfo.planName'] || 'Monthly',
        planDuration: b['membershipInfo.planDuration'] ? Number(b['membershipInfo.planDuration']) : null,
        startDate: parseDate(b['membershipInfo.startDate']) || new Date(),
        endDate: parseDate(b['membershipInfo.endDate']),
        feesAmount: b['membershipInfo.feesAmount'] ? Number(b['membershipInfo.feesAmount']) : 0,
        discount: b['membershipInfo.discount'] ? Number(b['membershipInfo.discount']) : 0,
        finalAmount: b['membershipInfo.finalAmount'] ? Number(b['membershipInfo.finalAmount']) : 0,
        paidAmount: b['membershipInfo.paidAmount'] ? Number(b['membershipInfo.paidAmount']) : 0,
        pendingAmount: b['membershipInfo.pendingAmount'] ? Number(b['membershipInfo.pendingAmount']) : 0,
        nextPaymentDate: parseDate(b['membershipInfo.nextPaymentDate']),
        paymentStatus: b['membershipInfo.paymentStatus'] || 'Pending',
        paymentMode: b['membershipInfo.paymentMode'],
        dueDate: parseDate(b['membershipInfo.dueDate']),
      },
      paymentInfo: {
        transactionId: b['paymentInfo.transactionId'],
        paymentDate: parseDate(b['paymentInfo.paymentDate']) || new Date(),
        receiptFile: files.receiptFile?.[0]?.filename || '',
      },
      trainerInfo: {
        assignedTrainer: b['trainerInfo.assignedTrainer'],
        batchTiming: b['trainerInfo.batchTiming'],
        customTime: b['trainerInfo.customTime'],
        workoutPlan: b['trainerInfo.workoutPlan'],
      },
      attendanceInfo: {
        joinDate: parseDate(b['attendanceInfo.joinDate']) || new Date(),
        membershipStatus: b['attendanceInfo.membershipStatus'] || 'Active',
      },
      extras: {
        dietPlan: b['extras.dietPlan'],
        progressPhotos: (files.progressPhotos || []).map(f => f.filename),
        notes: b['extras.notes'],
        referralSource: b['extras.referralSource'],
        lockerNumber: b['extras.lockerNumber'],
        rfidCard: b['extras.rfidCard'],
      },
      gymId: req.user.gymId
    };

    const member = new FullMember(doc);
    await member.save();

    // ── TRIGGER: Payment/Billing Entry
    if (member.membershipInfo.paidAmount > 0) {
      try {
        await Payment.create({
          user: member._id, // Linking member ID to user field for now, consistent with model usage
          amount: member.membershipInfo.paidAmount,
          status: 'completed',
          paymentDate: member.paymentInfo.paymentDate || new Date(),
          plan: member.membershipInfo.planName
        });
      } catch (payErr) {
        console.error('Failed to create payment record:', payErr);
      }
    }

    // ── TRIGGER: Attendance Initialization (Optional primary record)
    // You could initialize a summary or first entry here if needed.

    res.status(201).json({ success: true, member });

    // ── TRIGGER: In-App Notifications
    const io = req.app.get('io');
    createNotification(io, {
      title: 'New Member Joined',
      message: `${member.personalInfo.fullName} has registered for the ${member.membershipInfo.planName} plan.`,
      type: 'Member',
      userId: req.user._id,
      gymId: req.user.gymId,
      metadata: { memberId: member._id }
    });

    if (member.membershipInfo.paidAmount > 0) {
      createNotification(io, {
        title: 'Payment Received',
        message: `₹${member.membershipInfo.paidAmount} received from ${member.personalInfo.fullName}.`,
        type: 'Payment',
        userId: req.user._id,
        gymId: req.user.gymId,
        metadata: { memberId: member._id }
      });
    }

    // ── TRIGGER: WhatsApp Welcome Message
    try {
      const profile = await GymProfile.findOne();
      const gymName = profile?.gymName || 'Our Gym';
      
      const welcomeMsg = `Hello ${member.personalInfo.fullName} 👋

Welcome to ${gymName} 💪

Your Membership Details:
* Plan: ${member.membershipInfo.planName}
* Start Date: ${member.membershipInfo.startDate ? new Date(member.membershipInfo.startDate).toLocaleDateString() : 'N/A'}
* Expiry Date: ${member.membershipInfo.endDate ? new Date(member.membershipInfo.endDate).toLocaleDateString() : 'N/A'}
* Trainer: ${member.trainerInfo.assignedTrainer || 'General'}
* Timing: ${member.trainerInfo.batchTiming || 'Flexible'}

Your Fitness Journey Starts Now 🚀

For any help, contact us.`;

      await sendWhatsApp(member.personalInfo.mobile, welcomeMsg);
    } catch (wsErr) {
      console.error('WhatsApp Welcome Error:', wsErr.message);
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single member by ID
 */
exports.getMemberById = async (req, res) => {
  try {
    const member = await FullMember.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update member
 */
exports.updateMember = async (req, res) => {
  try {
    const b = req.body;
    const files = req.files || {};

    // Build update object with nested structure
    // We only update fields that are provided in the request
    const updateDoc = {};

    // Personal Info
    if (b['personalInfo.fullName']) {
      updateDoc['personalInfo.fullName'] = b['personalInfo.fullName'];
      updateDoc['personalInfo.mobile'] = b['personalInfo.mobile'];
      updateDoc['personalInfo.email'] = b['personalInfo.email'];
      updateDoc['personalInfo.gender'] = b['personalInfo.gender'];
      updateDoc['personalInfo.dob'] = parseDate(b['personalInfo.dob']);
      updateDoc['personalInfo.age'] = b['personalInfo.age'] ? Number(b['personalInfo.age']) : null;
      updateDoc['personalInfo.address'] = b['personalInfo.address'];
      updateDoc['personalInfo.emergencyContactName'] = b['personalInfo.emergencyContactName'];
      updateDoc['personalInfo.emergencyContactPhone'] = b['personalInfo.emergencyContactPhone'];
    }

    // Identity
    if (b['identity.idProofType'] !== undefined) updateDoc['identity.idProofType'] = b['identity.idProofType'];
    if (b['identity.idProofNumber'] !== undefined) updateDoc['identity.idProofNumber'] = b['identity.idProofNumber'];
    if (b['identity.emergencyContact'] !== undefined) updateDoc['identity.emergencyContact'] = b['identity.emergencyContact'];
    
    if (files.profilePhoto?.[0]?.filename) {
      updateDoc['identity.profilePhoto'] = files.profilePhoto[0].filename;
    }

    // Fitness
    if (b['fitnessInfo.height'] !== undefined) updateDoc['fitnessInfo.height'] = Number(b['fitnessInfo.height']);
    if (b['fitnessInfo.weight'] !== undefined) updateDoc['fitnessInfo.weight'] = Number(b['fitnessInfo.weight']);
    if (b['fitnessInfo.bmi'] !== undefined) updateDoc['fitnessInfo.bmi'] = Number(b['fitnessInfo.bmi']);
    if (b['fitnessInfo.fitnessGoal'] !== undefined) updateDoc['fitnessInfo.fitnessGoal'] = b['fitnessInfo.fitnessGoal'];
    if (b['fitnessInfo.medicalConditions'] !== undefined) updateDoc['fitnessInfo.medicalConditions'] = b['fitnessInfo.medicalConditions'];
    if (b['fitnessInfo.injuries'] !== undefined) updateDoc['fitnessInfo.injuries'] = b['fitnessInfo.injuries'];

    // Membership
    if (b['membershipInfo.planName'] !== undefined) updateDoc['membershipInfo.planName'] = b['membershipInfo.planName'];
    if (b['membershipInfo.planDuration'] !== undefined) updateDoc['membershipInfo.planDuration'] = Number(b['membershipInfo.planDuration']);
    if (b['membershipInfo.startDate'] !== undefined) updateDoc['membershipInfo.startDate'] = parseDate(b['membershipInfo.startDate']);
    if (b['membershipInfo.endDate'] !== undefined) updateDoc['membershipInfo.endDate'] = parseDate(b['membershipInfo.endDate']);
    if (b['membershipInfo.feesAmount'] !== undefined) updateDoc['membershipInfo.feesAmount'] = Number(b['membershipInfo.feesAmount']);
    if (b['membershipInfo.discount'] !== undefined) updateDoc['membershipInfo.discount'] = Number(b['membershipInfo.discount']);
    if (b['membershipInfo.finalAmount'] !== undefined) updateDoc['membershipInfo.finalAmount'] = Number(b['membershipInfo.finalAmount']);
    if (b['membershipInfo.paidAmount'] !== undefined) updateDoc['membershipInfo.paidAmount'] = Number(b['membershipInfo.paidAmount']);
    if (b['membershipInfo.pendingAmount'] !== undefined) updateDoc['membershipInfo.pendingAmount'] = Number(b['membershipInfo.pendingAmount']);
    if (b['membershipInfo.nextPaymentDate'] !== undefined) updateDoc['membershipInfo.nextPaymentDate'] = parseDate(b['membershipInfo.nextPaymentDate']);
    if (b['membershipInfo.paymentStatus'] !== undefined) updateDoc['membershipInfo.paymentStatus'] = b['membershipInfo.paymentStatus'];
    if (b['membershipInfo.paymentMode'] !== undefined) updateDoc['membershipInfo.paymentMode'] = b['membershipInfo.paymentMode'];
    if (b['membershipInfo.dueDate'] !== undefined) updateDoc['membershipInfo.dueDate'] = parseDate(b['membershipInfo.dueDate']);

    // Trainer
    if (b['trainerInfo.assignedTrainer'] !== undefined) updateDoc['trainerInfo.assignedTrainer'] = b['trainerInfo.assignedTrainer'];
    if (b['trainerInfo.batchTiming'] !== undefined) updateDoc['trainerInfo.batchTiming'] = b['trainerInfo.batchTiming'];
    if (b['trainerInfo.customTime'] !== undefined) updateDoc['trainerInfo.customTime'] = b['trainerInfo.customTime'];
    if (b['trainerInfo.workoutPlan'] !== undefined) updateDoc['trainerInfo.workoutPlan'] = b['trainerInfo.workoutPlan'];

    // Attendance Info
    if (b['attendanceInfo.membershipStatus'] !== undefined) updateDoc['attendanceInfo.membershipStatus'] = b['attendanceInfo.membershipStatus'];

    // Extras
    if (b['extras.notes'] !== undefined) updateDoc['extras.notes'] = b['extras.notes'];
    if (b['extras.referralSource'] !== undefined) updateDoc['extras.referralSource'] = b['extras.referralSource'];

    const member = await FullMember.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId }, 
      { $set: updateDoc }, 
      { new: true, runValidators: true }
    );

    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    
    res.json({ success: true, member });

    // ── TRIGGER: WhatsApp Workout/Diet Update
    if (b['trainerInfo.workoutPlan'] !== undefined || b['extras.dietPlan'] !== undefined) {
      try {
        const workoutDietMsg = `Hi ${member.personalInfo.fullName},

Your workout & diet plan has been updated 🏋️

Please check your schedule and follow regularly.`;
        
        await sendWhatsApp(member.personalInfo.mobile, workoutDietMsg);
      } catch (wsErr) {
        console.error('WhatsApp Workout/Diet Update Error:', wsErr.message);
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Quick Attendance
 */
exports.quickAttendance = async (req, res) => {
  try {
    const member = await FullMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Check if attendance already marked for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      user: member._id,
      checkInTime: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
    }

    const attendance = new Attendance({
      user: member._id,
      status: 'present',
      checkInTime: new Date()
    });

    await attendance.save();

    // ── TRIGGER: Socket Notification
    const io = req.app.get('io');
    if (io) {
      io.emit('attendanceUpdate', { 
        type: 'checkIn', 
        memberId: member._id, 
        memberName: member.personalInfo.fullName,
        time: attendance.checkInTime 
      });
    }

    res.json({ success: true, message: 'Attendance marked successfully' });

    // ── TRIGGER: WhatsApp Attendance Message (Optional)
    try {
        const profile = await GymProfile.findOne();
        const gymName = profile?.gymName || 'Our Gym';
        const attendanceMsg = `Hi ${member.personalInfo.fullName}, 
        
Your attendance for today (${new Date().toLocaleDateString()}) has been marked at ${gymName} 💪. 

Keep grinding! 🏋️‍♂️`;
        
        // Uncomment below to enable attendance WhatsApp notifications
        // await sendWhatsApp(member.personalInfo.mobile, attendanceMsg);
    } catch (wsErr) {
        console.error('WhatsApp Attendance Error:', wsErr.message);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete member
 */
exports.deleteMember = async (req, res) => {
  try {
    const member = await FullMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Renew Plan
 */
exports.renewPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      planName, 
      planDuration, 
      startDate, 
      endDate, 
      finalAmount, 
      paidAmount, 
      paymentMode, 
      paymentDate 
    } = req.body;

    const member = await FullMember.findById(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Update membership info
    member.membershipInfo.planName = planName;
    member.membershipInfo.planDuration = planDuration;
    member.membershipInfo.startDate = parseDate(startDate) || member.membershipInfo.startDate;
    member.membershipInfo.endDate = parseDate(endDate) || member.membershipInfo.endDate;
    member.membershipInfo.finalAmount = finalAmount;
    member.membershipInfo.paidAmount = paidAmount;
    member.membershipInfo.pendingAmount = Number(finalAmount) - Number(paidAmount);
    member.membershipInfo.paymentStatus = (paidAmount >= finalAmount) ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');
    member.membershipInfo.paymentMode = paymentMode;
    member.attendanceInfo.membershipStatus = 'Active';

    // Save transaction
    if (paidAmount > 0) {
      await Payment.create({
        user: id,
        amount: paidAmount,
        status: 'completed',
        paymentDate: parseDate(paymentDate) || new Date(),
        plan: planName
      });
    }

    await member.save();

    res.json({ success: true, member, message: 'Plan renewed successfully' });

    // Notification
    const io = req.app.get('io');
    if (io) {
      createNotification(io, {
        title: 'Plan Renewed',
        message: `${member.personalInfo.fullName} has renewed their ${planName} plan.`,
        type: 'Member',
        userId: req.user._id,
        gymId: req.user.gymId,
        metadata: { memberId: id }
      });
    }

    // ── TRIGGER: WhatsApp Payment Success Message
    try {
        const profile = await GymProfile.findOne();
        const gymName = profile?.gymName || 'Our Gym';
        const paymentMsg = `Hi ${member.personalInfo.fullName},

We have received your payment of ₹${paidAmount} ✅

Thank you for choosing ${gymName} 💪`;

        await sendWhatsApp(member.personalInfo.mobile, paymentMsg);
    } catch (wsErr) {
        console.error('WhatsApp Payment Success Error:', wsErr.message);
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update Plan (Upgrade/Downgrade)
 */
exports.updatePlan = async (req, res) => {
  // Logic is very similar to renew, keeping it separate for future divergence
  try {
    const { id } = req.params;
    const { 
      planName, 
      planDuration, 
      startDate, 
      endDate, 
      finalAmount, 
      paidAmount, 
      paymentMode, 
      paymentDate 
    } = req.body;

    const member = await FullMember.findById(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Update membership info
    member.membershipInfo.planName = planName;
    member.membershipInfo.planDuration = planDuration;
    member.membershipInfo.startDate = parseDate(startDate) || member.membershipInfo.startDate;
    member.membershipInfo.endDate = parseDate(endDate) || member.membershipInfo.endDate;
    member.membershipInfo.finalAmount = finalAmount;
    member.membershipInfo.paidAmount = paidAmount;
    member.membershipInfo.pendingAmount = Number(finalAmount) - Number(paidAmount);
    member.membershipInfo.paymentStatus = (paidAmount >= finalAmount) ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');
    member.membershipInfo.paymentMode = paymentMode;

    // Save transaction if payment made during update
    if (paidAmount > 0) {
      await Payment.create({
        user: id,
        amount: paidAmount,
        status: 'completed',
        paymentDate: parseDate(paymentDate) || new Date(),
        plan: planName
      });
    }

    await member.save();

    res.json({ success: true, member, message: 'Plan updated successfully' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
