const Attendance = require('../models/Attendance');
const FullMember = require('../models/FullMember');
const Trainer = require('../models/Trainer');

/**
 * Helper to get today's date string in YYYY-MM-DD
 */
const getTodayDateString = () => {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
};


/**
 * Get attendance summary for today
 */
exports.getDailySummary = async (req, res) => {
  try {
    const today = getTodayDateString();

    const totalMembers = await FullMember.countDocuments();
    const activeMembers = await FullMember.countDocuments({
      "attendanceInfo.membershipStatus": "Active",
      "membershipInfo.endDate": { $gte: new Date() }
    });

    const presentCount = await Attendance.countDocuments({
      date: today,
      status: 'present'
    });

    const retentionRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

    res.json({
      success: true,
      summary: {
        totalRegistered: totalMembers,
        activeMembers: activeMembers,
        presentToday: presentCount,
        absentToday: Math.max(0, totalMembers - presentCount),
        retentionRate: retentionRate.toFixed(2)
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get attendance logs with member names and search/filter
 */
exports.getLogs = async (req, res) => {
  try {
    const { date, search = '', page = 1, limit = 100 } = req.query;

    let query = {};
    if (date) {
      query.date = date;
    } else {
      query.date = getTodayDateString();
    }

    // If search is provided, we need to find member IDs first
    let memberIds = [];
    if (search) {
      const members = await FullMember.find({
        $or: [
          { "personalInfo.fullName": { $regex: search, $options: 'i' } },
          { "personalInfo.mobile": { $regex: search, $options: 'i' } },
          { "identity.memberId": { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      memberIds = members.map(m => m._id);
      query.user = { $in: memberIds };
    }

    const logs = await Attendance.find(query)
      .populate({
        path: 'user',
        select: 'personalInfo.fullName personalInfo.mobile identity.memberId membershipInfo.planName membershipInfo.endDate attendanceInfo.membershipStatus'
      })
      .sort({ checkInTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Member Check-in
 */
exports.checkIn = async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ success: false, message: 'Member ID is required' });

    const member = await FullMember.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // 1. Check if membership is blocked (Expired or Pending)
    const allowedStatuses = ['Active', 'Freeze'];
    if (!allowedStatuses.includes(member.attendanceInfo.membershipStatus)) {
      // If it's expired, double check the date to be sure
      const today = new Date();
      if (member.membershipInfo.endDate && new Date(member.membershipInfo.endDate) < today) {
        if (member.attendanceInfo.membershipStatus !== 'Expired') {
          member.attendanceInfo.membershipStatus = 'Expired';
          await member.save();
        }
        return res.status(400).json({
          success: false,
          message: 'Access Denied: Membership has EXPIRED. Please renew to check-in.',
          status: 'Expired'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Check-in denied. Membership status is ${member.attendanceInfo.membershipStatus}.`,
        status: member.attendanceInfo.membershipStatus
      });
    }

    // Auto-unfreeze if member was on Freeze
    if (member.attendanceInfo.membershipStatus === 'Freeze') {
      member.attendanceInfo.membershipStatus = 'Active';
    }

    // 2. Double check expiration date for Active members
    const today = new Date();
    if (member.membershipInfo.endDate && new Date(member.membershipInfo.endDate) < today) {
      member.attendanceInfo.membershipStatus = 'Expired';
      await member.save();
      return res.status(400).json({
        success: false,
        message: 'Access Denied: Subscription term ended today. Please renew.',
        status: 'Expired'
      });
    }

    const todayStr = getTodayDateString();

    // Check if attendance already marked for today
    const existing = await Attendance.findOne({
      user: memberId,
      date: todayStr
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Member already checked in for today' });
    }

    const attendance = await Attendance.create({
      user: memberId,
      date: todayStr,
      status: 'present',
      checkInTime: new Date()
    });

    // Update last visit date
    member.attendanceInfo.lastVisitDate = new Date();
    await member.save();

    // ── TRIGGER: Socket Notification
    const io = req.app.get('io');
    if (io) {
      io.emit('attendanceUpdate', {
        type: 'checkIn',
        memberId,
        memberName: member.personalInfo.fullName,
        time: attendance.checkInTime
      });
    }

    res.status(201).json({
      success: true,
      attendance,
      message: 'Check-in successful'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Member Check-out
 */
exports.checkOut = async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ success: false, message: 'Member ID is required' });

    const todayStr = getTodayDateString();

    const attendance = await Attendance.findOne({
      user: memberId,
      date: todayStr,
      checkOutTime: { $exists: false }
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No active check-in found for this member today' });
    }

    attendance.checkOutTime = new Date();

    // Calculate duration in minutes
    const diffMs = attendance.checkOutTime - attendance.checkInTime;
    attendance.duration = Math.floor(diffMs / (1000 * 60));

    await attendance.save();

    // ── TRIGGER: Socket Notification
    const io = req.app.get('io');
    if (io) {
      io.emit('attendanceUpdate', {
        type: 'checkOut',
        memberId,
        time: attendance.checkOutTime
      });
    }

    res.json({
      success: true,
      attendance,
      message: 'Check-out successful'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Attendance for a specific member
 */
exports.getMemberAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await Attendance.find({ user: id, userType: 'FullMember' })
      .sort({ checkInTime: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Attendance for a specific trainer
 */
exports.getTrainerAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await Attendance.find({ user: id, userType: 'Trainer' })
      .sort({ checkInTime: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Trainer Check-in
 */
exports.trainerCheckIn = async (req, res) => {
  try {
    const { trainerId } = req.body;
    if (!trainerId) return res.status(400).json({ success: false, message: 'Trainer ID is required' });

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const todayStr = getTodayDateString();

    // Check if attendance already marked for today
    const existing = await Attendance.findOne({
      user: trainerId,
      date: todayStr,
      userType: 'Trainer'
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Trainer already checked in for today' });
    }

    const attendance = await Attendance.create({
      user: trainerId,
      userType: 'Trainer',
      date: todayStr,
      status: 'present',
      checkInTime: new Date()
    });

    res.status(201).json({
      success: true,
      attendance,
      message: 'Trainer check-in successful'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Trainer Check-out
 */
exports.trainerCheckOut = async (req, res) => {
  try {
    const { trainerId } = req.body;
    if (!trainerId) return res.status(400).json({ success: false, message: 'Trainer ID is required' });

    const todayStr = getTodayDateString();

    const attendance = await Attendance.findOne({
      user: trainerId,
      date: todayStr,
      userType: 'Trainer',
      checkOutTime: { $exists: false }
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No active check-in found for this trainer today' });
    }

    attendance.checkOutTime = new Date();

    // Calculate duration
    const diffMs = attendance.checkOutTime - attendance.checkInTime;
    attendance.duration = Math.floor(diffMs / (1000 * 60));

    await attendance.save();

    res.json({
      success: true,
      attendance,
      message: 'Trainer check-out successful'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

