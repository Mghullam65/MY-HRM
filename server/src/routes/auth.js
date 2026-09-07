const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = await prisma.user.findUnique({
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

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
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
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

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
