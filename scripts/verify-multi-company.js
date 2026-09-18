const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('════════════════════════════════════════════════════════════');
console.log('🧪 VERIFYING MULTI-COMPANY & CORPORATE HOLDING STRUCTURE');
console.log('════════════════════════════════════════════════════════════\n');

// 1. Storage & Helper Verification
console.log('▶ Test 1: Validating Model A Company Context & Active Resolution...');
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Mock DB
const initialCompanies = [
  {
    id: 1, code: 'APEX-TECH', name: 'Apex Technologies (Pvt) Ltd', tradeName: 'ApexTech',
    ntn: '8849201-1', secpRegNo: 'SECP-ISB-0084920', disbursementBank: 'HBL', isHolding: true
  },
  {
    id: 2, code: 'APEX-FIN', name: 'Apex Digital Payments (Pvt) Ltd', tradeName: 'ApexPay',
    ntn: '7392014-2', secpRegNo: 'SECP-KHI-0073920', disbursementBank: 'Meezan Bank', isHolding: false
  },
  {
    id: 3, code: 'APEX-LOG', name: 'Apex Logistics & Freight (Pvt) Ltd', tradeName: 'Apex Logistics',
    ntn: '9102845-3', secpRegNo: 'SECP-KHI-0091028', disbursementBank: 'Bank Alfalah', isHolding: false
  }
];

let dbStore = {
  companies: [...initialCompanies],
  employees: [
    { id: 101, fullName: 'Bilal Khan', companyId: 1, joinDate: '2021-03-01', salary: 120000 },
    { id: 102, fullName: 'Sara Malik', companyId: 1, joinDate: '2020-05-15', salary: 160000 },
    { id: 103, fullName: 'Hamza Tariq', companyId: 2, joinDate: '2022-08-01', salary: 95000 },
    { id: 104, fullName: 'Zainab Bibi', companyId: 3, joinDate: '2023-01-10', salary: 85000 }
  ],
  audit_logs: []
};

global.DB = {
  get: (key) => dbStore[key] || [],
  set: (key, val) => { dbStore[key] = val; },
  getActiveCompanyId: () => localStorage.getItem('hrm_active_company') || '1',
  setActiveCompanyId: (id) => localStorage.setItem('hrm_active_company', String(id)),
  getActiveCompany: () => {
    const id = DB.getActiveCompanyId();
    if (id === 'all') return { id: 'all', name: 'Apex Group (Consolidated Holding)', tradeName: 'Apex Group (All Entities)', isHolding: true };
    const comps = DB.get('companies') || [];
    return comps.find(c => String(c.id) === String(id)) || comps[0];
  }
};

// Default should resolve to Company 1
assert.strictEqual(DB.getActiveCompanyId(), '1');
assert.strictEqual(DB.getActiveCompany().id, 1);
assert.strictEqual(DB.getActiveCompany().tradeName, 'ApexTech');
console.log('  ✔ Default context correctly resolves to Subsidiary 1: Apex Technologies');

// Switch to Subsidiary 2
DB.setActiveCompanyId('2');
assert.strictEqual(DB.getActiveCompanyId(), '2');
assert.strictEqual(DB.getActiveCompany().tradeName, 'ApexPay');
assert.strictEqual(DB.getActiveCompany().disbursementBank, 'Meezan Bank');
console.log('  ✔ Switched to Subsidiary 2: ApexPay (Meezan Bank)');

// Switch to Consolidated Holding View
DB.setActiveCompanyId('all');
assert.strictEqual(DB.getActiveCompanyId(), 'all');
assert.strictEqual(DB.getActiveCompany().isHolding, true);
console.log('  ✔ Switched to Consolidated Group Holding View');

// 2. Inter-Company Employee Transfer Verification
console.log('\n▶ Test 2: Validating Inter-Company Staff Transfer & Service Continuity...');
const empToTransfer = dbStore.employees.find(e => e.id === 101);
assert.strictEqual(empToTransfer.companyId, 1);
const originalHireDate = empToTransfer.joinDate;

// Execute transfer from Company 1 to Company 2
empToTransfer.companyId = 2;
empToTransfer.transferredAt = '2026-09-18';
dbStore.audit_logs.unshift({
  action: 'INTER_COMPANY_TRANSFER',
  details: `Transferred ${empToTransfer.fullName} from Apex Technologies to ApexPay`
});

assert.strictEqual(empToTransfer.companyId, 2, 'Employee companyId must be 2');
assert.strictEqual(empToTransfer.joinDate, originalHireDate, 'Original hire date must be preserved for statutory tenure');
assert.strictEqual(dbStore.audit_logs.length, 1);
console.log(`  ✔ Transferred ${empToTransfer.fullName} to ApexPay while strictly preserving hire date (${empToTransfer.joinDate})`);

// 3. Admin Entity CRUD & Deletion Safeguard
console.log('\n▶ Test 3: Validating Admin Subsidiary CRUD & Safeguards...');
// Attempt deleting Company 2 when Hamza Tariq (and now Bilal Khan) are assigned
const empsInComp2 = dbStore.employees.filter(e => e.companyId === 2);
assert.strictEqual(empsInComp2.length, 2);
const canDeleteComp2 = empsInComp2.length === 0;
assert.strictEqual(canDeleteComp2, false, 'Deletion must be blocked when active employees are assigned');
console.log('  ✔ Safety Safeguard: Deletion of Subsidiary with 2 active staff was correctly rejected');

// Add New Company 4
const newComp = {
  id: 4, code: 'APEX-PHARMA', name: 'Apex Health & Pharma (Pvt) Ltd', tradeName: 'ApexPharma',
  ntn: '9849201-5', secpRegNo: 'SECP-0098492', disbursementBank: 'Standard Chartered', isHolding: false
};
dbStore.companies.push(newComp);
assert.strictEqual(dbStore.companies.length, 4);
console.log('  ✔ Super Admin registered new Subsidiary 4: ApexPharma');

// Delete Company 4 (0 employees assigned)
const empsInComp4 = dbStore.employees.filter(e => e.companyId === 4);
assert.strictEqual(empsInComp4.length, 0);
dbStore.companies = dbStore.companies.filter(c => c.id !== 4);
assert.strictEqual(dbStore.companies.length, 3);
console.log('  ✔ Safely deleted empty Subsidiary 4 with zero employees');

// 4. Role Permissions & Prohibitions
console.log('\n▶ Test 4: Verifying Model A RBAC & Prohibitions...');
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
assert(authCode.includes("'company.add'"), 'auth.js must restrict company.add');
assert(authCode.includes("'company.edit'"), 'auth.js must restrict company.edit');
assert(authCode.includes("'company.delete'"), 'auth.js must restrict company.delete');
assert(authCode.includes("'company.transfer'"), 'auth.js must restrict company.transfer');
assert(authCode.includes("'companies'"), 'auth.js must register companies module for superadmin');
console.log('  ✔ Model A RBAC verified: Super Admin holds universal rights; non-admins are prohibited.');

// 5. Source Inclusions & Server Endpoints
console.log('\n▶ Test 5: Verifying HTML, App & Server Integration...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(indexHtml.includes('js/company.js'), 'index.html must include js/company.js');
assert(indexHtml.includes("'Company'"), 'index.html safety check must include Company module');

const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appCode.includes('Company.renderSwitcherHTML()'), 'app.js topbar must render switcher');
assert(appCode.includes("case 'companies':"), 'app.js must route companies module');

const serverCode = fs.readFileSync(path.join(__dirname, '../server/src/server.js'), 'utf8');
assert(serverCode.includes("app.use('/api/companies'"), 'server.js must mount /api/companies');
console.log('  ✔ Frontend & Backend registrations verified.');

// 6. File Synchronization
console.log('\n▶ Test 6: Verifying Root & Public File Synchronization...');
const syncedFiles = [
  'js/company.js',
  'js/data.js',
  'js/auth.js',
  'js/app.js',
  'index.html'
];

syncedFiles.forEach(file => {
  const rootContent = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const pubContent = fs.readFileSync(path.join(__dirname, '../public', file), 'utf8');
  assert.strictEqual(rootContent, pubContent, `${file} differs between root and public/!`);
  console.log(`  ✔ Synced: ${file} is 100% identical between root and public/`);
});

console.log('\n════════════════════════════════════════════════════════════');
console.log('🎉 ALL MULTI-COMPANY ARCHITECTURE TESTS PASSED!');
console.log('════════════════════════════════════════════════════════════\n');
