const express = require('express');
const { authenticate, authorize, getScopedEmployeeIds, assertEmployeeAccess } = require('../middleware/auth');
const store = require('../services/store');

const router = express.Router();

// 1. List Settlements (role-scoped)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let settlements = store.get('settlements') || [];

    if (employeeId) {
      const hasAccess = await assertEmployeeAccess(req, res, employeeId);
      if (!hasAccess) return;
      settlements = settlements.filter(s => s.employeeId === parseInt(employeeId));
    } else {
      const scopedIds = await getScopedEmployeeIds(req.user);
      if (scopedIds !== null) {
        settlements = settlements.filter(s => scopedIds.includes(s.employeeId));
      }
    }

    if (status) {
      settlements = settlements.filter(s => s.settlementStatus === status);
    }

    res.json({ success: true, count: settlements.length, data: settlements });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve settlements.' });
  }
});

// 2. Get Single Settlement
router.get('/:id', authenticate, async (req, res) => {
  try {
    const settlements = store.get('settlements') || [];
    const record = settlements.find(s => s.id === req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Settlement record not found.' });
    }

    const hasAccess = await assertEmployeeAccess(req, res, record.employeeId);
    if (!hasAccess) return;

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve settlement.' });
  }
});

// 3. Create New Settlement (Admin Only)
router.post('/', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.employeeId || !payload.exitDate) {
      return res.status(400).json({ success: false, message: 'employeeId and exitDate are required.' });
    }

    const newId = payload.id || ('FNF-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4));
    const settlements = store.get('settlements') || [];

    const record = {
      ...payload,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.username || 'admin'
    };

    settlements.unshift(record);
    store.set('settlements', settlements);

    res.status(201).json({ success: true, message: 'Settlement created successfully.', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create settlement: ' + err.message });
  }
});

// 4. Update Existing Settlement (Admin Only)
router.put('/:id', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const settlements = store.get('settlements') || [];
    const index = settlements.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Settlement not found.' });
    }

    const updatedRecord = {
      ...settlements[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    settlements[index] = updatedRecord;
    store.set('settlements', settlements);

    res.json({ success: true, message: 'Settlement updated successfully.', data: updatedRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settlement.' });
  }
});

// 5. Delete Settlement (Admin Only)
router.delete('/:id', authenticate, authorize('superadmin', 'hr_manager'), async (req, res) => {
  try {
    const settlements = store.get('settlements') || [];
    const filtered = settlements.filter(s => s.id !== req.params.id);
    if (filtered.length === settlements.length) {
      return res.status(404).json({ success: false, message: 'Settlement not found.' });
    }

    store.set('settlements', filtered);
    res.json({ success: true, message: `Settlement ${req.params.id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete settlement.' });
  }
});

// 6. Update Clearance Gate Status
router.post('/:id/clearance', authenticate, async (req, res) => {
  try {
    const { gateKey, status, remarks } = req.body;
    if (!['hr', 'it', 'finance', 'admin'].includes(gateKey)) {
      return res.status(400).json({ success: false, message: 'Invalid gateKey.' });
    }

    const settlements = store.get('settlements') || [];
    const s = settlements.find(x => x.id === req.params.id);
    if (!s) {
      return res.status(404).json({ success: false, message: 'Settlement not found.' });
    }

    if (!s.clearanceGates) s.clearanceGates = {};
    s.clearanceGates[gateKey] = {
      status: status || 'approved',
      approvedBy: req.user.username || 'Manager',
      approvedAt: new Date().toISOString().split('T')[0],
      remarks: remarks || 'Cleared'
    };

    const gates = s.clearanceGates;
    const allCleared = gates.hr?.status === 'approved' &&
                       gates.it?.status === 'approved' &&
                       gates.finance?.status === 'approved' &&
                       gates.admin?.status === 'approved';

    if (allCleared && s.settlementStatus === 'under_clearance') {
      s.settlementStatus = 'approved';
    }

    s.updatedAt = new Date().toISOString();
    store.set('settlements', settlements);

    res.json({ success: true, message: `Gate ${gateKey} updated.`, data: s });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update clearance gate.' });
  }
});

module.exports = router;
