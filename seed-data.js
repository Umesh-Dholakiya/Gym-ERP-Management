const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Trainer = require('./models/Trainer');
const FullMember = require('./models/FullMember');
// Add other models if needed to clean up
const MembershipPlan = require('./models/MembershipPlan');
const Attendance = require('./models/Attendance');
const Inventory = require('./models/Inventory');
const WorkoutPlan = require('./models/WorkoutPlan');
const DietPlan = require('./models/DietPlan');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym-erp';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding');

        // 1. Clear existing data
        await Trainer.deleteMany({});
        await FullMember.deleteMany({});
        await Attendance.deleteMany({});
        await MembershipPlan.deleteMany({});
        await Inventory.deleteMany({});
        await WorkoutPlan.deleteMany({});
        await DietPlan.deleteMany({});
        console.log('🗑️  Cleared existing trainers, members, attendance, plans, inventory, workout and diet plans');

        // 1.5 Create 10 Real Inventory Items
        const inventoryData = [
            { itemName: 'Whey Protein (Gold Standard)', category: 'Supplements', quantity: 25, unit: 'kg', price: 1800, minThreshold: 5, supplier: 'Optimum Nutrition', lastRestocked: new Date() },
            { itemName: 'Creatine Monohydrate', category: 'Supplements', quantity: 40, unit: 'units', price: 650, minThreshold: 10, supplier: 'MuscleBlaze', lastRestocked: new Date() },
            { itemName: 'Dumbbell Set (10kg)', category: 'Equipment', quantity: 12, unit: 'pairs', price: 2500, minThreshold: 4, supplier: 'Protoner', lastRestocked: new Date() },
            { itemName: 'Yoga Mats (Premium)', category: 'Equipment', quantity: 30, unit: 'pcs', price: 800, minThreshold: 10, supplier: 'Reebok', lastRestocked: new Date() },
            { itemName: 'Resistance Bands Set', category: 'Equipment', quantity: 15, unit: 'pcs', price: 1200, minThreshold: 5, supplier: 'Decathlon', lastRestocked: new Date() },
            { itemName: 'Pre-Workout (Pump)', category: 'Supplements', quantity: 3, unit: 'units', price: 2200, minThreshold: 5, supplier: 'GNC', lastRestocked: new Date() },
            { itemName: 'Treadmill Lubricant Oil', category: 'Maintenance', quantity: 20, unit: 'bottles', price: 450, minThreshold: 8, supplier: 'FitKit', lastRestocked: new Date() },
            { itemName: 'Gym Towels (Cotton)', category: 'Merchandise', quantity: 50, unit: 'pcs', price: 300, minThreshold: 15, supplier: 'Local Bulk', lastRestocked: new Date() },
            { itemName: 'Shaker Bottles (700ml)', category: 'Merchandise', quantity: 0, unit: 'pcs', price: 250, minThreshold: 10, supplier: 'Spider', lastRestocked: new Date() },
            { itemName: 'Adjustable Bench', category: 'Equipment', quantity: 5, unit: 'pcs', price: 15000, minThreshold: 2, supplier: 'Jerai Fitness', lastRestocked: new Date() }
        ];
        await Inventory.insertMany(inventoryData);
        console.log('📦 Created 10 Inventory Items');

        // 2. Create Membership Plans (Dummy)
        const plans = await MembershipPlan.insertMany([
            { 
                name: 'Basic Monthly', 
                price: 1500, 
                duration: { value: 1, unit: 'months' }, 
                status: 'Active',
                features: ['Attendance', 'Locker']
            },
            { 
                name: 'Quarterly Pro', 
                price: 4000, 
                duration: { value: 3, unit: 'months' }, 
                status: 'Active',
                features: ['Attendance', 'Trainer Access', 'Workout Plan', 'Locker']
            },
            { 
                name: 'Annual Elite', 
                price: 12000, 
                duration: { value: 12, unit: 'months' }, 
                status: 'Active',
                features: ['Attendance', 'Trainer Access', 'Diet Plan', 'Workout Plan', 'Locker', 'Massage']
            }
        ]);
        console.log('📦 Created 3 Membership Plans');

        // 5. Create 10 Real Workout Plans
        const workoutData = [
            {
                name: "3-Day Beginner Full Body",
                type: "Strength",
                difficulty: "Beginner",
                durationWeeks: 8,
                description: "Fundamental strength building for new trainees. Focus on compound movements.",
                exercises: [
                    { name: "Barbell Squats", sets: 3, reps: "10-12", rest: "90s", notes: "Focus on depth" },
                    { name: "Bench Press", sets: 3, reps: "10", rest: "90s", notes: "Full range of motion" },
                    { name: "Deadlifts", sets: 2, reps: "8-10", rest: "120s", notes: "Keep back straight" }
                ]
            },
            {
                name: "Advanced Hypertrophy Split",
                type: "Muscle Gain",
                difficulty: "Advanced",
                durationWeeks: 12,
                description: "High volume program designed for maximum muscle size and density.",
                exercises: [
                    { name: "Incline DB Press", sets: 4, reps: "12-15", rest: "60s" },
                    { name: "Weighted Pull-ups", sets: 4, reps: "8-10", rest: "90s" },
                    { name: "Lateral Raises", sets: 5, reps: "15-20", rest: "45s", notes: "Maintain tension" }
                ]
            },
            {
                name: "Fat Torch HIIT Circuit",
                type: "Weight Loss",
                difficulty: "Intermediate",
                durationWeeks: 6,
                description: "Combination of resistance and high-intensity cardio to maximize caloric burn.",
                exercises: [
                    { name: "Kettlebell Swings", sets: 4, reps: "30s", rest: "30s" },
                    { name: "Burpees", sets: 4, reps: "30s", rest: "30s" },
                    { name: "Mountain Climbers", sets: 4, reps: "45s", rest: "15s" }
                ]
            },
            {
                name: "Marathon Base Builder",
                type: "Endurance",
                difficulty: "Intermediate",
                durationWeeks: 16,
                description: "Endurance-focused program primarily for runners looking to improve durability.",
                exercises: [
                    { name: "Leg Press", sets: 3, reps: "20", rest: "60s" },
                    { name: "Lunges", sets: 3, reps: "12/side", rest: "60s" },
                    { name: "Plank", sets: 3, reps: "60s", rest: "30s" }
                ]
            },
            {
                name: "Powerlifting Peak Phase",
                type: "Strength",
                difficulty: "Advanced",
                durationWeeks: 4,
                description: "Intense peaking cycle for improving one-rep max on Squat, Bench, and Deadlift.",
                exercises: [
                    { name: "Heavy Singles Squat", sets: 5, reps: "1", rest: "3-5m" },
                    { name: "Pause Bench Press", sets: 3, reps: "3", rest: "3m" },
                    { name: "Deficit Deadlifts", sets: 2, reps: "3", rest: "5m" }
                ]
            },
            {
                name: "Yoga-Inspired Mobility",
                type: "Flexibility",
                difficulty: "Beginner",
                durationWeeks: 4,
                description: "Improve joint health and range of motion with this daily mobility routine.",
                exercises: [
                    { name: "World's Greatest Stretch", sets: 3, reps: "5/side", rest: "0s" },
                    { name: "90/90 Hip Switches", sets: 3, reps: "10/side", rest: "0s" },
                    { name: "Cat-Cow", sets: 2, reps: "15", rest: "0s" }
                ]
            },
            {
                name: "Functional Athlete 1.0",
                type: "Strength",
                difficulty: "Intermediate",
                durationWeeks: 8,
                description: "Balanced athleticism focusing on power, speed, and unilateral strength.",
                exercises: [
                    { name: "Clean & Press", sets: 4, reps: "6", rest: "90s" },
                    { name: "Box Jumps", sets: 5, reps: "5", rest: "120s" },
                    { name: "Single Leg Deadlift", sets: 3, reps: "10/side", rest: "60s" }
                ]
            },
            {
                name: "Lean Muscle Prototype",
                type: "Muscle Gain",
                difficulty: "Intermediate",
                durationWeeks: 10,
                description: "Standard 4-day bodybuilding-style split for consistent growth.",
                exercises: [
                    { name: "Lat Pulldowns", sets: 4, reps: "12", rest: "60s" },
                    { name: "Barbell Rows", sets: 3, reps: "10", rest: "90s" },
                    { name: "Face Pulls", sets: 3, reps: "15-20", rest: "45s" }
                ]
            },
            {
                name: "Wedding Prep Express",
                type: "Weight Loss",
                difficulty: "Beginner",
                durationWeeks: 6,
                description: "Time-efficient workouts to tone up quickly for special occasions.",
                exercises: [
                    { name: "Goblet Squats", sets: 3, reps: "15", rest: "45s" },
                    { name: "Push-ups", sets: 3, reps: "Max", rest: "60s" },
                    { name: "Russian Twists", sets: 3, reps: "20/side", rest: "30s" }
                ]
            },
            {
                name: "Home Gym Hero",
                type: "Strength",
                difficulty: "Intermediate",
                durationWeeks: 8,
                description: "Designed for those with limited equipment (Dumbbells and a Bench).",
                exercises: [
                    { name: "DB RDL", sets: 4, reps: "12", rest: "60s" },
                    { name: "Arnold Press", sets: 3, reps: "10", rest: "60s" },
                    { name: "Bulgarian Split Squat", sets: 3, reps: "10/side", rest: "90s" }
                ]
            }
        ];
        await WorkoutPlan.create(workoutData);
        console.log('💪 Created 10 Professional Workout Plans');

        // 6. Create 10 Real Diet Plans
        const dietData = [
            {
                name: "Standard Muscle Fuel",
                goal: "Muscle Gain",
                description: "Balanced high-protein intake for optimal muscle recovery and growth.",
                totalCalories: 3200, totalProtein: 180, totalCarbs: 400, totalFats: 80,
                meals: [
                    { time: "08:00", mealName: "Power Breakfast", items: "Oats, 4 Egg Whites, 1 Whole Egg, Banana", calories: 600, protein: 35 },
                    { time: "13:00", mealName: "Pre-Workout Lunch", items: "Grilled Chicken, Brown Rice, Broccoli", calories: 800, protein: 50 },
                    { time: "20:00", mealName: "Recovery Dinner", items: "Pan-seared Salmon, Sweet Potato, Asparagus", calories: 700, protein: 45 }
                ]
            },
            {
                name: "Rapid Fat Shred Keto",
                goal: "Keto",
                description: "Ultra-low carb, high fat diet designed to trigger ketosis.",
                totalCalories: 2000, totalProtein: 140, totalCarbs: 25, totalFats: 150,
                meals: [
                    { time: "09:00", mealName: "Keto Breakfast", items: "Scrambled Eggs with Avocado & Bacon", calories: 700, protein: 30 },
                    { time: "14:00", mealName: "Fat-Fuel Lunch", items: "Bun-less Burger with Ghee & Salad", calories: 600, protein: 40 },
                    { time: "19:00", mealName: "High Fat Dinner", items: "Ribeye Steak with Buttered Cauliflower", calories: 700, protein: 50 }
                ]
            },
            {
                name: "Lean Mean Vegan",
                goal: "Weight Loss",
                description: "Plant-based whole foods focused on fiber and vital micro-nutrients.",
                totalCalories: 1800, totalProtein: 100, totalCarbs: 250, totalFats: 50,
                meals: [
                    { time: "08:30", mealName: "Clean Start", items: "Chia Pudding with Berries & Soy Milk", calories: 400, protein: 15 },
                    { time: "13:30", mealName: "Macro Bowl", items: "Quinoa, Chickpeas, Kale, Tahini Sauce", calories: 600, protein: 25 },
                    { time: "20:00", mealName: "Protein Soup", items: "Red Lentil Dahl with Spinach", calories: 500, protein: 30 }
                ]
            },
            {
                name: "Metabolic Maintenance",
                goal: "Maintenance",
                description: "Stay at your current weight while fueling your workouts with variety.",
                totalCalories: 2500, totalProtein: 150, totalCarbs: 300, totalFats: 70,
                meals: [
                    { time: "08:00", mealName: "Classic Oats", items: "Steel Cut Oats, Whey, Blueberries", calories: 500, protein: 30 },
                    { time: "13:00", mealName: "Bistro Turkey", items: "Turkey Sandwich, Apple, Greek Yogurt", calories: 700, protein: 40 },
                    { time: "19:30", mealName: "Home Grill", items: "Lean Beef Tacos with Fresh Salsa", calories: 800, protein: 45 }
                ]
            },
            {
                name: "16:8 Lean Gains",
                goal: "Intermittent Fasting",
                description: "Focused on an 8-hour window to improve insulin sensitivity.",
                totalCalories: 2400, totalProtein: 160, totalCarbs: 250, totalFats: 65,
                meals: [
                    { time: "12:00", mealName: "Window Opener", items: "Tuna Salad on Greens, Almonds", calories: 800, protein: 60 },
                    { time: "16:00", mealName: "Workout Snack", items: "Protein Shake, 2 Rice Cakes with Peanut Butter", calories: 400, protein: 30 },
                    { time: "20:00", mealName: "The Big Finish", items: "Sirloin Steak, Pasta with Pesto, Salad", calories: 1200, protein: 70 }
                ]
            },
            {
                name: "Athlete's High Performance",
                goal: "Maintenance",
                description: "Maximizing energy for competitive sports and high intensity training.",
                totalCalories: 3500, totalProtein: 175, totalCarbs: 500, totalFats: 85,
                meals: [
                    { time: "07:00", mealName: "Fuel Load", items: "Pancakes with Maple Syrup & Eggs", calories: 900, protein: 35 },
                    { time: "12:30", mealName: "Mid-Day Surge", items: "Pasta Bolognese with Lean Beef", calories: 1000, protein: 50 },
                    { time: "21:00", mealName: "Caloric Recovery", items: "Rice Bowl with Chicken & Guacamole", calories: 1000, protein: 45 }
                ]
            },
            {
                name: "Wedding Shed Phase 1",
                goal: "Weight Loss",
                description: "Aggressive but safe deficit for rapid toning.",
                totalCalories: 1500, totalProtein: 130, totalCarbs: 120, totalFats: 45,
                meals: [
                    { time: "09:00", mealName: "Lean Omelette", items: "5 Egg Whites, Spinach, Tomatoes", calories: 300, protein: 30 },
                    { time: "14:00", mealName: "Green Lunch", items: "Grilled Cod, Steamed Veggies, Slice of Lemon", calories: 400, protein: 40 },
                    { time: "19:00", mealName: "Night Lite", items: "Grilled Turkey Medallions, Side Salad", calories: 500, protein: 45 }
                ]
            },
            {
                name: "Strict Paleo Protocol",
                goal: "Maintenance",
                description: "Whole, unprocessed foods designed to mimic ancestral diets.",
                totalCalories: 2200, totalProtein: 150, totalCarbs: 150, totalFats: 100,
                meals: [
                    { time: "08:00", mealName: "Paleo Scramble", items: "Eggs, Peppers, Onions, Homemade Sausage", calories: 600, protein: 35 },
                    { time: "13:00", mealName: "Hunters Salad", items: "Chicken Breast, Walnuts, Grapes on Greens", calories: 700, protein: 45 },
                    { time: "19:00", mealName: "Catch of the Day", items: "Baked Sea Bass with Roasted Beets", calories: 600, protein: 40 }
                ]
            },
            {
                name: "Plant-Based Power (Bulking)",
                goal: "Muscle Gain",
                description: "How to bulk effectively on a 100% plant-based diet.",
                totalCalories: 3000, totalProtein: 150, totalCarbs: 450, totalFats: 80,
                meals: [
                    { time: "08:00", mealName: "Protein Smoothie Bowl", items: "Pea Protein, Berries, Oats, Hemp Seeds", calories: 700, protein: 40 },
                    { time: "13:00", mealName: "Seitan Stir Fry", items: "Seitan, Rice, Veggies, Peanut Sauce", calories: 900, protein: 50 },
                    { time: "20:00", mealName: "Tempeh Tacos", items: "Tempeh, Corn Tortillas, Black Beans", calories: 800, protein: 35 }
                ]
            },
            {
                name: "Intermittent Keto Hybrid",
                goal: "Keto",
                description: "Combines 18:6 fasting with ketogenic macro ratios.",
                totalCalories: 1900, totalProtein: 130, totalCarbs: 20, totalFats: 140,
                meals: [
                    { time: "14:00", mealName: "The Fast Breaker", items: "Coffee with Heavy Cream, 3 Eggs with Cheese", calories: 800, protein: 30 },
                    { time: "19:30", mealName: "Final Keto Feast", items: "Pork Chops, Creamy Spinach, Butter Sauce", calories: 1100, protein: 60 }
                ]
            }
        ];
        await DietPlan.create(dietData);
        console.log('🥗 Created 10 Professional Diet Plans');

        // 3. Create 5 Trainers
        const trainerData = [
            {
                name: 'Raj Singh',
                phone: '9849061942',
                email: 'raj.singh_tr@gymerp.com',
                gender: 'Male',
                dob: '1990-05-15',
                address: 'H-45, Sector 15, Rohini, Delhi',
                specialization: ['Bodybuilding', 'Strength Training'],
                experience: 8,
                salary: 45000,
                shift: 'Morning',
                shiftTime: '06:00 AM - 11:00 AM',
                availabilityStatus: 'Active'
            },
            {
                name: 'Anjali Sharma',
                phone: '9876543210',
                email: 'anjali.fit@gymerp.com',
                gender: 'Female',
                dob: '1994-08-22',
                address: 'A-12, Malviya Nagar, Jaipur',
                specialization: ['Yoga', 'Pilates'],
                experience: 5,
                salary: 35000,
                shift: 'Afternoon',
                shiftTime: '12:00 PM - 04:00 PM',
                availabilityStatus: 'Active'
            },
            {
                name: 'Vikram Mehta',
                phone: '9988776655',
                email: 'vikram.pro@gymerp.com',
                gender: 'Male',
                dob: '1988-12-05',
                address: 'Flat 402, Skyline Residency, Mumbai',
                specialization: ['Crossfit', 'Cardio Specialist'],
                experience: 10,
                salary: 55000,
                shift: 'Evening',
                shiftTime: '04:00 PM - 09:00 PM',
                availabilityStatus: 'Active'
            },
            {
                name: 'Priya Verma',
                phone: '9122334455',
                email: 'priya.trainer@gymerp.com',
                gender: 'Female',
                dob: '1992-03-30',
                address: 'House No 89, Indiranagar, Bangalore',
                specialization: ['Zumba', 'General Fitness'],
                experience: 6,
                salary: 38000,
                shift: 'Evening',
                shiftTime: '05:00 PM - 09:00 PM',
                availabilityStatus: 'Active'
            },
            {
                name: 'Rahul Khanna',
                phone: '9654321098',
                email: 'rahul.k@gymerp.com',
                gender: 'Male',
                dob: '1995-01-10',
                address: 'Plot 7, Gachibowli, Hyderabad',
                specialization: ['Powerlifting', 'Nutrition Coaching'],
                experience: 4,
                salary: 32000,
                shift: 'Full Day',
                shiftTime: '10:00 AM - 07:00 PM',
                availabilityStatus: 'Active'
            }
        ];

        const trainers = [];
        for (const data of trainerData) {
            const t = await Trainer.create(data);
            trainers.push(t);
        }
        console.log('💪 Created 5 Trainers');

        // 4. Create 10 Real Members with diverse Payment Statuses
        const memberData = [
            { name: 'Amit Kumar', phone: '9999000011', trainer: trainers[0], plan: plans[0], monthOffset: 0, pStat: 'Paid', pAmt: 1500 },
            { name: 'Sonal Jain', phone: '9999000022', trainer: trainers[0], plan: plans[1], monthOffset: 1, pStat: 'Partial', pAmt: 2000 },
            { name: 'Rohan Deshmukh', phone: '9999000033', trainer: trainers[1], plan: plans[0], monthOffset: 2, pStat: 'Pending', pAmt: 0 },
            { name: 'Megha Singh', phone: '9999000044', trainer: trainers[1], plan: plans[2], monthOffset: 0, pStat: 'Paid', pAmt: 12000 },
            { name: 'Karan Johar', phone: '9999000055', trainer: trainers[2], plan: plans[1], monthOffset: 3, pStat: 'Paid', pAmt: 4000 },
            { name: 'Deepika P', phone: '9999000066', trainer: trainers[2], plan: plans[1], monthOffset: 4, pStat: 'Partial', pAmt: 1500 },
            { name: 'Ranbir K', phone: '9999000077', trainer: trainers[3], plan: plans[0], monthOffset: 5, pStat: 'Paid', pAmt: 1500 },
            { name: 'Alia B', phone: '9999000088', trainer: trainers[3], plan: plans[2], monthOffset: 1, pStat: 'Pending', pAmt: 0 },
            { name: 'Varun D', phone: '9999000099', trainer: trainers[4], plan: plans[0], monthOffset: 2, pStat: 'Paid', pAmt: 1500 },
            { name: 'Sara Ali', phone: '9999000000', trainer: trainers[4], plan: plans[1], monthOffset: 0, pStat: 'Paid', pAmt: 4000 }
        ];

        for (const m of memberData) {
            const createdDate = new Date();
            createdDate.setMonth(createdDate.getMonth() - m.monthOffset);
            
            await FullMember.create({
                personalInfo: {
                    fullName: m.name,
                    mobile: m.phone,
                    email: m.name.toLowerCase().replace(' ', '.') + '@gmail.com',
                    gender: m.name.endsWith('a') || m.name.includes('Sonal') || m.name.includes('Megha') || m.name.includes('Deepika') || m.name.includes('Alia') || m.name.includes('Sara') ? 'Female' : 'Male',
                    address: 'Local Area, City'
                },
                identity: {
                    idProofType: 'Aadhar',
                    idProofNumber: '1234-5678-9012'
                },
                membershipInfo: {
                    planName: m.plan.name,
                    feesAmount: m.plan.price,
                    finalAmount: m.plan.price,
                    paidAmount: m.pAmt,
                    pendingAmount: m.plan.price - m.pAmt,
                    paymentStatus: m.pStat,
                    dueDate: m.pStat === 'Partial' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
                },
                trainerInfo: {
                    trainerId: m.trainer._id,
                    assignedTrainer: m.trainer.name,
                    workoutPlan: 'General Fitness Protocol',
                    batchTiming: m.trainer.shift + ' Batch'
                },
                createdAt: createdDate
            });
        }
        console.log('👥 Created 10 Members');

        console.log('🌟 Seeding Completed Successfully');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
