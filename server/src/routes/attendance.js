const express = require('express');
const prisma = require('../db');
const { authenticate, getScopedEmployeeIds, assertEmployeeAccess } = require('../middleware/auth');

const router = express.Router();

// Get attendance logs with date range and employee filters (role scoped)
router.get('/', authenticate, async (req, res) => {
  try {
    const { employeeId, date, month, year, startDate, endDate } = req.query;

    const where = {};
    if (date) where.date = date;
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (month && year) {
      const padMonth = String(month).padStart(2, '0');
      where.date = { startsWith: `${year}-${padMonth}` };
    }

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

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, empNo: true, fullName: true, departmentId: true, shiftId: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve attendance logs.' });
  }
});

// Today's attendance summary for Dashboard widgets (role-scoped)
router.get('/today-summary', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const scopedIds = await getScopedEmployeeIds(req.user);

    // If regular employee, return self-only attendance summary
    if (req.user.role === 'employee' || req.user.role === 'onboarding') {
      const myLog = await prisma.attendance.findFirst({
        where: { employeeId: req.user.employeeId, date: today }
      });
      return res.json({
        success: true,
        data: {
          date: today,
          status: myLog?.status || 'not_marked',
          checkIn: myLog?.checkIn || null,
          checkOut: myLog?.checkOut || null,
          lateMinutes: myLog?.lateMinutes || 0,
          workingHours: myLog?.workingHours || 0
        }
      });
    }

    const whereEmps = { status: 'active' };
    const whereLogs = { date: today };
    if (scopedIds !== null) {
      whereEmps.id = { in: scopedIds };
      whereLogs.employeeId = { in: scopedIds };
    }

    const totalEmployees = await prisma.employee.count({ where: whereEmps });
    const todayLogs = await prisma.attendance.findMany({ where: whereLogs });

    const present = todayLogs.filter(a => a.status === 'present').length;
    const late = todayLogs.filter(a => a.status === 'late').length;
    const halfDay = todayLogs.filter(a => a.status === 'half_day').length;
    const onLeave = todayLogs.filter(a => a.status === 'leave').length;
    const absent = Math.max(0, totalEmployees - (present + late + halfDay + onLeave));

    res.json({
      success: true,
      data: {
        date: today,
        totalEmployees,
        present,
        late,
        halfDay,
        onLeave,
        absent,
        attendanceRate: totalEmployees > 0 ? Math.round(((present + late + halfDay) / totalEmployees) * 100) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to calculate attendance summary.' });
  }
});

// Punch In / Punch Out (protected against punching for other staff)
router.post('/punch', authenticate, async (req, res) => {
  try {
    const targetId = req.body.employeeId ? parseInt(req.body.employeeId) : req.user.employeeId;
    const hasAccess = await assertEmployeeAccess(req, res, targetId);
    if (!hasAccess) return;
    const employeeId = targetId;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let record = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      }
    });

    if (!record) {
      // Clock in
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
      const lateMinutes = isLate ? Math.max(0, (now.getHours() - 9) * 60 + (now.getMinutes() - 30)) : 0;

      record = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: currentTime,
          status: isLate ? 'late' : 'present',
          lateMinutes
        }
      });

      return res.json({ success: true, action: 'check_in', message: `Clocked in at ${currentTime}`, data: record });
    } else if (!record.checkOut) {
      // Clock out
      const [inH, inM] = record.checkIn.split(':').map(Number);
      const workHours = Math.round((((now.getHours() * 60 + now.getMinutes()) - (inH * 60 + inM)) / 60) * 10) / 10;
      const overtimeHours = Math.max(0, Math.round((workHours - 8) * 10) / 10);

      record = await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkOut: currentTime,
          workHours,
          overtimeHours
        }
      });

      return res.json({ success: true, action: 'check_out', message: `Clocked out at ${currentTime}. Worked: ${workHours} hrs`, data: record });
    } else {
      return res.status(400).json({ success: false, message: 'Already completed attendance for today.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Error processing punch.' });
  }
});

module.exports = router;
