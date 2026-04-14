const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// GET /api/attendance - Get filtered logs
router.get('/', attendanceController.getLogs);

// GET /api/attendance/summary - Get summary stats for today
router.get('/summary', attendanceController.getDailySummary);

// GET /api/attendance/member/:id - Get attendance logs for a specific member
router.get('/member/:id', attendanceController.getMemberAttendance);

// GET /api/attendance/trainer/:id - Get attendance logs for a specific trainer
router.get('/trainer/:id', attendanceController.getTrainerAttendance);

// POST /api/attendance/check-in - Member check-in
router.post('/check-in', attendanceController.checkIn);

// POST /api/attendance/check-out - Member check-out
router.post('/check-out', attendanceController.checkOut);

// Trainer Attendance
router.post('/trainer-check-in', attendanceController.trainerCheckIn);
router.post('/trainer-check-out', attendanceController.trainerCheckOut);

module.exports = router;
