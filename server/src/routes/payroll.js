const express = require('express');
const prisma = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// List payroll records
router.get('/', authenticate, async (req, res) => {
  try {
    const { month, year, employeeId, paymentStatus } = req.query;

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (employeeId) where.employeeId = parseInt(employeeId);

    if (req.user.role === 'employee' || req.user.role === 'onboarding') {
      where.employeeId = req.user.employeeId;
    }

    const records = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          include: { department: true, designation: true }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeId: 'asc' }]
    });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payroll records.' });
  }
});

// Generate monthly payroll for all active employees
router.post('/generate', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const month = parseInt(req.body.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.body.year) || new Date().getFullYear();

    const employees = await prisma.employee.findMany({
      where: { status: 'active' }
    });

    const results = [];
    for (const emp of employees) {
      const baseSalary = emp.salary || 50000;
      // Standard allowances
      const medical = Math.round(baseSalary * 0.10);
      const conveyance = Math.round(baseSalary * 0.05);
      const grossSalary = baseSalary + medical + conveyance;

      // Income tax estimation (5%)
      const tax = grossSalary > 50000 ? Math.round(grossSalary * 0.05) : 0;
      const providentFund = Math.round(baseSalary * 0.05);
      const totalDeductions = tax + providentFund;
      const netSalary = grossSalary - totalDeductions;

      const allowances = JSON.stringify([
        { name: 'Medical Allowance', amount: medical },
        { name: 'Conveyance Allowance', amount: conveyance }
      ]);

      const deductions = JSON.stringify([
        { name: 'Income Tax', amount: tax },
        { name: 'Provident Fund', amount: providentFund }
      ]);

      const payroll = await prisma.payroll.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year
          }
        },
        update: {
          baseSalary,
          allowances,
          deductions,
          grossSalary,
          netSalary,
          tax
        },
        create: {
          employeeId: emp.id,
          month,
          year,
          baseSalary,
          allowances,
          deductions,
          grossSalary,
          netSalary,
          tax,
          paymentStatus: 'pending'
        }
      });
      results.push(payroll);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        module: 'Payroll',
        description: `Generated payroll for ${month}/${year} (${results.length} employees)`,
        userId: req.user.id,
        ipAddress: req.ip
      }
    });

    res.json({ success: true, message: `Payroll generated for ${results.length} employees.`, count: results.length });
  } catch (err) {
    console.error('Payroll generation error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate payroll.' });
  }
});

// Update payment status (mark as paid)
router.put('/:id/status', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { paymentStatus, paymentMethod } = req.body;

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: paymentMethod || 'Bank Transfer',
        paymentDate: new Date().toISOString().split('T')[0]
      }
    });

    res.json({ success: true, message: 'Payroll record updated.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update payroll record.' });
  }
});

module.exports = router;
