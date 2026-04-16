const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { initAutomationJobs } = require('./cron/automationJobs');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: '*', 
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Explicitly allow both
  allowEIO3: true // Support older clients if any
});
app.set('io', io);

// Handle socket connections dynamically
io.on('connection', (socket) => {
  console.log('🔗 Client connected to WebSockets:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Initialize automated routines passing the socket.io instance
initAutomationJobs(io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⏳ ${req.method} ${req.originalUrl} took ${duration}ms`);
    } else {
      console.log(`📡 ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

const connectDB = require('./config/db.js');

// ── MongoDB Connection ────────────────────────────────────────────────────────
connectDB();

// ── API Routes ────────────────────────────────────────────────────────────────
const dashboardRoutes = require('./routes/dashboardRoutes');
const memberRoutes = require('./routes/memberRoutes');
const gymRoutes = require('./routes/gymRoutes');
const fullMemberRoutes = require('./routes/fullMemberRoutes');
const membershipPlanRoutes = require('./routes/membershipPlanRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const planRoutes = require('./routes/planRoutes');
const gymSettingsRoutes = require('./routes/gymSettingsRoutes');
const authRoutes = require('./routes/authRoutes');
const marketingRoutes = require('./routes/marketingRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const searchRoutes = require('./routes/searchRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const leadRoutes = require('./routes/leadRoutes');
const staffRoutes = require('./routes/staffRoutes');
const expenseRoutes = require('./routes/expenseRoutes');


app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/full-members', fullMemberRoutes);
app.use('/api/plans', membershipPlanRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/plan-library', planRoutes);
app.use('/api/gym-settings', gymSettingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/settings', settingsRoutes);

app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentRoutes);

app.use('/api/leads', leadRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/expenses', expenseRoutes);


// Serve uploaded files statically
const path = require('path');
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Gym ERP API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("🚀 Gym ERP Backend is Running Successfully");
});

// ── 404 Fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Backend server running on http://localhost:${PORT}`));
