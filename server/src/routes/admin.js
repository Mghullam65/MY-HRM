const express = require('express');
const prisma = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get organization structure summary (restricted to Super Admin & HR Manager)
router.get('/structure', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const [departments, designations, branches, shifts] = await Promise.all([
      prisma.department.findMany({ include: { _count: { select: { employees: true } } } }),
      prisma.designation.findMany({ include: { department: true, _count: { select: { employees: true } } } }),
      prisma.branch.findMany({ include: { _count: { select: { employees: true } } } }),
      prisma.shift.findMany({ include: { _count: { select: { employees: true } } } })
    ]);

    res.json({
      success: true,
      data: { departments, designations, branches, shifts }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve organization structure.' });
  }
});

// Audit Logs
router.get('/audit-logs', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const { module, action, limit } = req.query;
    const where = {};
    if (module && module !== 'all') where.module = module;
    if (action && action !== 'all') where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit ? parseInt(limit) : 100,
      orderBy: { timestamp: 'desc' }
    });

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

// Create department
router.post('/departments', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const { code, name, head, description, budget } = req.body;
    const dept = await prisma.department.create({
      data: {
        code: code.toUpperCase(),
        name,
        head,
        description,
        budget: parseFloat(budget) || 0
      }
    });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Error creating department.' });
  }
});

module.exports = router;
