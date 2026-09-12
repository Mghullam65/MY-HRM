const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticate, authorize, getScopedEmployeeIds, assertEmployeeAccess } = require('../middleware/auth');

const router = express.Router();

// List all employees (with filters and centralized role scoping)
router.get('/', authenticate, async (req, res) => {
  try {
    const { departmentId, branchId, status, role, search } = req.query;

    const where = {};
    if (departmentId) where.departmentId = parseInt(departmentId);
    if (branchId) where.branchId = parseInt(branchId);
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { empNo: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    // Role-based data scoping: ALL (null), TEAM (permitted array), SELF ([employeeId])
    const scopedIds = await getScopedEmployeeIds(req.user);
    if (scopedIds !== null) {
      where.id = { in: scopedIds };
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        designation: true,
        branch: true,
        shift: true
      },
      orderBy: { id: 'asc' }
    });

    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve employees.' });
  }
});

// Get single employee by ID (protected against IDOR)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // IDOR Protection: verify caller has permission to view this target employee
    const hasAccess = await assertEmployeeAccess(req, res, id);
    if (!hasAccess) return;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        branch: true,
        shift: true,
        leaveBalances: { include: { leaveType: true } },
        leaveRequests: { include: { leaveType: true }, take: 10, orderBy: { appliedOn: 'desc' } },
        attendances: { take: 30, orderBy: { date: 'desc' } },
        payrolls: { take: 12, orderBy: { year: 'desc', month: 'desc' } },
        reviewsReceived: { take: 5, orderBy: { year: 'desc' } }
      }
    });

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve employee.' });
  }
});

// Create employee
router.post('/', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const data = req.body;
    
    // Auto-generate empNo if not supplied
    if (!data.empNo) {
      const count = await prisma.employee.count();
      data.empNo = `EMP-${String(count + 1).padStart(3, '0')}`;
    }

    // Full name calculation
    if (!data.fullName) {
      data.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    }

    // Stringify JSON fields if passed as objects
    ['emergencyContact', 'qualifications', 'experience'].forEach(f => {
      if (typeof data[f] === 'object' && data[f] !== null) {
        data[f] = JSON.stringify(data[f]);
      }
    });

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        empNo: data.empNo,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        cnic: data.cnic || null,
        dob: data.dob || null,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        address: data.address || null,
        departmentId: data.departmentId ? parseInt(data.departmentId) : null,
        designationId: data.designationId ? parseInt(data.designationId) : null,
        branchId: data.branchId ? parseInt(data.branchId) : null,
        shiftId: data.shiftId ? parseInt(data.shiftId) : null,
        joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
        employmentType: data.employmentType || 'Permanent',
        status: data.status || 'active',
        role: data.role || 'employee',
        salary: parseFloat(data.salary) || 0,
        photo: data.photo || null,
        bloodGroup: data.bloodGroup || null,
        bankName: data.bankName || null,
        accountNo: data.accountNo || null,
        iban: data.iban || null,
        emergencyContact: data.emergencyContact || null,
        qualifications: data.qualifications || null,
        experience: data.experience || null
      }
    });

    // Automatically create a default user account
    const username = data.username || data.email.split('@')[0];
    const defaultPassword = data.password || 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: employee.role,
        employeeId: employee.id,
        status: 'active'
      }
    });

    // Seed default leave balances for current year
    const leaveTypes = await prisma.leaveType.findMany();
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: currentYear,
          total: lt.daysAllowed,
          used: 0,
          pending: 0,
          available: lt.daysAllowed
        }
      }).catch(() => {});
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        module: 'Employees',
        description: `Created employee ${employee.fullName} (${employee.empNo})`,
        userId: req.user.id,
        ipAddress: req.ip
      }
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create employee.' });
  }
});

// Update employee
router.put('/:id', authenticate, authorize('superadmin', 'hr_manager', 'dept_manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const hasAccess = await assertEmployeeAccess(req, res, id);
    if (!hasAccess) return;
    const data = req.body;

    // Recalculate fullName if name parts changed
    if (data.firstName || data.lastName) {
      const curr = await prisma.employee.findUnique({ where: { id } });
      const fName = data.firstName || curr.firstName;
      const lName = data.lastName || curr.lastName;
      data.fullName = `${fName} ${lName}`.trim();
    }

    ['emergencyContact', 'qualifications', 'experience'].forEach(f => {
      if (typeof data[f] === 'object' && data[f] !== null) {
        data[f] = JSON.stringify(data[f]);
      }
    });

    if (data.departmentId) data.departmentId = parseInt(data.departmentId);
    if (data.designationId) data.designationId = parseInt(data.designationId);
    if (data.branchId) data.branchId = parseInt(data.branchId);
    if (data.shiftId) data.shiftId = parseInt(data.shiftId);
    if (data.salary) data.salary = parseFloat(data.salary);

    // Filter valid fields
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.department;
    delete data.designation;
    delete data.branch;
    delete data.shift;

    const updated = await prisma.employee.update({
      where: { id },
      data
    });

    // Update corresponding user role and status if changed
    const userUpdates = {};
    if (data.role) userUpdates.role = data.role;
    if (data.status) userUpdates.status = (data.status === 'active' ? 'active' : 'inactive');
    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.updateMany({
        where: { employeeId: id },
        data: userUpdates
      });
    }

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        module: 'Employees',
        description: `Updated employee record for ${updated.fullName} (${updated.empNo})`,
        userId: req.user.id,
        ipAddress: req.ip
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update employee.' });
  }
});

// Soft delete / terminate employee
router.delete('/:id', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const emp = await prisma.employee.update({
      where: { id },
      data: { status: 'terminated' }
    });

    await prisma.user.updateMany({
      where: { employeeId: id },
      data: { status: 'inactive' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        module: 'Employees',
        description: `Terminated/Deactivated employee ${emp.fullName} (${emp.empNo})`,
        userId: req.user.id,
        ipAddress: req.ip
      }
    });

    res.json({ success: true, message: 'Employee status updated to terminated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update employee status.' });
  }
});

module.exports = router;
