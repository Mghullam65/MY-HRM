// Normalize all Vercel Postgres environment variables
const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (dbUrl) {
  process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || dbUrl;
  process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING || dbUrl;
  process.env.DATABASE_URL = process.env.DATABASE_URL || dbUrl;
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const prisma = require('../server/src/db');
const seedDatabase = require('../server/prisma/seed-fn');

const authRoutes = require('../server/src/routes/auth');
const employeeRoutes = require('../server/src/routes/employees');
const attendanceRoutes = require('../server/src/routes/attendance');
const leaveRoutes = require('../server/src/routes/leaves');
const payrollRoutes = require('../server/src/routes/payroll');
const adminRoutes = require('../server/src/routes/admin');
const notificationRoutes = require('../server/src/routes/notifications');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auto-seed if database is freshly created and empty
let isSeeded = false;
app.use(async (req, res, next) => {
  if (!isSeeded && req.path.startsWith('/api')) {
    try {
      const count = await prisma.department.count().catch(() => 0);
      if (count === 0) {
        console.log('Database empty on Vercel, auto-seeding...');
        await seedDatabase(prisma);
        isSeeded = true;
      } else {
        isSeeded = true;
      }
    } catch (e) {
      console.warn('Auto-seed check notice:', e.message);
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    system: 'HRM Pro Cloud API (Vercel Serverless)',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Manual seed trigger
app.get('/api/seed', async (req, res) => {
  try {
    await seedDatabase(prisma);
    res.json({ success: true, message: 'Database seeded successfully on Vercel!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

module.exports = app;
