const express = require('express');
const prisma = require('../db');
const { authenticate, authorize, getScopedEmployeeIds, assertEmployeeAccess } = require('../middleware/auth');
const TaxEngine = require('../services/taxEngine');
const store = require('../services/store');

const router = express.Router();

// List payroll records (role-scoped, protected against IDOR)
router.get('/', authenticate, async (req, res) => {
  try {
    const { month, year, employeeId, paymentStatus } = req.query;

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (employeeId) {
      const hasAccess = await assertEmployeeAccess(req, res, employeeId);
      if (!hasAccess) return;
      where.employeeId = parseInt(employeeId);
    } else {
      const scopedIds = await getScopedEmployeeIds(req.user);
      if (scopedIds !== null) {
        where.employeeId = { in: scopedIds };
      }
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

// Tax Slabs List
router.get('/tax-slabs', authenticate, async (req, res) => {
  try {
    const slabs = store.get('tax_table') || TaxEngine.DEFAULT_TAX_SLABS;
    res.json({ success: true, data: slabs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve tax slabs.' });
  }
});

// Add / Update Tax Slab
router.post('/tax-slabs', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const { id, payroll_type, range_from, range_to, fixed_tax, percentage_over, effective_date } = req.body;
    let slabs = store.get('tax_table') || [...TaxEngine.DEFAULT_TAX_SLABS];

    if (id) {
      // Update
      const idx = slabs.findIndex(s => s.id === parseInt(id));
      if (idx !== -1) {
        slabs[idx] = {
          ...slabs[idx],
          payroll_type: parseInt(payroll_type) || 1,
          range_from: parseFloat(range_from) || 0,
          range_to: range_to ? parseFloat(range_to) : null,
          fixed_tax: parseFloat(fixed_tax) || 0,
          percentage_over: parseFloat(percentage_over) || 0,
          effective_date: effective_date || '2025-07-01'
        };
      }
    } else {
      // Create new
      const nextId = slabs.length > 0 ? Math.max(...slabs.map(s => s.id || 0)) + 1 : 1;
      slabs.push({
        id: nextId,
        payroll_type: parseInt(payroll_type) || 1,
        range_from: parseFloat(range_from) || 0,
        range_to: range_to ? parseFloat(range_to) : null,
        fixed_tax: parseFloat(fixed_tax) || 0,
        percentage_over: parseFloat(percentage_over) || 0,
        effective_date: effective_date || '2025-07-01'
      });
    }

    store.set('tax_table', slabs);
    res.json({ success: true, message: 'Tax slab saved successfully.', data: slabs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save tax slab.' });
  }
});

// Delete Tax Slab
router.delete('/tax-slabs/:id', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const slabId = parseInt(req.params.id);
    let slabs = store.get('tax_table') || [...TaxEngine.DEFAULT_TAX_SLABS];
    slabs = slabs.filter(s => s.id !== slabId);
    store.set('tax_table', slabs);
    res.json({ success: true, message: 'Tax slab deleted.', data: slabs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete tax slab.' });
  }
});

// Generate monthly payroll for all active employees using SPMS Tax Engine (§7.1, §8)
router.post('/generate', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const month = parseInt(req.body.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.body.year) || new Date().getFullYear();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const employees = await prisma.employee.findMany({
      where: { status: 'active' }
    });

    const taxTable = store.get('tax_table') || TaxEngine.DEFAULT_TAX_SLABS;
    const priorPayrolls = await prisma.payroll.findMany({
      where: { year }
    });

    const results = [];
    for (const emp of employees) {
      const baseSalary = emp.salary || 50000;
      const empPrior = priorPayrolls.filter(p => p.employeeId === emp.id).map(p => ({
        payroll_month: `${p.year}-${String(p.month).padStart(2, '0')}`,
        withholding_tax: p.tax || 0
      }));

      // Calculate exact SPMS tax
      const taxCalc = TaxEngine.calculate({
        employee: emp,
        payrollMonth: monthStr,
        payrollType: 1,
        grossIncome: baseSalary,
        pfFundRate: emp.pf_fund !== undefined ? emp.pf_fund : 5,
        eobiEmployee: emp.eoib_employee !== undefined ? emp.eoib_employee : 370,
        splitter: emp.splitter || baseSalary,
        bonus: emp.bonus || 0,
        bonusTax: emp.bonus_tax || 'yes',
        priorPayrollRowsInFY: empPrior,
        taxTable,
        alreadyNetOfPF: false
      });

      const allowances = JSON.stringify([
        { name: 'Medical Allowance', amount: Math.round(baseSalary * 0.10) },
        { name: 'Conveyance Allowance', amount: Math.round(baseSalary * 0.05) }
      ]);

      const deductions = JSON.stringify([
        { name: 'Income Tax (FBR Sec 149)', amount: taxCalc.withholdingTax },
        { name: 'Provident Fund (Employee)', amount: taxCalc.pfDeduction },
        { name: 'EOBI Contribution', amount: taxCalc.eobiDeduction }
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
          grossSalary: taxCalc.grossIncome,
          netSalary: taxCalc.netPay,
          tax: taxCalc.withholdingTax
        },
        create: {
          employeeId: emp.id,
          month,
          year,
          baseSalary,
          allowances,
          deductions,
          grossSalary: taxCalc.grossIncome,
          netSalary: taxCalc.netPay,
          tax: taxCalc.withholdingTax,
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
        description: `Generated SPMS payroll for ${month}/${year} (${results.length} active employees)`,
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
