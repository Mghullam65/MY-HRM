const express = require('express');
const fs = require('fs');
const path = require('path');
const prisma = require('../db');
const { authenticate, getScopedEmployeeIds, assertEmployeeAccess } = require('../middleware/auth');

const DATA_DIR = path.join(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}
const BUFFER_FILE = path.join(DATA_DIR, 'biometric_sync_buffer.json');
const STATUS_FILE = path.join(DATA_DIR, 'biometric_sync_status.json');

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

// ─── BIOMETRIC HARDWARE SYNC ENDPOINTS ───────────────────
router.get('/biometric-sync', async (req, res) => {
  try {
    let buffer = [];
    let statusMap = {
      'zk-head-office': { name: 'Head Office Terminal', status: 'pending', lastSync: null, totalPunches: 0 },
      'zk-factory': { name: 'Factory Main Gate', status: 'pending', lastSync: null, totalPunches: 0 }
    };
    if (fs.existsSync(BUFFER_FILE)) {
      try { buffer = JSON.parse(fs.readFileSync(BUFFER_FILE, 'utf8') || '[]'); } catch (e) {}
    }
    if (fs.existsSync(STATUS_FILE)) {
      try { statusMap = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')); } catch (e) {}
    }
    res.json({
      success: true,
      devices: statusMap,
      buffer: buffer.slice(-100),
      totalBuffered: buffer.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve biometric status', error: err.message });
  }
});

router.post('/biometric-sync', async (req, res) => {
  try {
    const records = req.body || [];
    const punchList = Array.isArray(records) ? records : [records];

    let existing = [];
    if (fs.existsSync(BUFFER_FILE)) {
      try { existing = JSON.parse(fs.readFileSync(BUFFER_FILE, 'utf8') || '[]'); } catch (e) {}
    }

    let statusMap = {
      'zk-head-office': { name: 'Head Office Terminal', status: 'pending', lastSync: null, count: 0 },
      'zk-factory': { name: 'Factory Main Gate', status: 'pending', lastSync: null, count: 0 }
    };
    if (fs.existsSync(STATUS_FILE)) {
      try { statusMap = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')); } catch (e) {}
    }

    const seen = new Set(existing.map(p => `${p.user_id}_${p.timestamp}`));
    let newCount = 0;
    punchList.forEach(p => {
      const key = `${p.user_id}_${p.timestamp}`;
      if (!seen.has(key)) {
        seen.add(key);
        existing.push(p);
        newCount++;
      }
      const devId = p.device_id || 'zk-head-office';
      statusMap[devId] = {
        name: p.device_name || statusMap[devId]?.name || devId,
        status: 'online',
        lastSync: new Date().toISOString(),
        lastBatchCount: punchList.length,
        totalPunches: (statusMap[devId]?.totalPunches || 0) + 1
      };
    });

    fs.writeFileSync(BUFFER_FILE, JSON.stringify(existing, null, 2));
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusMap, null, 2));

    // Also attempt to upsert into database if Prisma models are active
    try {
      for (const p of punchList) {
        if (p.user_id && p.user_id !== 'SYSTEM_HEARTBEAT') {
          const punchDate = p.timestamp ? p.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
          const punchTime = p.timestamp ? p.timestamp.split('T')[1]?.substring(0, 5) : '09:00';
          
          // Match employee by id or empNo
          const numericId = parseInt(p.user_id, 10);
          let emp = null;
          if (!isNaN(numericId)) {
            emp = await prisma.employee.findUnique({ where: { id: numericId } }).catch(() => null);
          }
          if (!emp) {
            emp = await prisma.employee.findFirst({
              where: {
                OR: [
                  { empNo: String(p.user_id) },
                  { empNo: { contains: String(p.user_id) } }
                ]
              }
            }).catch(() => null);
          }

          if (emp) {
            const existingAtt = await prisma.attendance.findFirst({
              where: { employeeId: emp.id, date: punchDate }
            }).catch(() => null);

            if (!existingAtt) {
              const [h, m] = (punchTime || '09:00').split(':').map(Number);
              const isLate = (h > 9) || (h === 9 && m > 30);
              const lateMinutes = isLate ? Math.max(0, (h - 9) * 60 + (m - 30)) : 0;
              await prisma.attendance.create({
                data: {
                  employeeId: emp.id,
                  date: punchDate,
                  checkIn: punchTime,
                  status: isLate ? 'late' : 'present',
                  lateMinutes,
                  notes: `Synced from ${p.device_name || p.device_id || 'Hardware'}`
                }
              }).catch(() => null);
            } else if (!existingAtt.checkOut && punchTime > (existingAtt.checkIn || '00:00')) {
              await prisma.attendance.update({
                where: { id: existingAtt.id },
                data: {
                  checkOut: punchTime,
                  notes: `${existingAtt.notes || ''} | Out synced from ${p.device_name || 'Hardware'}`
                }
              }).catch(() => null);
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[BiometricSync DB Warning]', dbErr.message);
    }

    res.json({
      success: true,
      message: `Successfully ingested ${newCount} new biometric punches.`,
      processed: newCount,
      totalBuffered: existing.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid payload', error: err.message });
  }
});

module.exports = router;
