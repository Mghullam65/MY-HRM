const express = require('express');
const prisma = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get leave balances
router.get('/balances', authenticate, async (req, res) => {
  try {
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId) : req.user.employeeId;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true }
    });

    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve leave balances.' });
  }
});

// Get leave requests
router.get('/requests', authenticate, async (req, res) => {
  try {
    const { status, employeeId } = req.query;

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (employeeId) where.employeeId = parseInt(employeeId);

    // Regular employees see only their requests
    if (req.user.role === 'employee' || req.user.role === 'onboarding') {
      where.employeeId = req.user.employeeId;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: { id: true, empNo: true, fullName: true, department: true }
        }
      },
      orderBy: { appliedOn: 'desc' }
    });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve leave requests.' });
  }
});

// Apply for leave
router.post('/requests', authenticate, async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, days, reason } = req.body;
    const employeeId = req.body.employeeId ? parseInt(req.body.employeeId) : req.user.employeeId;

    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required leave fields.' });
    }

    const numDays = parseFloat(days) || 1;
    const year = new Date(startDate).getFullYear();

    // Verify balance
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: parseInt(leaveTypeId),
          year
        }
      }
    });

    if (balance && balance.available < numDays) {
      return res.status(400).json({ success: false, message: `Insufficient leave balance. Available: ${balance.available}, Requested: ${numDays}` });
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: parseInt(leaveTypeId),
        startDate,
        endDate,
        days: numDays,
        reason: reason || '',
        status: 'pending'
      }
    });

    // Update pending balance
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: balance.pending + numDays,
          available: Math.max(0, balance.available - numDays)
        }
      });
    }

    res.status(201).json({ success: true, message: 'Leave application submitted successfully.', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to submit leave application.' });
  }
});

// Approve or Reject leave request
router.put('/requests/:id/status', authenticate, authorize('superadmin', 'hr_manager', 'dept_manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!request) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: req.user.id,
        approvedOn: new Date(),
        rejectionReason: status === 'rejected' ? rejectionReason : null
      }
    });

    // Adjust leave balance
    const year = new Date(request.startDate).getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year
        }
      }
    });

    if (balance) {
      if (status === 'approved') {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: balance.used + request.days,
            pending: Math.max(0, balance.pending - request.days)
          }
        });
      } else {
        // Returned to available
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: Math.max(0, balance.pending - request.days),
            available: balance.available + request.days
          }
        });
      }
    }

    res.json({ success: true, message: `Leave application ${status}.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update leave request.' });
  }
});

module.exports = router;
