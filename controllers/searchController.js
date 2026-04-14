const FullMember = require('../models/FullMember');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');
const Trainer = require('../models/Trainer');
const Inventory = require('../models/Inventory');

/**
 * Global Search across multiple modules.
 */
exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const regex = new RegExp(q, 'i');

    const [members, plans, payments, trainers, inventory] = await Promise.all([
      FullMember.find({
        $or: [
          { 'personalInfo.fullName': regex },
          { 'personalInfo.mobile': regex },
          { 'identity.memberId': regex },
          { 'paymentInfo.invoiceNumber': regex }
        ]
      }).limit(5).select('personalInfo.fullName identity.memberId identity.profilePhoto'),

      MembershipPlan.find({ name: regex }).limit(5),

      Payment.find({ plan: regex }).populate('user', 'personalInfo.fullName').limit(5),
      
      Trainer.find({ name: regex }).limit(5).select('name speciality profilePhoto'),
      
      Inventory.find({ itemName: regex }).limit(5)
    ]);

    const results = [
      ...members.map(m => ({ 
        id: m._id, 
        title: m.personalInfo.fullName, 
        subtitle: m.identity.memberId, 
        type: 'Member', 
        category: 'Members',
        link: `/members/${m._id}`,
        image: m.identity.profilePhoto 
      })),
      ...plans.map(p => ({ 
        id: p._id, 
        title: p.name, 
        subtitle: `₹${p.price} / ${p.duration.value} ${p.duration.unit}`, 
        type: 'Plan', 
        category: 'Plans',
        link: `/plans` 
      })),
      ...payments.map(p => ({ 
        id: p._id, 
        title: `Payment: ${p.user?.personalInfo?.fullName || 'N/A'}`, 
        subtitle: `₹${p.amount} - ${p.plan}`, 
        type: 'Payment', 
        category: 'Billing',
        link: `/billing` 
      })),
      ...trainers.map(t => ({ 
        id: t._id, 
        title: t.name, 
        subtitle: t.speciality, 
        type: 'Trainer', 
        category: 'Trainers',
        link: `/trainers`,
        image: t.profilePhoto 
      })),
      ...inventory.map(i => ({ 
        id: i._id, 
        title: i.itemName, 
        subtitle: `${i.category} - Stock: ${i.quantity}`, 
        type: 'Inventory', 
        category: 'Inventory',
        link: `/inventory` 
      }))
    ];

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
