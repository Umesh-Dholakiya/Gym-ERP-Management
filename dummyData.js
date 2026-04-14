const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const FullMember = require('./models/FullMember');
const Inventory = require('./models/Inventory');
const MembershipPlan = require('./models/MembershipPlan');
const Payment = require('./models/Payment');
const Trainer = require('./models/Trainer');
const DietPlan = require('./models/DietPlan');
const WorkoutPlan = require('./models/WorkoutPlan');
const Attendance = require('./models/Attendance');
const Lead = require('./models/Lead');
const Expense = require('./models/Expense');
const InAppNotification = require('./models/InAppNotification');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym-erp';

const DATA_COUNT = 55;
const DUMMY_FLAG = 'DUMMY_DATA';

const firstNamesMale = ["Aarav", "Rohan", "Vikram", "Kabir", "Siddharth", "Yash", "Dev", "Neil", "Ankit", "Raj", "Sameer"];
const firstNamesFemale = ["Neha", "Riya", "Aditi", "Mira", "Ishita", "Anjali", "Pooja", "Maya", "Priyanka", "Shruti"];
const lastNames = ["Sharma", "Verma", "Singh", "Patel", "Gupta", "Kumar", "Rao", "Desai", "Joshi", "Das", "Bose", "Menon"];

const equipmentNames = ["Olympic Barbell", "Dumbbell Set 5-50kg", "Kettlebell 16kg", "Squat Rack", "Bench Press", "Treadmill Pro X", "Rowing Machine", "Elliptical Trainer", "Leg Press Machine", "Lat Pulldown Machine"];
const supplementNames = ["Whey Protein Isolate", "Creatine Monohydrate", "BCAA Powder", "Pre-workout Formula", "Mass Gainer", "Multivitamin Complex", "Omega-3 Fish Oil", "Glutamine", "Electrolyte Powder", "Casein Protein"];
const merchandiseNames = ["Gym ERP T-shirt", "Water Bottle 1L", "Gym Towel", "Wrist Wraps", "Lifting Belt", "Yoga Mat", "Gym Bag", "Shaker Cup", "Resistance Bands", "Jump Rope"];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a random date within the last 'days'
const getRandomDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysAgo));
  // Random time
  date.setHours(getRandomInt(6, 21), getRandomInt(0, 59));
  return date;
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected...');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
};

const removeDummyData = async () => {
  console.log('Removing dummy data...');
  try {
    const dummyMembers = await FullMember.find({ 'extras.notes': DUMMY_FLAG }, '_id');
    const dummyMemberIds = dummyMembers.map(m => m._id);

    if (dummyMemberIds.length > 0) {
      const paymentDel = await Payment.deleteMany({ user: { $in: dummyMemberIds } });
      console.log(`Deleted ${paymentDel.deletedCount} Payments.`);

      const attendanceDel = await Attendance.deleteMany({ user: { $in: dummyMemberIds } });
      console.log(`Deleted ${attendanceDel.deletedCount} Attendances.`);
    } else {
      const paymentDelFallback = await Payment.deleteMany({ plan: DUMMY_FLAG });
      console.log(`Deleted ${paymentDelFallback.deletedCount} Payments.`);
    }

    const memberDel = await FullMember.deleteMany({ 'extras.notes': DUMMY_FLAG });
    console.log(`Deleted ${memberDel.deletedCount} Members.`);

    const invDel = await Inventory.deleteMany({ supplier: { $regex: '\\[DUMMY\\]$' } });
    console.log(`Deleted ${invDel.deletedCount} Inventory items.`);

    const planDel = await MembershipPlan.deleteMany({ description: { $regex: '\\[DUMMY\\]$' } });
    console.log(`Deleted ${planDel.deletedCount} Membership Plans.`);

    const trainerDel = await Trainer.deleteMany({ status: 'Inactive', salary: 111111 }); // Using unique identifier for dummy trainers
    console.log(`Deleted ${trainerDel.deletedCount} Trainers.`);

    const dietDel = await DietPlan.deleteMany({ description: { $regex: '\\[DUMMY\\]$' } });
    console.log(`Deleted ${dietDel.deletedCount} Diet Plans.`);

    const wkDel = await WorkoutPlan.deleteMany({ description: { $regex: '\\[DUMMY\\]$' } });
    console.log(`Deleted ${wkDel.deletedCount} Workout Plans.`);

    const leadsDel = await Lead.deleteMany({ name: { $regex: '\\[DUMMY\\]$' } });
    console.log(`Deleted ${leadsDel.deletedCount} Leads.`);

    const expensesDel = await Expense.deleteMany({ title: { $regex: '\\[DUMMY\\]$' } });
    console.log(`Deleted ${expensesDel.deletedCount} Expenses.`);

    const notifDel = await InAppNotification.deleteMany({ title: { $regex: '\\[DUMMY\\]$' } });
    console.log(`Deleted ${notifDel.deletedCount} Notifications.`);

    const usersDel = await User.deleteMany({ email: { $regex: 'dummy.*@gymerp\\.com$' } });
    console.log(`Deleted ${usersDel.deletedCount} Dummy Staff.`);

    console.log(' Successfully removed all dummy data!');
  } catch (err) {
    console.error(' Error removing dummy data:', err);
  }
};

const addDummyData = async () => {
  console.log('Adding realistic dummy data...');

  try {
    const User = require('./models/User');
    const admin = await User.findOne({});
    const GYM_ID = admin ? admin.gymId : null;
    if (!GYM_ID) {
      console.error('No Gym ID found! Please register a user first.');
      return;
    }

    // 1. Membership Plans
    const plansInfo = [
      { name: 'Basic', price: 1500, duration: { value: 1, unit: 'months' }, features: ['Attendance', 'Inventory Access'] },
      { name: 'Standard', price: 4000, duration: { value: 3, unit: 'months' }, features: ['Attendance', 'Trainer Access', 'Inventory Access'] },
      { name: 'Premium', price: 12000, duration: { value: 6, unit: 'months' }, features: ['Attendance', 'Trainer Access', 'Diet Plan', 'Workout Plan', 'Reports'] },
      { name: 'Custom', price: 20000, duration: { value: 12, unit: 'months' }, features: ['Attendance', 'Trainer Access', 'Diet Plan', 'Workout Plan', 'Inventory Access', 'Reports'] }
    ];

    const dbPlans = await MembershipPlan.insertMany(plansInfo.map(p => ({
      ...p,
      description: `Access to ${p.name} tier facilities and member perks. [DUMMY]`,
      isActive: true,
      gymId: GYM_ID
    })));
    console.log(`Added ${dbPlans.length} Membership Plans.`);

    // 2. Trainers
    const trainers = [];
    const specialities = ['General Fitness', 'Bodybuilding', 'Yoga', 'Zumba', 'Powerlifting', 'Crossfit', 'Functional Training', 'Cardio'];
    const shifts = ['Morning', 'Afternoon', 'Evening', 'Full Day'];
    const genders = ['Male', 'Female'];
    
    for (let i = 1; i <= 23; i++) {
      const gender = getRandom(genders);
      const isMale = gender === 'Male';
      const fName = isMale ? getRandom(firstNamesMale) : getRandom(firstNamesFemale);
      const lName = getRandom(lastNames);
      trainers.push({
        name: `${fName} ${lName}`,
        phone: `9${getRandomInt(100000000, 999999999)}`,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@gymsystem.com`,
        gender: gender,
        specialization: [getRandom(specialities), getRandom(specialities)].filter((v, i, a) => a.indexOf(v) === i),
        salary: 111111,
        experience: getRandomInt(2, 12),
        shift: getRandom(shifts),
        status: 'Inactive',
        gymId: GYM_ID,
        joiningDate: getRandomDate(365)
      });
    }
    const dbTrainers = await Trainer.insertMany(trainers);
    await Trainer.updateMany({ salary: 111111 }, { status: 'Active' });
    console.log(`Added ${dbTrainers.length} Diverse Trainers.`);

    // 3. Diet Plans
    const dietPlans = [];
    const dietNames = [
        "Lean Bulk Protocol", "Keto Shred Master", "Vegan Wellness Plan", 
        "Intermittent Fasting 16:8", "Summer Body Prep", "Metabolism Booster",
        "High Protein Muscle Fuel", "Mediterranean Balance", "Low Carb Performance",
        "Weight Management Basic", "The 12-Week Transformation", "Paleo Athlete Diet",
        "Clean Eating Everyday", "Anti-Inflammatory Menu", "Post-Workout Recovery"
    ];
    const goals = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Keto', 'Vegan', 'Intermittent Fasting'];
    for (let i = 0; i < dietNames.length; i++) {
        dietPlans.push({
            name: dietNames[i],
            description: `A professionally curated nutritional approach focused on ${getRandom(goals).toLowerCase()} for optimal body composition.`,
            goal: getRandom(goals),
            meals: [
                { time: '07:30 AM', mealName: 'Breakfast Power', items: 'Scrambled eggs with spinach and avocado', calories: 450, protein: 30, carbs: 10, fats: 25 },
                { time: '01:00 PM', mealName: 'Main Lunch', items: 'Grilled chicken breast with quinoa and steamed veggies', calories: 600, protein: 50, carbs: 45, fats: 12 },
                { time: '07:30 PM', mealName: 'Essential Dinner', items: 'Baked salmon with asparagus', calories: 500, protein: 40, carbs: 5, fats: 20 }
            ],
            totalCalories: 1550, totalProtein: 120, totalCarbs: 60, totalFats: 57,
            gymId: GYM_ID
        });
    }
    await DietPlan.insertMany(dietPlans);
    console.log(`Added ${dietPlans.length} Realistic Diet Plans.`);

    // 4. Workout Plans
    const workoutPlans = [];
    const planNames = [
        "Push Pull Legs Split", "Full Body Ignition", "Upper Body Power",
        "Lower Body Strength", "HIIT Fat Burner", "Bodyweight Warrior",
        "Classic Physique Prep", "The 5x5 Strength Program", "Functional Athlete",
        "Core & Stability Focus", "Olympic Lifting Intro", "Endurance Master"
    ];
    const wkTypes = ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Flexibility'];
    const wkDiffs = ['Beginner', 'Intermediate', 'Advanced'];
    
    for (let i = 0; i < planNames.length; i++) {
      workoutPlans.push({
        name: planNames[i],
        description: `Strict adherence to this ${getRandom(wkDiffs).toLowerCase()} program ensures maximal ${getRandom(wkTypes).toLowerCase()} results.`,
        type: getRandom(wkTypes),
        difficulty: getRandom(wkDiffs),
        exercises: [
          { name: 'Base Drill 1', sets: 4, reps: '10-12', rest: '60s' },
          { name: 'Support Drill 2', sets: 3, reps: '15', rest: '45s' },
          { name: 'Finisher Move', sets: 2, reps: 'Failure', rest: '30s' }
        ],
        durationWeeks: getRandomInt(6, 12),
        gymId: GYM_ID
      });
    }
    await WorkoutPlan.insertMany(workoutPlans);
    console.log(`Added ${workoutPlans.length} Realistic Workout Plans.`);

    // 5. Inventory
    const inventories = [];
    // Ensure some are low stock for alerts
    for (let i = 0; i < 20; i++) {
      let cat, itemName;
      if (i < 5) { cat = 'Equipment'; itemName = equipmentNames[i]; }
      else if (i < 12) { cat = 'Supplements'; itemName = supplementNames[i - 5]; }
      else { cat = 'Merchandise'; itemName = merchandiseNames[i - 12]; }

      const isLowStock = Math.random() < 0.2; // 20% items low stock
      const quantity = isLowStock ? getRandomInt(0, 3) : getRandomInt(15, 100);

      inventories.push({
        itemName: `${itemName} Pro`,
        category: cat,
        quantity: quantity,
        price: getRandomInt(50, 500) * 10,
        minThreshold: 5,
        supplier: getRandom(['FitLife Equipments', 'PowerNutrition Inc', 'GymPro Supplies', 'ActiveGear Co.', 'IronForge Manufacturing']) + ' [DUMMY]',
        lastRestocked: getRandomDate(60), // within last 60 days
        gymId: GYM_ID
      });
    }
    const dbInventory = await Inventory.insertMany(inventories);
    console.log(`Added ${dbInventory.length} Inventory items.`);

    // 6. Members
    const members = [];
    const paymentStatuses = ['Paid', 'Paid', 'Paid', 'Paid', 'Pending', 'Partial'];
    const memStatuses = ['Active', 'Active', 'Active', 'Expired', 'Freeze'];

    for (let i = 1; i <= DATA_COUNT; i++) {
      const isMale = Math.random() > 0.5;
      const fName = isMale ? getRandom(firstNamesMale) : getRandom(firstNamesFemale);
      const lName = getRandom(lastNames);
      const plan = getRandom(dbPlans);
      const joinDate = getRandomDate(180); // Joined sometime in last 6 months
      const pStatus = getRandom(paymentStatuses);

      members.push({
        personalInfo: {
          fullName: `${fName} ${lName}`,
          mobile: `99${getRandomInt(10000000, 99999999)}`,
          email: `${fName.toLowerCase()}${i}@demo.com`,
          gender: isMale ? 'Male' : 'Female',
          age: getRandomInt(18, 55),
          address: 'New Delhi, India'
        },
        identity: {
          memberId: `GYM-${getRandomInt(1000, 9999)}${i}`
        },
        fitnessInfo: { height: 170, weight: 70, bmi: 24 },
        membershipInfo: {
          planName: plan.name,
          planDuration: plan.duration.value,
          startDate: joinDate,
          endDate: new Date(new Date(joinDate).setMonth(joinDate.getMonth() + plan.duration.value)),
          feesAmount: plan.price,
          discount: 0,
          finalAmount: plan.price,
          paidAmount: pStatus === 'Paid' ? plan.price : pStatus === 'Partial' ? plan.price / 2 : 0,
          pendingAmount: pStatus === 'Paid' ? 0 : pStatus === 'Partial' ? plan.price / 2 : plan.price,
          paymentStatus: pStatus,
        },
        paymentInfo: {
          paymentDate: joinDate,
          invoiceNumber: `INV-${joinDate.getFullYear()}${String(joinDate.getMonth() + 1).padStart(2, '0')}-${getRandomInt(1000, 9999)}`
        },
        trainerInfo: { assignedTrainer: getRandom(dbTrainers).name },
        attendanceInfo: {
          joinDate: joinDate,
          membershipStatus: getRandom(memStatuses)
        },
        extras: { notes: DUMMY_FLAG },
        createdAt: joinDate, // Spread creation date across months for charts!
        gymId: GYM_ID
      });
    }
    const createdMembers = await FullMember.insertMany(members);
    console.log(`Added ${createdMembers.length} Members.`);

    // 7. Payments
    const payments = [];
    for (let i = 0; i < createdMembers.length; i++) {
      const mem = createdMembers[i];
      // Only valid payments logic
      // If 'Paid', status is completed. If 'Pending', status is pending. 'Partial' -> pending
      let payStatus = mem.membershipInfo.paymentStatus === 'Paid' ? 'completed' : 'pending';

      payments.push({
        user: mem._id,
        amount: mem.membershipInfo.paidAmount || (mem.membershipInfo.paymentStatus === 'Pending' ? mem.membershipInfo.finalAmount : mem.membershipInfo.paidAmount),
        status: payStatus,
        plan: DUMMY_FLAG,
        paymentDate: mem.createdAt,
        createdAt: mem.createdAt, // For matching charting accurately
        gymId: GYM_ID
      });
    }
    await Payment.insertMany(payments);
    console.log(`Added ${payments.length} Payments.`);

    // 8. Attendance
    const attendances = [];
    // Only ~60% members present today
    for (let i = 0; i < createdMembers.length; i++) {
      const mem = createdMembers[i];
      if (Math.random() < 0.6) {
        const cInTime = new Date(new Date().setHours(getRandomInt(6, 18), getRandomInt(0, 59)));
        attendances.push({
          user: mem._id,
          date: cInTime.toISOString().split('T')[0],
          checkInTime: cInTime,
          status: 'present',
          gymId: GYM_ID
        });
      }
    }
    await Attendance.insertMany(attendances);
    console.log(`Added ${attendances.length} Today's Attendances.`);

    // 9. Leads
    const leads = [];
    const leadSources = ['Instagram', 'Walk-in', 'Referral', 'Other'];
    const leadStatuses = ['New', 'Follow-up', 'Converted', 'Lost'];
    for(let i=1; i<=15; i++) {
      leads.push({
        name: `${getRandom(firstNamesMale)} ${getRandom(lastNames)}`,
        phone: `88${getRandomInt(10000000, 99999999)}`,
        fitnessGoal: getRandom(['Weight Loss', 'Muscle Gain', 'General Fitness']),
        source: getRandom(leadSources),
        status: getRandom(leadStatuses),
        gymId: GYM_ID
      });
    }
    await Lead.insertMany(leads);
    console.log(`Added ${leads.length} Leads.`);

    // 10. Expenses
    const expenses = [];
    const expenseCategories = ['Rent', 'Utilities', 'Equipment Maintenance', 'Marketing', 'Salary', 'Misc'];
    for(let i=1; i<=20; i++) {
      expenses.push({
        title: `Monthly ${getRandom(expenseCategories)}`,
        amount: getRandomInt(500, 15000),
        category: getRandom(expenseCategories),
        date: getRandomDate(30),
        gymId: GYM_ID
      });
    }
    await Expense.insertMany(expenses);
    console.log(`Added ${expenses.length} Expenses.`);

    // 11. Staff
    const staffArr = [];
    const hashedPass = await bcrypt.hash('staff123', 10);
    const staffRoles = ['staff', 'trainer'];
    for(let i=1; i<=5; i++) {
        const role = getRandom(staffRoles);
        staffArr.push({
            name: `${getRandom(firstNamesFemale)} ${getRandom(lastNames)}`,
            email: `staff${i}dummy@gymerp.com`,
            password: hashedPass,
            systemPassword: 'staff123',
            role: role,
            plan: 'premium',
            status: 'active',
            gymId: GYM_ID,
            permissions: {
                members: ['view', 'create'],
                billing: role === 'staff' ? ['view', 'create'] : [],
                attendance: ['view', 'create', 'edit'],
                inventory: ['view'],
                classes: ['view', 'create'],
                reports: [],
                settings: []
            }
        });
    }
    await User.insertMany(staffArr);
    console.log(`Added ${staffArr.length} Staff/Trainers.`);

    // 12. Notifications
    const notifs = [];
    const notifTypes = ['System', 'Member', 'Payment'];
    for(let i=1; i<=10; i++) {
        notifs.push({
            title: `System Alert ${i}`,
            message: `This is an automated dummy notification generated for testing purposes.`,
            type: getRandom(notifTypes),
            userId: admin._id,
            gymId: GYM_ID,
            isRead: Math.random() > 0.5
        });
    }
    await InAppNotification.insertMany(notifs);
    console.log(`Added ${notifs.length} Notifications.`);

    console.log('Successfully completed Realistic Dummy Data Seed!');
  } catch (err) {
    console.error(' Error adding dummy data:', err);
  }
}
const run = async () => {
  const arg = process.argv[2];
  if (arg !== 'add' && arg !== 'remove') {
    console.log('');
    console.log('=== Dummy Data Manager ===');
    console.log('Please specify "add" or "remove" as an argument.');
    console.log('Usage: node dummyData.js add');
    console.log('       node dummyData.js remove');
    console.log('');
    process.exit(1);
  }

  await connectDB();

  if (arg === 'add') {
    await removeDummyData(); // Clean up first safely
    await addDummyData();
  } else if (arg === 'remove') {
    await removeDummyData();
  }

  await disconnectDB();
};


run();
