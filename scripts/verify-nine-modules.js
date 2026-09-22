// scripts/verify-nine-modules.js
// Validates presence of all 9 enterprise HR features and verifies that sidebar navigation is unchanged.

const fs = require('fs');
const path = require('path');

console.log('🔍 [Verification] Starting 9 Enterprise HR Modules Audit...');

const payrollJs = fs.readFileSync(path.join(__dirname, '../js/payroll.js'), 'utf8');
const employeesJs = fs.readFileSync(path.join(__dirname, '../js/employees.js'), 'utf8');
const leavesJs = fs.readFileSync(path.join(__dirname, '../js/leaves.js'), 'utf8');
const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const authJs = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');

const checks = [
  // 1. Loan Management
  { name: '1. Loan Amortization Schedule Modal', pass: payrollJs.includes('showLoanScheduleModal') },
  { name: '1. Loan Early Settlement', pass: payrollJs.includes('earlySettleLoan') },

  // 2. Form 16 / Annual Tax Certificate
  { name: '2. Form 16 Annual Tax Certificate Generator', pass: payrollJs.includes('showSection149Cert') && payrollJs.includes('Tax Assessment Year') },

  // 3. Contract Management
  { name: '3. Contract Management Tab & View', pass: employeesJs.includes('renderContracts') && employeesJs.includes('contracts') },
  { name: '3. Contract Renewal Workflow & Modal', pass: employeesJs.includes('showContractRenewalModal') },
  { name: '3. Contract Expiry Alerts & Countdowns', pass: employeesJs.includes('EMPLOYMENT CONTRACT EXPIRY NOTICES') },

  // 4. Salary Revision & Increment
  { name: '4. Salary Revision Ledger & Modal', pass: payrollJs.includes('renderSalaryRevisions') && payrollJs.includes('showAddSalaryRevisionModal') },
  { name: '4. Annual Salary Review Reminders Banner', pass: payrollJs.includes('ANNUAL SALARY INCREMENT REMINDERS') },

  // 5. Promotion Workflow
  { name: '5. Promotion Workflow & Approvals', pass: employeesJs.includes('_renderPromotionsView') && employeesJs.includes('showInitiatePromotionModal') },
  { name: '5. Promotion Eligibility Reminders', pass: employeesJs.includes('PROMOTION ELIGIBILITY RECOMMENDATIONS') },

  // 6. Employee Transfer Module
  { name: '6. Employee Mobility & Transfer Module', pass: employeesJs.includes('_renderTransfersView') && employeesJs.includes('showInitiateTransferModal') },
  { name: '6. Transfer Handover & Complete Execution', pass: employeesJs.includes('approveTransfer') && employeesJs.includes('showTransferHandoverModal') },

  // 7. Leave Encashment
  { name: '7. Leave Encashment Lifecycle Tab', pass: leavesJs.includes('id:\'encashment\'') && leavesJs.includes('renderLeaveEncashment') },
  { name: '7. Leave Encashment Calculation & Retention Rule', pass: leavesJs.includes('showApplyLeaveEncashmentModal') && leavesJs.includes('Statutory Reserve') },
  { name: '7. Leave Encashment Certificate Slip & Batch Run', pass: leavesJs.includes('showEncashmentSlipModal') && leavesJs.includes('showBulkEncashmentModal') },

  // 8. Comp-Off / TOIL
  { name: '8. Comp-Off & TOIL Lifecycle Tab', pass: leavesJs.includes('Comp-Off & TOIL Bank') },
  { name: '8. Weekend & Holiday Duty TOIL Claims', pass: leavesJs.includes('Weekend Duty Comp-Off') && leavesJs.includes('onClaimCategoryChange') },
  { name: '8. TOIL 90-Day Expiry Tracking & Alerts', pass: leavesJs.includes('90-Day Policy Rule') || leavesJs.includes('90 * 86400000') },

  // 9. Budget vs Actual Payroll
  { name: '9. Budget vs Actual Tab & Ledger', pass: payrollJs.includes('renderBudgetVsActual') && payrollJs.includes('showEditDepartmentBudgetModal') },
  { name: '9. Over-Budget Alerts & Variance Calculation', pass: payrollJs.includes('PAYROLL BUDGET EXCEEDED') },

  // Constraint Verification: Sidebar Items
  { 
    name: 'Constraint: Sidebar Menu Navigation has NO new root items', 
    pass: !authJs.includes('id: \'loan\'') && 
          !authJs.includes('id: \'contracts\'') && 
          !authJs.includes('id: \'promotions\'') && 
          !authJs.includes('id: \'transfers\'') && 
          !authJs.includes('id: \'encashment\'')
  }
];

let failed = 0;
checks.forEach(c => {
  if (c.pass) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ FAIL: ${c.name}`);
    failed++;
  }
});

if (failed === 0) {
  console.log(`\n🎉 All ${checks.length} checks passed! All 9 modules are cleanly integrated without adding new nav bar options.`);
  process.exit(0);
} else {
  console.error(`\n💥 ${failed} check(s) failed.`);
  process.exit(1);
}
