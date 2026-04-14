const Payment = require('../models/Payment');
const FullMember = require('../models/FullMember');

/**
 * Add Payment for an existing member
 */
exports.addPayment = async (req, res) => {
  try {
    const { memberId, amount, paymentMode, paymentDate, planName } = req.body;

    if (!memberId || !amount) {
      return res.status(400).json({ success: false, message: 'Member ID and amount are required' });
    }

    const member = await FullMember.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Create payment record
    const payment = await Payment.create({
      user: memberId,
      amount: Number(amount),
      status: 'completed',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      plan: planName || member.membershipInfo.planName
    });

    // Update member's paid amount and status
    const newPaidAmount = Number(member.membershipInfo.paidAmount || 0) + Number(amount);
    member.membershipInfo.paidAmount = newPaidAmount;
    member.membershipInfo.pendingAmount = Math.max(0, Number(member.membershipInfo.finalAmount) - newPaidAmount);
    
    // Update status based on logic
    if (newPaidAmount >= member.membershipInfo.finalAmount) {
      member.membershipInfo.paymentStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      member.membershipInfo.paymentStatus = 'Partial';
    } else {
      member.membershipInfo.paymentStatus = 'Pending';
    }
    
    member.membershipInfo.paymentMode = paymentMode || member.membershipInfo.paymentMode;

    await member.save();

    res.status(201).json({ success: true, payment, member, message: 'Payment added successfully' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Payments by Member ID
 */
exports.getMemberPayments = async (req, res) => {
  try {
    const { memberId } = req.params;
    const payments = await Payment.find({ user: memberId }).sort({ paymentDate: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
