const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const settlementRoutes = require('./routes/settlements');
const companyRoutes = require('./routes/companies');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const syncRoutes = require('./routes/sync');
const jobsRoutes = require('./routes/jobs');
const jobEngine = require('./jobs/dailyAttendanceSummary');
const emailRoutes = require('./routes/email');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allow CDN resources (FontAwesome, Chart.js, Google Fonts)
  crossOriginResourcePolicy: false
}));

// Additional Hardening Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Prevent clickjacking
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME-type sniffing
  res.setHeader('X-XSS-Protection', '1; mode=block'); // XSS filter protection
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); // Prevent link/token referrer leaks
  res.removeHeader('X-Powered-By'); // Hide Express signature from fingerprinting
  next();
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'HRM Pro REST API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', jobsRoutes);

// Serve uploaded files (CVs, documents)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend files directly from the parent directory
const clientDir = path.join(__dirname, '../../');
app.use(express.static(clientDir));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ===============================================`);
  console.log(`   HRM Pro Server is running on http://0.0.0.0:${PORT}`);
  console.log(`   Local Machine:     http://localhost:${PORT}`);
  console.log(`   Frontend served at http://localhost:${PORT}`);
  console.log(`   REST API ready at  http://localhost:${PORT}/api/health`);
  console.log(`   ===============================================\n`);

  // Start server-side background job scheduler
  try {
    jobEngine.startSchedulerTicker();
  } catch (err) {
    console.error('[Server] Failed to initialize background job scheduler:', err.message);
  }
});

module.exports = app;
