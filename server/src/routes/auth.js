const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const store = require('../services/store');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── In-Memory Brute-Force Rate Limiter ──
const loginAttempts = new Map(); // key: `${ip}_${username}` => { count, firstAttempt, lockedUntil }
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5-minute lockout
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;  // 5-minute rolling window

function checkRateLimit(ip, username) {
  const cleanIp = (ip || '127.0.0.1').replace(/^.*:/, '');
  const key = `${cleanIp}_${(username || '').toLowerCase()}`;
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (record) {
    if (record.lockedUntil && now < record.lockedUntil) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        blocked: true,
        waitSeconds,
        message: `Too many failed login attempts. Security lockout active. Please try again in ${waitSeconds} seconds.`
      };
    }
    if (now - record.firstAttempt > ATTEMPT_WINDOW_MS && (!record.lockedUntil || now >= record.lockedUntil)) {
      loginAttempts.delete(key);
    }
  }
  return { blocked: false };
}

function recordFailedLogin(ip, username) {
  const cleanIp = (ip || '127.0.0.1').replace(/^.*:/, '');
  const key = `${cleanIp}_${(username || '').toLowerCase()}`;
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[Security Alert] IP ${cleanIp} locked out for 5 minutes after ${record.count} failed login attempts for user '${username}'.`);
  }
  loginAttempts.set(key, record);
}

function clearFailedLogin(ip, username) {
  const cleanIp = (ip || '127.0.0.1').replace(/^.*:/, '');
  const key = `${cleanIp}_${(username || '').toLowerCase()}`;
  loginAttempts.delete(key);
}

// Helper to authenticate using central StoreService
function loginWithStore(username, password, req, res) {
  try {
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const rateCheck = checkRateLimit(clientIp, username);
    if (rateCheck.blocked) {
      res.setHeader('Retry-After', String(rateCheck.waitSeconds));
      return res.status(429).json({ success: false, message: rateCheck.message, retryAfter: rateCheck.waitSeconds });
    }

    const users = store.getTable('users') || [];
    const user = users.find(u => u.username === username);
    if (!user || user.status !== 'active') {
      recordFailedLogin(clientIp, username);
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const employees = store.getTable('employees') || [];
    const employee = employees.find(e => e.id === user.employeeId) || null;

    if (employee && (employee.status === 'inactive' || employee.status === 'terminated')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account Inactive: Your employee profile has been deactivated. Please contact HR Administration.' 
      });
    }

    let isValid = false;
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isValid = bcrypt.compareSync(password, user.password);
    } else {
      isValid = (password === user.password);
    }

    if (!isValid) {
      recordFailedLogin(clientIp, username);
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Login succeeded: clear failed counter
    clearFailedLogin(clientIp, username);

    // Update lastLogin
    user.lastLogin = new Date().toISOString();
    store.setTable('users', users);

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...cleanUser } = user;
    return res.json({
      success: true,
      token,
      user: cleanUser,
      employee
    });
  } catch (err) {
    console.error('Store login error:', err);
    return res.status(500).json({ success: false, message: 'Internal authentication error.' });
  }
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const rateCheck = checkRateLimit(clientIp, username);
    if (rateCheck.blocked) {
      res.setHeader('Retry-After', String(rateCheck.waitSeconds));
      return res.status(429).json({ success: false, message: rateCheck.message, retryAfter: rateCheck.waitSeconds });
    }

    // Fast fallback: if PostgreSQL is not active or Prisma fails, use StoreService
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { username },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
              branch: true,
              shift: true
            }
          }
        }
      });
    } catch (dbErr) {
      // Prisma failed (e.g. Postgres offline), authenticate with live StoreService
      return loginWithStore(username, password, req, res);
    }

    if (!user || user.status !== 'active') {
      recordFailedLogin(clientIp, username);
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    if (user.employee && (user.employee.status === 'inactive' || user.employee.status === 'terminated')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account Inactive: Your employee profile has been deactivated. Please contact HR Administration.' 
      });
    }

    // Support both bcrypt hash and initial plain password for seamless upgrade
    let isValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      isValid = (password === user.password);
      if (isValid) {
        // Upgrade password to secure hash
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      }
    }

    if (!isValid) {
      recordFailedLogin(clientIp, username);
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Clear failed login attempts upon success
    clearFailedLogin(clientIp, username);

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Record in audit log
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        module: 'Auth',
        description: `${user.employee?.fullName || user.username} logged in`,
        userId: user.id,
        ipAddress: req.ip
      }
    });

    // Issue JWT token (7 days validity)
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clean user object
    const { password: _, ...cleanUser } = user;

    res.json({
      success: true,
      token,
      user: cleanUser,
      employee: user.employee
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// Current User Info
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
          branch: true,
          shift: true
        }
      }
    }
  });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const { password: _, ...cleanUser } = user;
  res.json({ success: true, user: cleanUser, employee: user.employee });
});

// Change Password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let isValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      isValid = (currentPassword === user.password);
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed }
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
});

module.exports = router;
