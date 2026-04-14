const FullMember = require('../models/FullMember');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Inventory = require('../models/Inventory');
const Trainer = require('../models/Trainer');

// Get Unified Stats
exports.getStats = async (req, res) => {
  try {
    const daysFilter = parseInt(req.query.days) || 30; // default 30 days
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const tenDaysFromNow = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    const filterStartDate = new Date(today.getTime() - daysFilter * 24 * 60 * 60 * 1000);

    // Parallel execution for high performance
    const [
      totalMembers,
      activeMembers,
      expiringSoon,
      todayCheckinsCount,
      pendingPayments,
      revenueData,
      planDistribution,
      genderDistribution,
      inventoryData,
      trainerData,
      recentPayments,
      recentCheckins
    ] = await Promise.all([
      FullMember.countDocuments(),
      FullMember.countDocuments({ "attendanceInfo.membershipStatus": "Active" }),
      FullMember.countDocuments({ 
        "attendanceInfo.membershipStatus": "Active",
        "membershipInfo.endDate": { $lte: tenDaysFromNow, $gte: startOfToday }
      }),
      Attendance.countDocuments({ createdAt: { $gte: startOfToday } }),
      FullMember.countDocuments({ "membershipInfo.paymentStatus": "Pending" }),
      FullMember.aggregate([
        { $match: { createdAt: { $gte: filterStartDate } } },
        { $group: { _id: null, total: { $sum: "$membershipInfo.paidAmount" } } }
      ]),
      FullMember.aggregate([
        { $group: { _id: "$membershipInfo.planName", count: { $sum: 1 } } }
      ]),
      FullMember.aggregate([
        { $group: { _id: "$personalInfo.gender", count: { $sum: 1 } } }
      ]),
      Inventory.aggregate([
        { 
          $facet: {
            "summary": [
              { $group: { _id: null, totalValue: { $sum: { $multiply: ["$price", "$quantity"] } }, lowStock: { $sum: { $cond: [{ $lte: ["$quantity", "$minThreshold"] }, 1, 0] } } } }
            ],
            "lowStockItems": [
              { $match: { $expr: { $lte: ["$quantity", "$minThreshold"] } } },
              { $project: { itemName: 1, quantity: 1, unit: 1 } },
              { $limit: 5 }
            ]
          }
        }
      ]),
      Trainer.aggregate([
        { $match: { status: 'Active' } },
        {
          $lookup: {
            from: 'fullmembers',
            localField: '_id',
            foreignField: 'trainerInfo.trainerId',
            as: 'members'
          }
        },
        {
          $project: {
            name: 1,
            specialization: 1,
            memberCount: { $size: "$members" }
          }
        },
        { $sort: { memberCount: -1 } },
        { $limit: 5 }
      ]),
      FullMember.find({ "membershipInfo.paymentStatus": { $in: ["Paid", "Partial"] } })
        .select('personalInfo.fullName membershipInfo.planName membershipInfo.paidAmount membershipInfo.finalAmount createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      Attendance.find({ createdAt: { $gte: startOfToday } })
        .populate('user', 'personalInfo.fullName')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const inventoryStats = inventoryData[0]?.summary[0] || { totalValue: 0, lowStock: 0 };
    const lowStockItems = inventoryData[0]?.lowStockItems || [];

    // Calculate Growth Percentages (This Month vs Last Month)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      thisMonthMembers,
      lastMonthMembers,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthCheckins,
      lastMonthCheckins
    ] = await Promise.all([
      FullMember.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      FullMember.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } }),
      FullMember.aggregate([
        { $match: { createdAt: { $gte: startOfCurrentMonth } } },
        { $group: { _id: null, total: { $sum: "$membershipInfo.paidAmount" } } }
      ]),
      FullMember.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } } },
        { $group: { _id: null, total: { $sum: "$membershipInfo.paidAmount" } } }
      ]),
      Attendance.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      Attendance.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } })
    ]);

    const calcGrowth = (current, last) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return parseFloat(((current - last) / last * 100).toFixed(1));
    };

    const revCurrent = thisMonthRevenue[0]?.total || 0;
    const revLast = lastMonthRevenue[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        expiringSoon,
        todayCheckins: todayCheckinsCount,
        pendingPayments,
        totalRevenue: revenueData.length > 0 ? revenueData[0].total : 0,
        todayRevenue: revCurrent / 30, // Rough estimate
        avgMemberValue: totalMembers > 0 ? (revenueData[0]?.total || 0) / totalMembers : 0,
        retentionRate: totalMembers > 0 ? (activeMembers / totalMembers * 100).toFixed(1) : 0,
        monthlyGrowth: calcGrowth(thisMonthMembers, lastMonthMembers),
        revenueGrowth: calcGrowth(revCurrent, revLast),
        attendanceGrowth: calcGrowth(thisMonthCheckins, lastMonthCheckins),
      },
      planDistribution: planDistribution.map(p => ({ name: p._id || 'Standard', value: p.count })),
      genderDistribution: genderDistribution.map(g => ({ name: g._id || 'Other', value: g.count })),
      inventory: {
        totalValue: inventoryStats.totalValue,
        lowStockCount: inventoryStats.lowStock,
        lowStockItems: lowStockItems
      },
      trainerStats: trainerData,
      recentPayments: recentPayments.map(p => ({
        member: p.personalInfo.fullName,
        plan: p.membershipInfo.planName,
        amount: (p.membershipInfo.paidAmount !== undefined && p.membershipInfo.paidAmount !== null && p.membershipInfo.paidAmount !== 0) ? p.membershipInfo.paidAmount : (p.membershipInfo.finalAmount || 0),
        date: new Date(p.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })
      })),
      recentCheckins: recentCheckins.map(c => ({
        member: c.user?.personalInfo?.fullName || 'Guest',
        time: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: (c.user?.personalInfo?.fullName || 'G').charAt(0)
      })),
      aiHub: {
        status: 'Operational',
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
};

// Get Revenue Trends (Monthly/Weekly)
exports.getRevenueTrends = async (req, res) => {
  try {
    const type = req.query.type || 'monthly';
    const now = new Date();
    let startDate;
    let groupFormat;

    if (type === 'weekly') {
      // Last 28 days for weekly view
      startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      groupFormat = "%Y-W%V"; // ISO Week format
    } else {
      // Last 6 months for monthly view
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      groupFormat = "%Y-%m";
    }

    const trends = await FullMember.aggregate([
      { 
        $match: { 
          "membershipInfo.paymentStatus": { $in: ["Paid", "Partial"] },
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          revenue: { $sum: "$membershipInfo.paidAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map labels to be user-friendly (Month names or Week labels)
    const formattedTrends = trends.map(t => {
      let label = t._id;
      if (type === 'monthly') {
        const [year, month] = t._id.split('-');
        label = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
      } else if (type === 'weekly') {
        label = `Week ${t._id.split('W')[1]}`;
      }
      return { _id: label, revenue: t.revenue };
    });

    res.json({ success: true, trends: formattedTrends });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching revenue trends', error: error.message });
  }
};

// Get Recent Activity
exports.getRecentActivity = async (req, res) => {
  try {
    const recentMembers = await FullMember.find()
      .select('personalInfo.fullName membershipInfo.planName createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ success: true, recentMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching activity', error: error.message });
  }
};
