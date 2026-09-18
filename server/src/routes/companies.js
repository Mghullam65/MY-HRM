const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const store = require('../services/store');

const router = express.Router();

// 1. List All Corporate Entities
router.get('/', authenticate, async (req, res) => {
  try {
    let companies = store.get('companies') || [];
    if (!companies.length) {
      companies = [
        {
          id: 1,
          code: 'APEX-TECH',
          name: 'Apex Technologies (Pvt) Ltd',
          tradeName: 'ApexTech Software & AI',
          legalType: 'Private Limited Company',
          ntn: '8849201-1',
          secpRegNo: 'SECP-ISB-0084920',
          currency: 'PKR',
          disbursementBank: 'Habib Bank Limited (HBL)',
          bankAccount: 'PK36HABB0001234567890123',
          bankBranch: 'Blue Area Corporate Branch, Islamabad',
          primaryColor: '#6366f1',
          logoText: 'AT',
          isHolding: true,
          status: 'active'
        },
        {
          id: 2,
          code: 'APEX-FIN',
          name: 'Apex Digital Payments (Pvt) Ltd',
          tradeName: 'ApexPay Fintech & EMI',
          legalType: 'Private Limited Company (Fintech / EMI)',
          ntn: '7392014-2',
          secpRegNo: 'SECP-KHI-0073920',
          currency: 'PKR',
          disbursementBank: 'Meezan Bank Limited',
          bankAccount: 'PK44MEZN0009988776655443',
          bankBranch: 'Main Boulevard Gulberg, Lahore',
          primaryColor: '#10b981',
          logoText: 'AP',
          isHolding: false,
          status: 'active'
        },
        {
          id: 3,
          code: 'APEX-LOG',
          name: 'Apex Logistics & Freight (Pvt) Ltd',
          tradeName: 'Apex Logistics & Supply Chain',
          legalType: 'Private Limited Company',
          ntn: '9102845-3',
          secpRegNo: 'SECP-KHI-0091028',
          currency: 'PKR',
          disbursementBank: 'Bank Alfalah Corporate',
          bankAccount: 'PK12ALFH0008877665544332',
          bankBranch: 'I.I. Chundrigar Road Branch, Karachi',
          primaryColor: '#f59e0b',
          logoText: 'AL',
          isHolding: false,
          status: 'active'
        }
      ];
      store.set('companies', companies);
    }

    res.json({ success: true, count: companies.length, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve corporate entities.' });
  }
});

// 2. Get Single Corporate Entity
router.get('/:id', authenticate, async (req, res) => {
  try {
    const companies = store.get('companies') || [];
    const record = companies.find(c => String(c.id) === String(req.params.id));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Corporate entity not found.' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve company.' });
  }
});

// 3. Register New Subsidiary (Super Admin Only)
router.post('/', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { name, tradeName, ntn, secpRegNo, legalType, disbursementBank, bankAccount, primaryColor, logoText } = req.body;
    if (!name || !tradeName || !ntn || !disbursementBank) {
      return res.status(400).json({ success: false, message: 'name, tradeName, ntn, and disbursementBank are required.' });
    }

    const companies = store.get('companies') || [];
    const nextId = companies.length > 0 ? Math.max(...companies.map(c => c.id || 0)) + 1 : 1;

    const newCompany = {
      id: nextId,
      code: 'APEX-' + tradeName.toUpperCase().slice(0, 4),
      name,
      tradeName,
      legalType: legalType || 'Private Limited Company',
      ntn,
      secpRegNo: secpRegNo || '',
      currency: 'PKR',
      disbursementBank,
      bankAccount: bankAccount || '',
      logoText: (logoText || name.slice(0, 2)).toUpperCase(),
      primaryColor: primaryColor || '#6366f1',
      isHolding: false,
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0]
    };

    companies.push(newCompany);
    store.set('companies', companies);

    res.status(201).json({ success: true, message: 'Corporate entity registered successfully.', data: newCompany });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register entity: ' + err.message });
  }
});

// 4. Update Subsidiary (Super Admin Only)
router.put('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const companies = store.get('companies') || [];
    const index = companies.findIndex(c => String(c.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Corporate entity not found.' });
    }

    companies[index] = {
      ...companies[index],
      ...req.body,
      id: Number(req.params.id)
    };

    store.set('companies', companies);
    res.json({ success: true, message: 'Corporate entity updated successfully.', data: companies[index] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update corporate entity.' });
  }
});

// 5. Delete Subsidiary (Super Admin Only)
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const companies = store.get('companies') || [];
    const companyId = Number(req.params.id);

    // Safety check: Active employees
    const employees = store.get('employees') || [];
    const assignedEmps = employees.filter(e => e.companyId === companyId);
    if (assignedEmps.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete entity: ${assignedEmps.length} active employees assigned. Reassign staff first.`
      });
    }

    const filtered = companies.filter(c => c.id !== companyId);
    if (filtered.length === companies.length) {
      return res.status(404).json({ success: false, message: 'Entity not found.' });
    }

    store.set('companies', filtered);
    res.json({ success: true, message: `Corporate entity ${req.params.id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete corporate entity.' });
  }
});

// 6. Inter-Company Employee Transfer (Super Admin Only)
router.post('/transfer', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { employeeId, targetCompanyId, transferDate, transferType, remarks } = req.body;
    if (!employeeId || !targetCompanyId) {
      return res.status(400).json({ success: false, message: 'employeeId and targetCompanyId are required.' });
    }

    const employees = store.get('employees') || [];
    const empIndex = employees.findIndex(e => e.id === Number(employeeId));
    if (empIndex === -1) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const prevCompanyId = employees[empIndex].companyId;
    employees[empIndex].companyId = Number(targetCompanyId);
    employees[empIndex].transferredAt = transferDate || new Date().toISOString().split('T')[0];

    store.set('employees', employees);

    res.json({
      success: true,
      message: `Employee transferred to Company ${targetCompanyId} successfully. Continuous tenure preserved.`,
      data: employees[empIndex]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to execute inter-company transfer.' });
  }
});

module.exports = router;
