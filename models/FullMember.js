const mongoose = require('mongoose');

const FullMemberSchema = new mongoose.Schema({
  // ── 1. Personal Information ────────────────────────────────────────────────
  personalInfo: {
    fullName:               { type: String, required: true, trim: true },
    mobile:                 { type: String, required: true },
    email:                  { type: String, lowercase: true, trim: true },
    gender:                 { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    dob:                    { type: Date },
    age:                    { type: Number },
    address:                { type: String },
    emergencyContactName:   { type: String, default: '' },
    emergencyContactPhone:  { type: String, default: '' },
  },

  // ── 2. Identity & Member Details ──────────────────────────────────────────
  identity: {
    memberId:         { type: String },          // auto-generated, no unique constraint (handled in code)
    profilePhoto:     { type: String, default: '' },
    idProofType:      { type: String, default: '' },
    idProofNumber:    { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
  },

  // ── 3. Fitness Details ────────────────────────────────────────────────────
  fitnessInfo: {
    height:            { type: Number },
    weight:            { type: Number },
    bmi:               { type: Number },
    fitnessGoal:       [{ type: String }],
    medicalConditions: { type: String, default: '' },
    injuries:          { type: String, default: '' },
  },

  // ── 4. Membership Plan ─────────────────────────────────────────────────────
  membershipInfo: {
    planName:         { type: String, default: 'Monthly' },
    planDuration:     { type: Number },
    startDate:        { type: Date, default: Date.now },
    endDate:          { type: Date },
    feesAmount:       { type: Number, default: 0 },
    discount:         { type: Number, default: 0 },
    finalAmount:      { type: Number, default: 0 },
    paidAmount:       { type: Number, default: 0 },
    pendingAmount:    { type: Number, default: 0 },
    nextPaymentDate:  { type: Date },
    paymentStatus:    { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
    paymentMode:      { type: String, default: '' },
    dueDate:          { type: Date },
  },

  // ── 5. Payment Details ────────────────────────────────────────────────────
  paymentInfo: {
    paymentDate:      { type: Date, default: Date.now },
    invoiceNumber:    { type: String, default: '' },
    receiptFile:      { type: String, default: '' },
  },

  // ── 6. Trainer & Batch ─────────────────────────────────────────────────────
  trainerInfo: {
    trainerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
    assignedTrainer:  { type: String, default: '' },
    batchTiming:      { type: String, default: 'Morning (6:00 - 8:00)' },
    customTime:       { type: String, default: '' },
    workoutPlan:      { type: String, default: '' },
  },

  // ── 7. Attendance & Status ─────────────────────────────────────────────────
  attendanceInfo: {
    joinDate:          { type: Date, default: Date.now },
    lastVisitDate:     { type: Date },
    membershipStatus:  { type: String, enum: ['Active', 'Expired', 'Freeze', 'Pending'], default: 'Active' },
  },

  // ── 8. Additional Info ─────────────────────────────────────────────────────
  extras: {
    dietPlan:         { type: String, default: '' },
    progressPhotos:   [{ type: String }],
    notes:            { type: String, default: '' },
    referralSource:   { type: String, default: '' },
    lockerNumber:     { type: String, default: '' },
    rfidCard:         { type: String, default: '' },
  },
  
  // ── Audit ────────────────────────────────────────────────────────────────
  createdBy:          { type: String, default: 'Admin' },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
  }
}, { timestamps: true });

// Auto-generate memberId and invoiceNumber before saving
FullMemberSchema.pre('save', async function (next) {
  try {
    if (!this.identity.memberId) {
      const count = await this.constructor.countDocuments();
      this.identity.memberId = `GYM-${String(count + 1).padStart(4, '0')}`;
    }
    if (!this.paymentInfo.invoiceNumber) {
      const d = new Date();
      const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      const rand = Math.floor(1000 + Math.random() * 9000);
      this.paymentInfo.invoiceNumber = `INV-${dateStr}-${rand}`;
    }
    next();
  } catch (err) { next(err); }
});

// Indexes for performance
FullMemberSchema.index({ gymId: 1, 'attendanceInfo.membershipStatus': 1 });
FullMemberSchema.index({ gymId: 1, 'membershipInfo.paymentStatus': 1 });
FullMemberSchema.index({ 'trainerInfo.trainerId': 1 });
FullMemberSchema.index({ 'trainerInfo.assignedTrainer': 1 });

module.exports = mongoose.model('FullMember', FullMemberSchema);
