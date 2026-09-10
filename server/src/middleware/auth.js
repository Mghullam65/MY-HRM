const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'hrm-pro-super-secret-jwt-key-2026-production';

// Verify JWT token from Authorization header (Bearer <token>)
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: true }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid or inactive user account.' });
    }

    req.user = user;
    req.employee = user.employee;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

// Require specific roles
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    if (roles.length && !roles.includes(req.user.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
}

// Get permitted employee IDs for a user based on Role Hierarchy & Scoping
async function getScopedEmployeeIds(user) {
  if (!user) return [];
  if (user.role === 'superadmin' || user.role === 'hr_manager') {
    return null; // null represents universal ALL access
  }

  const myEmpId = user.employeeId;
  if (!myEmpId) return [];

  if (user.role === 'dept_manager') {
    // Find direct and indirect reportees
    try {
      const allEmps = await prisma.employee.findMany({
        select: { id: true, managerId: true }
      });
      const teamIds = new Set([myEmpId]);
      let added = true;
      while (added) {
        added = false;
        for (const emp of allEmps) {
          if (!teamIds.has(emp.id) && emp.managerId && teamIds.has(emp.managerId)) {
            teamIds.add(emp.id);
            added = true;
          }
        }
      }
      return Array.from(teamIds);
    } catch (e) {
      return [myEmpId];
    }
  }

  // Regular employee or onboarding: SELF only
  return [myEmpId];
}

// Centralized IDOR assertion: verifies caller can access targetEmployeeId
async function assertEmployeeAccess(req, res, targetEmployeeId) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return false;
  }

  const role = req.user.role;
  if (role === 'superadmin' || role === 'hr_manager') {
    return true; // Full access
  }

  const targetId = parseInt(targetEmployeeId);
  const callerEmpId = req.user.employeeId;

  if (role === 'employee' || role === 'onboarding') {
    if (targetId !== callerEmpId) {
      res.status(403).json({
        success: false,
        message: '403 Forbidden: Access Denied. You are only permitted to access your own employee records.'
      });
      return false;
    }
    return true;
  }

  if (role === 'dept_manager') {
    const permittedIds = await getScopedEmployeeIds(req.user);
    if (!permittedIds || !permittedIds.includes(targetId)) {
      res.status(403).json({
        success: false,
        message: '403 Forbidden: Access Denied. Target employee is outside your managed team scope.'
      });
      return false;
    }
    return true;
  }

  res.status(403).json({ success: false, message: '403 Forbidden: Access Denied.' });
  return false;
}

module.exports = { authenticate, authorize, getScopedEmployeeIds, assertEmployeeAccess, JWT_SECRET };
