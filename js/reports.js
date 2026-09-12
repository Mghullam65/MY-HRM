// ============================================================
// HRM SYSTEM — Executive BI Analytics & Custom Report Builder
// ============================================================

const Reports = {
  currentTab: 'employee_stats', // 'employee_stats' | 'office_layout' | 'employee_report' | 'performance_report' | 'token_report' | 'increment_details' | 'executive' | 'builder' | 'standard'
  activeEntity: 'employees',
  selectedColumns: [],
  filterDept: '',
  filterStatus: '',
  dateFrom: '',
  dateTo: '',
  searchQuery: '',
  page: 1,
  pageSize: 10,
  sortCol: null,
  sortDir: 'asc',

  // Screenshot Reports State
  officeCenter: 'Lahore Center I',
  empReportFilters: {
    location: ['All Locations'],
    designation: ['All Designations'],
    division: ['All Divisions'],
    department: ['All Departments'],
    manager: ['All Managers'],
    employee: ['All Employees'],
    employmentStatus: 'Current Employees',
    selectedEmployeeStatus: 'All'
  },
  empReportResults: null,

  perfReportFilters: {
    reviewStatus: 'All Status',
    quarterFrom: 'Q1',
    quarterTo: 'Q4',
    year: '2026',
    location: ['All Locations'],
    designation: ['All Designations'],
    division: ['All Divisions'],
    department: ['All Departments'],
    manager: ['All Managers'],
    employee: ['All Employees'],
    employmentStatus: 'Current Employees'
  },
  perfReportResults: null,

  tokenReportFilters: {
    date: 'all',
    location: ['All Locations'],
    designation: ['All Designations'],
    division: ['All Divisions'],
    department: ['All Departments'],
    manager: ['All Managers'],
    employee: ['Ghulam Mustafa-00063'],
    employmentStatus: 'Current Employees'
  },
  tokenReportResults: null,

  incrementReportFilters: {
    fromDate: '2026-01-01',
    toDate: '2026-12-31'
  },
  incrementReportResults: null,

  // Entity Schemas for Dynamic Report Builder
  schemas: {
    employees: {
      label: 'Employees Master Register',
      icon: 'fa-users',
      source: 'employees',
      defaultCols: ['empNo', 'fullName', 'department', 'designation', 'employmentType', 'joinDate', 'basicSalary', 'status'],
      columns: {
        empNo: { label: 'Employee ID', type: 'text' },
        fullName: { label: 'Full Name', type: 'text' },
        email: { label: 'Corporate Email', type: 'text' },
        cnic: { label: 'CNIC / National ID', type: 'text' },
        phone: { label: 'Mobile Contact', type: 'text' },
        department: { label: 'Department', type: 'lookup', getter: (r) => Utils.getDeptName(r.departmentId) },
        designation: { label: 'Designation', type: 'lookup', getter: (r) => Utils.getDesigName(r.designationId) },
        branch: { label: 'Branch / Location', type: 'lookup', getter: (r) => Utils.getBranchName(r.branchId) },
        employmentType: { label: 'Employment Type', type: 'badge' },
        joinDate: { label: 'Joining Date', type: 'date' },
        basicSalary: { label: 'Basic Salary (PKR)', type: 'currency', sum: true, avg: true, getter: (r) => (r.salary !== undefined ? r.salary : (r.basicSalary || 0)) },
        grossSalary: { label: 'Gross Package (PKR)', type: 'currency', sum: true, avg: true, getter: (r) => Math.round((r.salary !== undefined ? r.salary : (r.basicSalary || 0)) * 1.35) },
        status: { label: 'Status', type: 'badge' }
      }
    },
    attendance: {
      label: 'Attendance & Clock-in Records',
      icon: 'fa-clock',
      source: 'attendance',
      defaultCols: ['date', 'employee', 'department', 'timeIn', 'timeOut', 'hoursWorked', 'overtimeHours', 'status'],
      columns: {
        date: { label: 'Log Date', type: 'date' },
        employee: { label: 'Employee Name', type: 'lookup', getter: (r) => Utils.getEmpName(r.employeeId) },
        department: { label: 'Department', type: 'lookup', getter: (r) => { const e = DB.find('employees', r.employeeId); return e ? Utils.getDeptName(e.departmentId) : '—'; } },
        timeIn: { label: 'Time In', type: 'text' },
        timeOut: { label: 'Time Out', type: 'text' },
        hoursWorked: { label: 'Total Hours', type: 'number', sum: true, avg: true },
        overtimeHours: { label: 'Overtime Hours', type: 'number', sum: true, avg: true },
        status: { label: 'Punctuality Status', type: 'badge' }
      }
    },
    leave_requests: {
      label: 'Leave Requisitions & Absences',
      icon: 'fa-calendar-xmark',
      source: 'leave_requests',
      defaultCols: ['appliedOn', 'employee', 'leaveType', 'from', 'to', 'days', 'status', 'reason'],
      columns: {
        appliedOn: { label: 'Application Date', type: 'date' },
        employee: { label: 'Employee Name', type: 'lookup', getter: (r) => Utils.getEmpName(r.employeeId) },
        department: { label: 'Department', type: 'lookup', getter: (r) => { const e = DB.find('employees', r.employeeId); return e ? Utils.getDeptName(e.departmentId) : '—'; } },
        leaveType: { label: 'Leave Type', type: 'lookup', getter: (r) => Utils.getLeaveTypeName(r.leaveTypeId) },
        from: { label: 'From Date', type: 'date' },
        to: { label: 'To Date', type: 'date' },
        days: { label: 'Number of Days', type: 'number', sum: true },
        status: { label: 'Approval Status', type: 'badge' },
        reason: { label: 'Stated Reason', type: 'text' }
      }
    },
    payroll: {
      label: 'Payroll & FBR Tax Register',
      icon: 'fa-money-bill-wave',
      source: 'salary',
      defaultCols: ['month', 'employee', 'basicSalary', 'allowances', 'deductions', 'incomeTax', 'netSalary', 'status'],
      columns: {
        month: { label: 'Payroll Month', type: 'text' },
        employee: { label: 'Employee Name', type: 'lookup', getter: (r) => Utils.getEmpName(r.employeeId) },
        basicSalary: { label: 'Basic Pay', type: 'currency', sum: true, avg: true },
        allowances: { label: 'Total Allowances', type: 'currency', sum: true, getter: (r) => (r.houseRent || 0) + (r.medical || 0) + (r.conveyance || 0) + (r.otherAllowances || 0) },
        deductions: { label: 'Total Deductions', type: 'currency', sum: true, getter: (r) => (r.tax || 0) + (r.eobi || 0) + (r.providentFund || 0) + (r.otherDeductions || 0) },
        incomeTax: { label: 'FBR Section 149 Tax', type: 'currency', sum: true, getter: (r) => r.tax || 0 },
        eobi: { label: 'EOBI Contribution', type: 'currency', sum: true, getter: (r) => r.eobi || 0 },
        netSalary: { label: 'Disbursed Net Pay', type: 'currency', sum: true, avg: true },
        status: { label: 'Disbursement Status', type: 'badge' }
      }
    },
    assets: {
      label: 'Enterprise Fixed Assets & Hardware',
      icon: 'fa-laptop-file',
      source: 'assets',
      defaultCols: ['assetTag', 'name', 'category', 'custodian', 'purchaseCost', 'status', 'warrantyExpiry'],
      columns: {
        assetTag: { label: 'Asset Tag #', type: 'text' },
        name: { label: 'Model / Equipment Name', type: 'text' },
        category: { label: 'Asset Category', type: 'text' },
        custodian: { label: 'Assigned Custodian', type: 'lookup', getter: (r) => r.assignedTo ? Utils.getEmpName(r.assignedTo) : 'In IT Inventory' },
        purchaseCost: { label: 'Book Value (PKR)', type: 'currency', sum: true, avg: true, getter: (r) => r.cost || r.purchaseCost || 0 },
        status: { label: 'Condition / Status', type: 'badge' },
        warrantyExpiry: { label: 'Warranty Expiry', type: 'date', getter: (r) => r.warranty || r.warrantyExpiry || '—' }
      }
    },
    expense_claims: {
      label: 'Commercial Expense Claims & Travel',
      icon: 'fa-receipt',
      source: 'expense_claims',
      defaultCols: ['claimNumber', 'employee', 'title', 'category', 'claimDate', 'amount', 'status'],
      columns: {
        claimNumber: { label: 'Claim Ref #', type: 'text' },
        employee: { label: 'Claimant', type: 'lookup', getter: (r) => Utils.getEmpName(r.employeeId) },
        title: { label: 'Expense Title', type: 'text' },
        category: { label: 'Expense Category', type: 'text' },
        claimDate: { label: 'Incurred Date', type: 'date' },
        amount: { label: 'Claimed Amount (PKR)', type: 'currency', sum: true, avg: true },
        merchant: { label: 'Vendor / Merchant', type: 'text' },
        status: { label: 'Claim Status', type: 'badge' }
      }
    },
    helpdesk_tickets: {
      label: 'Helpdesk & Employee Grievances',
      icon: 'fa-headset',
      source: 'helpdesk_tickets',
      defaultCols: ['ticketNumber', 'creator', 'subject', 'category', 'priority', 'status', 'createdAt'],
      columns: {
        ticketNumber: { label: 'Ticket #', type: 'text' },
        creator: { label: 'Raised By', type: 'lookup', getter: (r) => r.isWhistleblower ? 'Confidential Whistleblower' : Utils.getEmpName(r.employeeId) },
        subject: { label: 'Ticket Subject', type: 'text' },
        category: { label: 'Department / Queue', type: 'text' },
        priority: { label: 'SLA Priority', type: 'badge' },
        status: { label: 'Resolution Status', type: 'badge' },
        createdAt: { label: 'Logged At', type: 'date' }
      }
    },
    performance_reviews: {
      label: 'Performance Appraisals & OKR Matrix',
      icon: 'fa-chart-line',
      source: 'performance_reviews',
      defaultCols: ['reviewCycle', 'employee', 'department', 'managerRating', 'selfRating', 'finalScore', 'status'],
      columns: {
        reviewCycle: { label: 'Review Cycle', type: 'text', getter: (r) => r.cycle || r.reviewPeriod || 'Annual 2026' },
        employee: { label: 'Appraisee', type: 'lookup', getter: (r) => Utils.getEmpName(r.employeeId) },
        department: { label: 'Department', type: 'lookup', getter: (r) => { const e = DB.find('employees', r.employeeId); return e ? Utils.getDeptName(e.departmentId) : '—'; } },
        managerRating: { label: 'Manager Score (1-5)', type: 'number', avg: true, getter: (r) => r.managerRating || r.reviewerScore || 0 },
        selfRating: { label: 'Self Score (1-5)', type: 'number', avg: true, getter: (r) => r.selfRating || 0 },
        finalScore: { label: 'Weighted Rating', type: 'number', avg: true, getter: (r) => r.finalScore || r.rating || 0 },
        status: { label: 'Appraisal Status', type: 'badge' }
      }
    }
  },

  render() {
    const content = document.getElementById('page-content');
    if (!content) return;

    // Regular employee / onboarding sees personal self-service statements only
    if (['employee', 'onboarding'].includes(Auth.role)) {
      this.renderPersonalReports(content);
      return;
    }

    // Reset pagination
    this.page = 1;
    if (!this.selectedColumns.length) {
      this.selectedColumns = [...this.schemas[this.activeEntity].defaultCols];
    }

    content.innerHTML = `
      <div class="animate-fade-in reports-container">
        <!-- Header & Tab Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div class="report-suite-tabs">
            ${[
              { id: 'employee_stats', label: 'Employee Stats', icon: 'fa-chart-pie' },
              { id: 'office_layout', label: 'Office Layout', icon: 'fa-building' },
              { id: 'employee_report', label: 'Employee Report Management', icon: 'fa-users-gear' },
              { id: 'performance_report', label: 'Performance Review Report', icon: 'fa-award' },
              { id: 'token_report', label: 'Token Report Management', icon: 'fa-ticket' },
              { id: 'increment_details', label: 'Employee Increment Details', icon: 'fa-arrow-trend-up' },
              { id: 'recruitment_funnel', label: 'Recruitment Funnel & Assessment', icon: 'fa-filter-circle-dollar' },
              { id: 'executive', label: 'Executive BI Analytics', icon: 'fa-chart-line' },
              { id: 'builder', label: 'Custom Report Builder', icon: 'fa-wrench' }
            ].map(tab => `
              <button class="report-suite-tab ${this.currentTab === tab.id ? 'active' : ''}" onclick="Reports.switchTab('${tab.id}')">
                <i class="fa ${tab.icon}"></i>${tab.label}
              </button>
            `).join('')}
          </div>

          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="Reports.render()">
              <i class="fa fa-rotate-right"></i> Refresh
            </button>
            ${['executive', 'builder', 'standard'].includes(this.currentTab) ? `
              <button class="btn btn-ghost btn-sm" onclick="Reports.exportCSV()">
                <i class="fa fa-file-csv"></i> Export CSV
              </button>
              <button class="btn btn-primary btn-sm" onclick="Reports.printExecutiveReport()">
                <i class="fa fa-print"></i> Print Executive PDF
              </button>
            ` : this.currentTab === 'recruitment_funnel' ? `
              <button class="btn btn-ghost btn-sm" onclick="Recruitment.exportAssessmentCSV()">
                <i class="fa fa-file-csv"></i> Export CSV
              </button>
              <button class="btn btn-primary btn-sm" style="background:#0f3562" onclick="window.print()">
                <i class="fa fa-print"></i> Print Assessment Sheet
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" style="background:#0099cc" onclick="window.print()">
                <i class="fa fa-print"></i> Print Report
              </button>
            `}
          </div>
        </div>

        <!-- Dynamic Tab Container -->
        <div id="reports-tab-content"></div>
      </div>
    `;

    this.renderActiveTab();
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  renderActiveTab() {
    const container = document.getElementById('reports-tab-content');
    if (!container) return;

    if (this.currentTab === 'employee_stats') {
      this.renderEmployeeStats(container);
    } else if (this.currentTab === 'office_layout') {
      this.renderOfficeLayout(container);
    } else if (this.currentTab === 'employee_report') {
      this.renderEmployeeReportManagement(container);
    } else if (this.currentTab === 'performance_report') {
      this.renderPerformanceReviewReport(container);
    } else if (this.currentTab === 'token_report') {
      this.renderTokenReportManagement(container);
    } else if (this.currentTab === 'increment_details') {
      this.renderEmployeeIncrementDetails(container);
    } else if (this.currentTab === 'recruitment_funnel') {
      this.renderRecruitmentFunnelReport(container);
    } else if (this.currentTab === 'executive') {
      this.renderExecutiveBI(container);
    } else if (this.currentTab === 'builder') {
      this.renderReportBuilder(container);
    } else if (this.currentTab === 'standard') {
      this.renderStandardReports(container);
    }
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 1. EXECUTIVE BI & WORKFORCE ANALYTICS DECK
  // ═════════════════════════════════════════════════════════════════════════
  renderExecutiveBI(container) {
    const emps = Auth.getScopedEmployees(DB.get('employees') || []);
    const activeEmps = emps.filter(e => e.status === 'active' && e.role !== 'onboarding');
    const totalCount = activeEmps.length || 1;
    const depts = DB.get('departments') || [];
    const salaries = DB.get('salary') || [];
    const leaves = DB.get('leave_requests') || [];
    const assets = DB.get('assets') || [];
    const expenses = DB.get('expense_claims') || [];

    // Metrics calculations
    const maleCount = activeEmps.filter(e => e.gender === 'Male').length;
    const femaleCount = activeEmps.filter(e => e.gender === 'Female').length;
    const malePct = Math.round((maleCount / totalCount) * 100);
    const femalePct = 100 - malePct;

    // Attrition & Retention
    const exEmps = emps.filter(e => e.status === 'inactive').length;
    const totalEverEmployed = emps.length || 1;
    const attritionRate = ((exEmps / totalEverEmployed) * 100).toFixed(1);
    const retentionRate = (100 - parseFloat(attritionRate)).toFixed(1);

    // Leave Financial Liability Reserve (Total remaining annual leaves * per-day gross pay)
    const balances = DB.get('leave_balances') || [];
    let totalLeaveLiability = 0;
    activeEmps.forEach(emp => {
      const b = balances.find(x => x.employeeId === emp.id);
      const remainingDays = (b?.annual || 14) + (b?.casual || 5);
      const perDayRate = (emp.basicSalary || 80000) / 30;
      totalLeaveLiability += remainingDays * perDayRate;
    });

    // Total Monthly Payroll Outflow
    const totalPayroll = activeEmps.reduce((acc, e) => acc + (e.basicSalary || 0) * 1.35, 0);

    // Asset Valuation
    const totalAssetValue = assets.reduce((acc, a) => acc + (a.cost || a.purchaseCost || 0), 0);

    // Department Headcount breakdown
    const deptDistribution = depts.map(d => {
      const count = activeEmps.filter(e => e.departmentId === d.id).length;
      const pct = Math.round((count / totalCount) * 100);
      const deptSalary = activeEmps.filter(e => e.departmentId === d.id).reduce((s, e) => s + (e.basicSalary || 0), 0);
      return { id: d.id, name: d.name, count, pct, deptSalary };
    }).sort((a, b) => b.count - a.count);

    // Tenure distribution
    const now = new Date();
    let under1 = 0, oneToThree = 0, threeToFive = 0, overFive = 0;
    activeEmps.forEach(e => {
      const join = new Date(e.joinDate || '2024-01-01');
      const years = (now - join) / (1000 * 60 * 60 * 24 * 365.25);
      if (years < 1) under1++;
      else if (years <= 3) oneToThree++;
      else if (years <= 5) threeToFive++;
      else overFive++;
    });

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Key BI KPI Cards -->
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px">
          <div class="stat-card" style="border-left:4px solid var(--primary)">
            <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:var(--primary)"><i class="fa fa-users"></i></div>
            <div class="stat-info">
              <div class="stat-value">${activeEmps.length}</div>
              <div class="stat-label">Active Headcount</div>
              <div style="font-size:11.5px;color:var(--success);margin-top:4px"><i class="fa fa-arrow-trend-up"></i> +12% YoY Organic Growth</div>
            </div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--success)">
            <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--success)"><i class="fa fa-shield-heart"></i></div>
            <div class="stat-info">
              <div class="stat-value">${retentionRate}%</div>
              <div class="stat-label">Retention Rate</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:4px">Annualized Attrition: <strong>${attritionRate}%</strong></div>
            </div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--accent)">
            <div class="stat-icon" style="background:rgba(236,72,153,0.15);color:var(--accent)"><i class="fa fa-venus-mars"></i></div>
            <div class="stat-info">
              <div class="stat-value">${femalePct}% : ${malePct}%</div>
              <div class="stat-label">Gender Diversity (F : M)</div>
              <div style="font-size:11.5px;color:var(--info);margin-top:4px">${femaleCount} Female • ${maleCount} Male</div>
            </div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--warning)">
            <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--warning)"><i class="fa fa-piggy-bank"></i></div>
            <div class="stat-info">
              <div class="stat-value">₨ ${(Math.round(totalLeaveLiability / 1000)).toLocaleString()}k</div>
              <div class="stat-label">Leave Financial Liability</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:4px">Accrued Untaken Encashment Pool</div>
            </div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--info)">
            <div class="stat-icon" style="background:rgba(20,184,166,0.15);color:var(--info)"><i class="fa fa-money-bill-transfer"></i></div>
            <div class="stat-info">
              <div class="stat-value">₨ ${(Math.round(totalPayroll / 1000000 * 10) / 10).toFixed(1)}M</div>
              <div class="stat-label">Monthly Payroll Outflow</div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:4px">Net Pay + FBR Tax + EOBI/PESSI</div>
            </div>
          </div>
        </div>

        <!-- 2-Column Analytical Deck -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px" class="bi-charts-deck">
          <!-- Department Headcount & Cost Distribution -->
          <div class="card" style="padding:20px;border-radius:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
              <div>
                <h3 style="font-size:15px;font-weight:700;color:var(--text)"><i class="fa fa-sitemap" style="color:var(--primary);margin-right:8px"></i>Departmental Headcount & Compensation</h3>
                <p style="font-size:12px;color:var(--text-3)">Distribution of staff and monthly payroll share</p>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
              ${deptDistribution.map(d => `
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
                    <span style="font-weight:600;color:var(--text)">${d.name}</span>
                    <span style="color:var(--text-2)"><strong>${d.count}</strong> staff (${d.pct}%) • ₨ ${(Math.round(d.deptSalary/1000)).toLocaleString()}k</span>
                  </div>
                  <div style="height:8px;background:var(--surface-2);border-radius:4px;overflow:hidden;position:relative">
                    <div style="height:100%;width:${Math.max(d.pct, 4)}%;background:linear-gradient(90deg, var(--primary), var(--info));border-radius:4px"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Employee Tenure Cohorts & Inclusivity -->
          <div class="card" style="padding:20px;border-radius:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
              <div>
                <h3 style="font-size:15px;font-weight:700;color:var(--text)"><i class="fa fa-hourglass-half" style="color:var(--accent);margin-right:8px"></i>Tenure Distribution & Loyalty Matrix</h3>
                <p style="font-size:12px;color:var(--text-3)">Retention depth across service cohorts</p>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;margin-bottom:20px">
              <div style="background:var(--surface-2);padding:14px;border-radius:8px;border-left:3px solid var(--info)">
                <div style="font-size:11px;color:var(--text-3)">NEW HIRES (&lt;1 YEAR)</div>
                <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:2px">${under1} <span style="font-size:12px;font-weight:500;color:var(--text-2)">(${Math.round(under1/totalCount*100)}%)</span></div>
              </div>
              <div style="background:var(--surface-2);padding:14px;border-radius:8px;border-left:3px solid var(--primary)">
                <div style="font-size:11px;color:var(--text-3)">MID-TIER (1-3 YEARS)</div>
                <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:2px">${oneToThree} <span style="font-size:12px;font-weight:500;color:var(--text-2)">(${Math.round(oneToThree/totalCount*100)}%)</span></div>
              </div>
              <div style="background:var(--surface-2);padding:14px;border-radius:8px;border-left:3px solid var(--warning)">
                <div style="font-size:11px;color:var(--text-3)">SENIOR (3-5 YEARS)</div>
                <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:2px">${threeToFive} <span style="font-size:12px;font-weight:500;color:var(--text-2)">(${Math.round(threeToFive/totalCount*100)}%)</span></div>
              </div>
              <div style="background:var(--surface-2);padding:14px;border-radius:8px;border-left:3px solid var(--success)">
                <div style="font-size:11px;color:var(--text-3)">CORE PILLARS (&gt;5 YEARS)</div>
                <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:2px">${overFive} <span style="font-size:12px;font-weight:500;color:var(--text-2)">(${Math.round(overFive/totalCount*100)}%)</span></div>
              </div>
            </div>

            <!-- Gender Inclusivity Progress -->
            <div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px">
                <span style="font-weight:600;color:var(--text)"><i class="fa fa-restroom"></i> Gender Parity Index</span>
                <span style="color:var(--text-2)"><strong>${femaleCount} Female</strong> (${femalePct}%) vs <strong>${maleCount} Male</strong> (${malePct}%)</span>
              </div>
              <div style="height:12px;background:rgba(99,102,241,0.3);border-radius:6px;overflow:hidden;display:flex">
                <div style="height:100%;width:${femalePct}%;background:#ec4899;title:'Female Ratio'"></div>
                <div style="height:100%;width:${malePct}%;background:#3b82f6;title:'Male Ratio'"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-3);margin-top:4px">
                <span><i class="fa fa-circle" style="color:#ec4899;font-size:9px"></i> Female Staff (${femalePct}%)</span>
                <span><i class="fa fa-circle" style="color:#3b82f6;font-size:9px"></i> Male Staff (${malePct}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Operational Summary Strip -->
        <div class="card" style="padding:18px 22px;border-radius:12px;background:linear-gradient(135deg, rgba(99,102,241,0.06), rgba(16,185,129,0.06));border:1px solid rgba(99,102,241,0.15)">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
            <div>
              <h4 style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px"><i class="fa fa-building-circle-check" style="color:var(--primary);margin-right:8px"></i>Enterprise Resource Valuation Summary</h4>
              <p style="font-size:12px;color:var(--text-2);margin:0">Hardware Inventory: <strong>₨ ${totalAssetValue.toLocaleString()}</strong> • Reimbursed Expenses MTD: <strong>₨ ${expenses.filter(e=>e.status==='reimbursed'||e.status==='paid').reduce((a,c)=>a+(c.amount||0),0).toLocaleString()}</strong></p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="Reports.switchTab('builder')">
              <i class="fa fa-chart-simple"></i> Launch Custom Report Builder
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 2. DYNAMIC CUSTOM REPORT BUILDER
  // ═════════════════════════════════════════════════════════════════════════
  renderReportBuilder(container) {
    const schema = this.schemas[this.activeEntity];
    const depts = DB.get('departments') || [];

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Entity Selector Ribbon -->
        <div class="card" style="padding:14px 18px;margin-bottom:16px;border-radius:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div style="font-size:13px;font-weight:700;color:var(--text)">
              <i class="fa fa-database" style="color:var(--primary);margin-right:8px"></i>Select Primary Dataset:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${Object.keys(this.schemas).map(k => `
                <button class="btn btn-xs ${this.activeEntity === k ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.changeEntity('${k}')">
                  <i class="fa ${this.schemas[k].icon}" style="margin-right:4px"></i>${this.schemas[k].label.split(' ')[0]}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Filter & Column Picker Deck -->
        <div class="card" style="padding:16px;margin-bottom:18px;border-radius:12px">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:14px">
            <div>
              <label class="form-label" style="font-size:11px">Filter by Department</label>
              <select class="form-control" id="builder-dept" onchange="Reports.filterDept=this.value;Reports.page=1;Reports.refreshBuilderTable()">
                <option value="">All Departments</option>
                ${depts.map(d => `<option value="${d.id}" ${this.filterDept == d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="form-label" style="font-size:11px">Date Range (Start)</label>
              <input type="date" class="form-control" id="builder-from" value="${this.dateFrom}" onchange="Reports.dateFrom=this.value;Reports.page=1;Reports.refreshBuilderTable()">
            </div>

            <div>
              <label class="form-label" style="font-size:11px">Date Range (End)</label>
              <input type="date" class="form-control" id="builder-to" value="${this.dateTo}" onchange="Reports.dateTo=this.value;Reports.page=1;Reports.refreshBuilderTable()">
            </div>

            <div>
              <label class="form-label" style="font-size:11px">Keyword Search</label>
              <input type="text" class="form-control" placeholder="Search rows..." value="${this.searchQuery}" oninput="Reports.searchQuery=this.value;Reports.page=1;Reports.refreshBuilderTable()">
            </div>
          </div>

          <!-- Column Chooser Bar -->
          <div style="border-top:1px solid var(--border);padding-top:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div style="font-size:12px;font-weight:600;color:var(--text)">
              <i class="fa fa-table-columns" style="color:var(--info);margin-right:6px"></i>Selected Columns (${this.selectedColumns.length}/${Object.keys(schema.columns).length}):
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-xs" onclick="Reports.selectAllCols()">Select All</button>
              <button class="btn btn-ghost btn-xs" onclick="Reports.resetDefaultCols()">Reset Default</button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
            ${Object.keys(schema.columns).map(cKey => {
              const col = schema.columns[cKey];
              const isChecked = this.selectedColumns.includes(cKey);
              return `
                <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;background:var(--surface-2);padding:4px 10px;border-radius:6px;cursor:pointer;border:1px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}">
                  <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="Reports.toggleCol('${cKey}')">
                  <span style="color:${isChecked ? 'var(--text)' : 'var(--text-3)'}">${col.label}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Aggregations Summary Strip -->
        <div id="builder-aggregations" style="margin-bottom:14px"></div>

        <!-- Table Preview -->
        <div class="card" style="padding:0;border-radius:12px;overflow:hidden">
          <div id="builder-table-wrapper" class="table-wrapper" style="min-height:220px"></div>
          <div id="builder-pagination" style="padding:12px 18px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12.5px"></div>
        </div>
      </div>
    `;

    this.refreshBuilderTable();
  },

  changeEntity(entityKey) {
    this.activeEntity = entityKey;
    this.selectedColumns = [...this.schemas[entityKey].defaultCols];
    this.filterDept = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.searchQuery = '';
    this.page = 1;
    this.renderReportBuilder(document.getElementById('reports-tab-content'));
  },

  toggleCol(colKey) {
    if (this.selectedColumns.includes(colKey)) {
      if (this.selectedColumns.length > 1) {
        this.selectedColumns = this.selectedColumns.filter(c => c !== colKey);
      } else {
        Toast.show('You must keep at least one column visible', 'warning');
      }
    } else {
      this.selectedColumns.push(colKey);
    }
    this.refreshBuilderTable();
  },

  selectAllCols() {
    this.selectedColumns = Object.keys(this.schemas[this.activeEntity].columns);
    this.refreshBuilderTable();
  },

  resetDefaultCols() {
    this.selectedColumns = [...this.schemas[this.activeEntity].defaultCols];
    this.refreshBuilderTable();
  },

  getProcessedData() {
    const schema = this.schemas[this.activeEntity];
    let data = DB.get(schema.source) || [];

    if (Auth.role === 'dept_manager') {
      const teamIds = Auth.getScopedEmployees(DB.get('employees') || []).map(e => e.id);
      if (this.activeEntity === 'employees') {
        data = data.filter(e => teamIds.includes(e.id));
      } else if (data[0] && 'employeeId' in data[0]) {
        data = data.filter(r => teamIds.includes(r.employeeId));
      }
    }

    // Filter department
    if (this.filterDept) {
      const dId = parseInt(this.filterDept);
      if (this.activeEntity === 'employees') {
        data = data.filter(e => e.departmentId === dId);
      } else if (data[0] && 'departmentId' in data[0]) {
        data = data.filter(r => r.departmentId === dId);
      } else if (data[0] && 'employeeId' in data[0]) {
        data = data.filter(r => {
          const emp = DB.find('employees', r.employeeId);
          return emp && emp.departmentId === dId;
        });
      }
    }

    // Filter Date Range
    if (this.dateFrom || this.dateTo) {
      data = data.filter(r => {
        const dStr = r.date || r.appliedOn || r.joinDate || r.claimDate || r.createdAt || (r.month ? r.month + '-01' : null);
        if (!dStr) return true;
        if (this.dateFrom && dStr < this.dateFrom) return false;
        if (this.dateTo && dStr > this.dateTo) return false;
        return true;
      });
    }

    // Filter search text
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter(r => {
        return this.selectedColumns.some(cKey => {
          const colDef = schema.columns[cKey];
          let val = colDef.getter ? colDef.getter(r) : r[cKey];
          return String(val || '').toLowerCase().includes(q);
        });
      });
    }

    // Sorting
    if (this.sortCol && schema.columns[this.sortCol]) {
      const colDef = schema.columns[this.sortCol];
      data.sort((a, b) => {
        let va = colDef.getter ? colDef.getter(a) : a[this.sortCol];
        let vb = colDef.getter ? colDef.getter(b) : b[this.sortCol];
        if (colDef.type === 'currency' || colDef.type === 'number' || typeof va === 'number' || typeof vb === 'number') {
          const numA = Number(va) || 0;
          const numB = Number(vb) || 0;
          return this.sortDir === 'asc' ? numA - numB : numB - numA;
        }
        return this.sortDir === 'asc' ? String(va || '').localeCompare(String(vb || '')) : String(vb || '').localeCompare(String(va || ''));
      });
    }

    return data;
  },

  refreshBuilderTable() {
    const schema = this.schemas[this.activeEntity];
    const data = this.getProcessedData();
    const aggContainer = document.getElementById('builder-aggregations');
    const tableContainer = document.getElementById('builder-table-wrapper');
    const pagContainer = document.getElementById('builder-pagination');
    if (!tableContainer) return;

    // 1. Calculate Aggregations
    const aggItems = [];
    aggItems.push(`<strong>${data.length}</strong> total records matched`);

    this.selectedColumns.forEach(cKey => {
      const col = schema.columns[cKey];
      if (col.sum) {
        const total = data.reduce((acc, row) => {
          const v = col.getter ? col.getter(row) : row[cKey];
          return acc + (Number(v) || 0);
        }, 0);
        aggItems.push(`Total ${col.label}: <strong>${col.type === 'currency' ? '₨ ' + total.toLocaleString() : total.toLocaleString()}</strong>`);
      }
      if (col.avg && data.length > 0) {
        const total = data.reduce((acc, row) => {
          const v = col.getter ? col.getter(row) : row[cKey];
          return acc + (Number(v) || 0);
        }, 0);
        const avg = Math.round(total / data.length);
        aggItems.push(`Average ${col.label}: <strong>${col.type === 'currency' ? '₨ ' + avg.toLocaleString() : avg}</strong>`);
      }
    });

    if (aggContainer) {
      aggContainer.innerHTML = `
        <div style="background:var(--surface);padding:10px 16px;border-radius:8px;border:1px solid var(--border);display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-2)">
          <i class="fa fa-calculator" style="color:var(--primary)"></i>
          ${aggItems.join(' • ')}
        </div>
      `;
    }

    // 2. Pagination Slice
    const totalPages = Math.ceil(data.length / this.pageSize) || 1;
    if (this.page > totalPages) this.page = totalPages;
    const startIdx = (this.page - 1) * this.pageSize;
    const pageData = data.slice(startIdx, startIdx + this.pageSize);

    // 3. Render Table
    tableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th style="width:40px;text-align:center">#</th>
            ${this.selectedColumns.map(cKey => {
              const col = schema.columns[cKey];
              const isSorted = this.sortCol === cKey;
              return `
                <th style="cursor:pointer" onclick="Reports.toggleSort('${cKey}')">
                  ${col.label}
                  ${isSorted ? `<i class="fa fa-sort-${this.sortDir === 'asc' ? 'up' : 'down'}" style="margin-left:4px;color:var(--primary)"></i>` : '<i class="fa fa-sort" style="margin-left:4px;color:var(--text-3);opacity:0.4"></i>'}
                </th>
              `;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${pageData.length === 0 ? `
            <tr><td colspan="${this.selectedColumns.length + 1}" style="text-align:center;padding:36px;color:var(--text-3)"><i class="fa fa-folder-open" style="font-size:24px;display:block;margin-bottom:8px"></i>No records found matching current criteria.</td></tr>
          ` : pageData.map((row, idx) => `
            <tr>
              <td style="text-align:center;color:var(--text-3);font-size:11px">${startIdx + idx + 1}</td>
              ${this.selectedColumns.map(cKey => {
                const col = schema.columns[cKey];
                let val = col.getter ? col.getter(row) : row[cKey];

                if (col.type === 'currency') {
                  return `<td><span style="font-family:monospace;font-weight:600">₨ ${(Number(val) || 0).toLocaleString()}</span></td>`;
                } else if (col.type === 'date') {
                  return `<td>${val ? Utils.formatDate(val) : '—'}</td>`;
                } else if (col.type === 'badge') {
                  return `<td>${Utils.statusBadge(val || 'active')}</td>`;
                } else {
                  return `<td>${val !== undefined && val !== null && val !== '' ? val : '—'}</td>`;
                }
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // 4. Pagination Controls
    if (pagContainer) {
      pagContainer.innerHTML = `
        <div style="color:var(--text-3)">
          Showing <strong>${data.length > 0 ? startIdx + 1 : 0}</strong> to <strong>${Math.min(startIdx + this.pageSize, data.length)}</strong> of <strong>${data.length}</strong> entries
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-secondary btn-xs" ${this.page <= 1 ? 'disabled' : ''} onclick="Reports.page--;Reports.refreshBuilderTable()">
            <i class="fa fa-chevron-left"></i> Previous
          </button>
          <span style="font-weight:600;padding:0 4px">Page ${this.page} of ${totalPages}</span>
          <button class="btn btn-secondary btn-xs" ${this.page >= totalPages ? 'disabled' : ''} onclick="Reports.page++;Reports.refreshBuilderTable()">
            Next <i class="fa fa-chevron-right"></i>
          </button>
        </div>
      `;
    }
  },

  toggleSort(colKey) {
    if (this.sortCol === colKey) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = colKey;
      this.sortDir = 'asc';
    }
    this.refreshBuilderTable();
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 3. STANDARD ENTERPRISE REPORTS (PRE-CONFIGURED)
  // ═════════════════════════════════════════════════════════════════════════
  renderStandardReports(container) {
    const reportsList = [
      {
        id: 'headcount_master',
        title: 'Headcount & Demographics Master Register',
        desc: 'Comprehensive employee census with department, CNIC, employment grade, and contact details.',
        entity: 'employees',
        cols: ['empNo', 'fullName', 'cnic', 'department', 'designation', 'employmentType', 'joinDate', 'basicSalary', 'status'],
        icon: 'fa-address-book',
        color: '#6366f1'
      },
      {
        id: 'attendance_audit',
        title: 'Monthly Attendance & Absenteeism Audit Ledger',
        desc: 'Daily clock-in/out records, total operational hours, approved overtime, and tardiness counts.',
        entity: 'attendance',
        cols: ['date', 'employee', 'department', 'timeIn', 'timeOut', 'hoursWorked', 'overtimeHours', 'status'],
        icon: 'fa-user-clock',
        color: '#10b981'
      },
      {
        id: 'fbr_section_149',
        title: 'Pakistani FBR Section 149 Annual Tax Withholding Ledger',
        desc: 'Statutory income tax deducted at source under Section 149 of Income Tax Ordinance 2001.',
        entity: 'payroll',
        cols: ['month', 'employee', 'basicSalary', 'allowances', 'incomeTax', 'eobi', 'netSalary', 'status'],
        icon: 'fa-scale-balanced',
        color: '#f59e0b'
      },
      {
        id: 'leave_liability',
        title: 'Annual Statutory Leave Balance & Liability Statement',
        desc: 'Requisition log, absence justifications, supervisor approvals, and remaining encashment exposure.',
        entity: 'leave_requests',
        cols: ['appliedOn', 'employee', 'department', 'leaveType', 'from', 'to', 'days', 'status', 'reason'],
        icon: 'fa-business-time',
        color: '#ec4899'
      },
      {
        id: 'asset_custody',
        title: 'Enterprise Fixed Asset Custody & Valuation Audit',
        desc: 'Company hardware valuation, serial tag custody tracking, and warranty renewal calendar.',
        entity: 'assets',
        cols: ['assetTag', 'name', 'category', 'custodian', 'purchaseCost', 'status', 'warrantyExpiry'],
        icon: 'fa-boxes-stacked',
        color: '#3b82f6'
      },
      {
        id: 'expense_audit',
        title: 'Departmental Expense Requisition & Travel Reimbursements',
        desc: 'Commercial mileage, per diem meals, vendor invoices, and finance disbursement status.',
        entity: 'expense_claims',
        cols: ['claimNumber', 'employee', 'title', 'category', 'claimDate', 'amount', 'merchant', 'status'],
        icon: 'fa-file-invoice-dollar',
        color: '#14b8a6'
      }
    ];

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="margin-bottom:20px">
          <h3 style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px">Standard Enterprise Audit Reports</h3>
          <p style="font-size:12.5px;color:var(--text-3);margin:0">Pre-formatted corporate compliance statements ready for instant export and printing.</p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
          ${reportsList.map(rep => `
            <div class="card" style="padding:18px;border-radius:12px;display:flex;flex-direction:column;justify-content:space-between;transition:transform .2s, box-shadow .2s">
              <div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                  <div style="width:42px;height:42px;border-radius:10px;background:${rep.color}18;color:${rep.color};display:flex;align-items:center;justify-content:center;font-size:18px">
                    <i class="fa ${rep.icon}"></i>
                  </div>
                  <div style="flex:1">
                    <h4 style="font-size:14px;font-weight:700;color:var(--text);margin:0 0 2px 0">${rep.title}</h4>
                    <span style="font-size:11px;color:${rep.color};font-weight:600;text-transform:uppercase">${rep.entity.replace('_', ' ')}</span>
                  </div>
                </div>
                <p style="font-size:12px;color:var(--text-2);line-height:1.45;margin-bottom:16px">${rep.desc}</p>
              </div>

              <div style="display:flex;gap:8px;border-top:1px solid var(--border);padding-top:14px">
                <button class="btn btn-primary btn-sm" style="flex:1" onclick="Reports.launchStandardReport('${rep.id}')">
                  <i class="fa fa-play"></i> Open in Builder
                </button>
                <button class="btn btn-ghost btn-sm" title="Quick CSV Export" onclick="Reports.quickExportStandard('${rep.id}')">
                  <i class="fa fa-download"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  launchStandardReport(reportId) {
    const reportConfigs = {
      headcount_master: { entity: 'employees', cols: ['empNo', 'fullName', 'cnic', 'department', 'designation', 'employmentType', 'joinDate', 'basicSalary', 'status'] },
      attendance_audit: { entity: 'attendance', cols: ['date', 'employee', 'department', 'timeIn', 'timeOut', 'hoursWorked', 'overtimeHours', 'status'] },
      fbr_section_149: { entity: 'payroll', cols: ['month', 'employee', 'basicSalary', 'allowances', 'incomeTax', 'eobi', 'netSalary', 'status'] },
      leave_liability: { entity: 'leave_requests', cols: ['appliedOn', 'employee', 'department', 'leaveType', 'from', 'to', 'days', 'status', 'reason'] },
      asset_custody: { entity: 'assets', cols: ['assetTag', 'name', 'category', 'custodian', 'purchaseCost', 'status', 'warrantyExpiry'] },
      expense_audit: { entity: 'expense_claims', cols: ['claimNumber', 'employee', 'title', 'category', 'claimDate', 'amount', 'merchant', 'status'] }
    };

    const cfg = reportConfigs[reportId];
    if (!cfg) return;

    this.activeEntity = cfg.entity;
    this.selectedColumns = [...cfg.cols];
    this.currentTab = 'builder';
    this.render();
    Toast.show(`Loaded ${this.schemas[cfg.entity].label}`, 'info');
  },

  quickExportStandard(reportId) {
    this.launchStandardReport(reportId);
    setTimeout(() => this.exportCSV(), 200);
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 4. EXPORT ENGINE: CSV & PRINT-READY EXECUTIVE PDF
  // ═════════════════════════════════════════════════════════════════════════
  exportCSV() {
    const schema = this.schemas[this.activeEntity];
    const data = this.getProcessedData();

    if (!data.length) {
      Toast.show('No data available to export', 'warning');
      return;
    }

    const headers = this.selectedColumns.map(cKey => `"${schema.columns[cKey].label.replace(/"/g, '""')}"`);
    const rows = data.map(row => {
      return this.selectedColumns.map(cKey => {
        const col = schema.columns[cKey];
        let val = col.getter ? col.getter(row) : row[cKey];
        if (val === undefined || val === null) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    // Prepend UTF-8 Byte Order Mark (BOM) so Excel respects UTF-8 encoding
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const filename = `${this.activeEntity}_report_${Utils.today()}.csv`;
    Utils.downloadCSV(csvContent, filename);
    Toast.show(`Downloaded ${filename}`, 'success');
  },

  printExecutiveReport() {
    const schema = this.schemas[this.activeEntity];
    const data = this.getProcessedData();
    const company = DB.getObj('settings') || { companyName: 'MY-HRM Global Pvt Ltd', currency: 'PKR' };

    const win = window.open('', '_blank');
    if (!win) {
      Toast.show('Pop-up blocked. Please allow pop-ups to print reports.', 'error');
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${schema.label} — ${company.companyName}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; padding: 20px; font-size: 11px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 15px; }
          .logo-text { font-size: 20px; font-weight: 800; color: #1e3a8a; }
          .report-meta { text-align: right; font-size: 10px; color: #6b7280; }
          .title { font-size: 16px; font-weight: 700; color: #111827; margin: 10px 0 4px 0; }
          .sub { font-size: 11px; color: #4b5563; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { background: #f3f4f6; color: #1f2937; text-align: left; padding: 7px 8px; border: 1px solid #d1d5db; font-weight: 700; }
          td { padding: 6px 8px; border: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #fafafa; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
          .sign-box { width: 28%; text-align: center; border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 10px; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-text">${company.companyName}</div>
            <div style="font-size:11px;color:#4b5563">Enterprise Human Resource Management & Corporate Compliance</div>
          </div>
          <div class="report-meta">
            <div><strong>Generated On:</strong> ${new Date().toLocaleString('en-PK')}</div>
            <div><strong>Generated By:</strong> ${Auth.employee?.fullName || 'Administrator'} (${Auth.role})</div>
            <div><strong>Total Records:</strong> ${data.length}</div>
          </div>
        </div>

        <div class="title">${schema.label}</div>
        <div class="sub">Filter Criteria: ${this.filterDept ? 'Department ID ' + this.filterDept : 'All Departments'} • Date: ${this.dateFrom || 'Any'} to ${this.dateTo || 'Any'}</div>

        <table>
          <thead>
            <tr>
              <th style="width:30px">#</th>
              ${this.selectedColumns.map(cKey => `<th>${schema.columns[cKey].label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((row, idx) => `
              <tr>
                <td>${idx + 1}</td>
                ${this.selectedColumns.map(cKey => {
                  const col = schema.columns[cKey];
                  let val = col.getter ? col.getter(row) : row[cKey];
                  if (col.type === 'currency') return `<td>₨ ${(Number(val) || 0).toLocaleString()}</td>`;
                  if (col.type === 'date') return `<td>${val ? Utils.formatDate(val) : '—'}</td>`;
                  return `<td>${val !== undefined && val !== null ? val : '—'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">Prepared By<br><strong style="color:#111">${Auth.employee?.fullName || 'HR Executive'}</strong></div>
          <div class="sign-box">Audited By<br><strong>Head of Compliance / Internal Audit</strong></div>
          <div class="sign-box">Approved By<br><strong>Director of Human Resources</strong></div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  },

  renderPersonalReports(content) {
    const myId = Auth.employee?.id;
    const allAtt = DB.get('attendance') || [];
    const allLeaves = DB.get('leave_requests') || [];
    const allSalary = DB.get('salary') || [];
    const allReviews = DB.get('performance_reviews') || [];

    const myAtt = allAtt.filter(a => a.employeeId === myId);
    const myLeaves = allLeaves.filter(l => l.employeeId === myId);
    const mySalary = allSalary.filter(s => s.employeeId === myId);
    const myReviews = allReviews.filter(r => r.employeeId === myId);

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <h2 style="font-size:22px;font-weight:800;color:var(--text)">Personal HR Statements & Reports</h2>
              <span class="badge badge-primary" style="font-size:11px">Self-Service</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              Access your personal attendance, leave records, salary slips, and appraisal assessments.
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Reports.render()">
            <i class="fa fa-rotate"></i> Refresh
          </button>
        </div>

        <!-- 4 Statement Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-bottom:24px">
          <!-- 1. Attendance Statement -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-clock" style="color:var(--primary);margin-right:8px"></i>Attendance Statement
                </div>
                <span class="badge badge-primary" style="font-size:10px">${myAtt.length} Logs</span>
              </div>
              <p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">
                Comprehensive clock-in/out timestamps, overtime records, and punctuality summary.
              </p>
              <div style="background:var(--surface);padding:10px 12px;border-radius:8px;font-size:12px;display:flex;justify-content:space-between;margin-bottom:14px">
                <span>Present Days: <strong>${myAtt.filter(a=>a.status==='present').length}</strong></span>
                <span>Late Days: <strong style="color:var(--warning)">${myAtt.filter(a=>a.status==='late').length}</strong></span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm w-full" onclick="App.navigate('attendance')">
              <i class="fa fa-calendar-days"></i> View Attendance Logs
            </button>
          </div>

          <!-- 2. Leave History Statement -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-calendar-check" style="color:var(--warning);margin-right:8px"></i>Leave Ledger Statement
                </div>
                <span class="badge badge-warning" style="font-size:10px">${myLeaves.length} Requests</span>
              </div>
              <p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">
                Official record of leave balances, applied requisitions, and manager approvals.
              </p>
              <div style="background:var(--surface);padding:10px 12px;border-radius:8px;font-size:12px;display:flex;justify-content:space-between;margin-bottom:14px">
                <span>Approved: <strong style="color:var(--success)">${myLeaves.filter(l=>l.status==='approved').length}</strong></span>
                <span>Pending: <strong style="color:var(--warning)">${myLeaves.filter(l=>l.status==='pending'||l.status==='manager_approved').length}</strong></span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm w-full" onclick="App.navigate('leaves')">
              <i class="fa fa-calendar-check"></i> View Leave Ledger
            </button>
          </div>

          <!-- 3. Payroll Slip Statement -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-receipt" style="color:var(--success);margin-right:8px"></i>Salary & Tax Slips
                </div>
                <span class="badge badge-success" style="font-size:10px">${mySalary.length} Slips</span>
              </div>
              <p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">
                Verified salary disbursement slips, allowances, provident fund, and FBR tax deductions.
              </p>
              <div style="background:var(--surface);padding:10px 12px;border-radius:8px;font-size:12px;display:flex;justify-content:space-between;margin-bottom:14px">
                <span>Latest Pay: <strong style="color:var(--success)">${mySalary[0] ? Utils.formatCurrency(mySalary[0].netSalary) : '—'}</strong></span>
                <span>Status: <strong>${mySalary[0]?.status || 'Processed'}</strong></span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm w-full" onclick="App.navigate('payroll')">
              <i class="fa fa-file-invoice-dollar"></i> View Payslips
            </button>
          </div>

          <!-- 4. Performance Assessment Statement -->
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div class="card-header" style="margin-bottom:12px">
                <div class="card-title" style="font-size:14px">
                  <i class="fa fa-chart-line" style="color:var(--accent);margin-right:8px"></i>Appraisal & Review Statement
                </div>
                <span class="badge badge-info" style="font-size:10px">${myReviews.length} Reviews</span>
              </div>
              <p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">
                Quarterly appraisal ratings, OKR achievements, manager feedback, and skill ratings.
              </p>
              <div style="background:var(--surface);padding:10px 12px;border-radius:8px;font-size:12px;display:flex;justify-content:space-between;margin-bottom:14px">
                <span>Rating: <strong style="color:var(--accent)">★ 4.2 / 5</strong></span>
                <span>Status: <strong>Completed</strong></span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm w-full" onclick="App.navigate('performance')">
              <i class="fa fa-chart-line"></i> View Appraisal
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 4. ENTERPRISE REPORT 1: EMPLOYEE STATS (15 PIE CHARTS)
  // ═════════════════════════════════════════════════════════════════════════
  generatePieSvg(segments, size = 62) {
    const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.44;

    const validSegs = segments.filter(s => s.value > 0);
    if (validSegs.length <= 1) {
      const s = validSegs[0] || segments[0] || { color: '#0099cc', label: 'All', value: 1 };
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;margin:auto">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${s.color || '#0099cc'}" />
      </svg>`;
    }

    let cumulativeAngle = -Math.PI / 2;
    const paths = [];

    validSegs.forEach(seg => {
      const sliceAngle = (seg.value / total) * (2 * Math.PI);
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle = endAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

      paths.push(`<path d="${d}" fill="${seg.color}" stroke="#ffffff" stroke-width="1.2"><title>${seg.label}: ${seg.value} (${Math.round((seg.value/total)*100)}%)</title></path>`);
    });

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;margin:auto">
      ${paths.join('')}
    </svg>`;
  },

  renderEmployeeStats(container) {
    const emps = DB.get('employees') || [];

    const dimensions = [
      {
        key: 'division',
        label: 'Division Based',
        getter: e => {
          if (e.divisionId === 1) return 'Corporate Strategy & HR';
          if (e.divisionId === 2) return 'Technology & Digital';
          if (e.divisionId === 3) return 'Finance & Fiscal Governance';
          if (e.divisionId === 4) return 'Commercial & Business Dev';
          return 'General Administration';
        }
      },
      {
        key: 'department',
        label: 'Department Based',
        getter: e => Utils.getDeptName(e.departmentId) || 'Staff'
      },
      {
        key: 'designation',
        label: 'Designation Based',
        getter: e => Utils.getDesigName(e.designationId) || 'Staff'
      },
      {
        key: 'jobStatus',
        label: 'Job Status Based',
        getter: e => e.jobStatus || (e.status === 'inactive' ? 'Ex-Employee' : 'Permanent')
      },
      {
        key: 'gender',
        label: 'Gender Based',
        getter: e => e.gender || 'Male'
      },
      {
        key: 'religion',
        label: 'Religion Based',
        getter: e => e.religion || 'Islam'
      },
      {
        key: 'smoking',
        label: 'Smoking Based',
        getter: e => e.smoking || 'Non-Smoker'
      },
      {
        key: 'maritalStatus',
        label: 'Marital Status Based',
        getter: e => e.maritalStatus || 'Married'
      },
      {
        key: 'nationality',
        label: 'Nationality Based',
        getter: e => e.nationality || 'Pakistani'
      },
      {
        key: 'state',
        label: 'State Based',
        getter: e => e.state || 'Punjab'
      },
      {
        key: 'city',
        label: 'City Based',
        getter: e => e.city || 'Lahore'
      },
      {
        key: 'workspace',
        label: 'Workspace Based',
        getter: e => e.workspace || 'On-site Office'
      },
      {
        key: 'reportTo',
        label: 'Report To Based',
        getter: e => e.managerId ? Utils.getEmpName(e.managerId) : 'Executive Board'
      },
      {
        key: 'employeeCount',
        label: 'Employees Count',
        getter: e => e.status === 'active' ? 'Active Staff' : 'On Leave / Inactive'
      },
      {
        key: 'technology',
        label: 'Technology Based',
        getter: e => e.technology || 'Enterprise Stack'
      }
    ];

    const palette = ['#0099cc', '#0284c7', '#38bdf8', '#0369a1', '#7dd3fc', '#0ea5e9', '#0891b2', '#06b6d4'];

    const tilesHtml = dimensions.map(dim => {
      const counts = {};
      emps.forEach(e => {
        const val = dim.getter(e);
        counts[val] = (counts[val] || 0) + 1;
      });
      const segments = Object.keys(counts).map((k, idx) => ({
        label: k,
        value: counts[k],
        color: palette[idx % palette.length]
      }));

      const svg = this.generatePieSvg(segments, 62);

      return `
        <div class="stat-pie-tile" onclick="Reports.showStatDrilldown('${dim.key}', '${dim.label.replace(/'/g, "\\'")}')" title="Click to view distribution details for ${dim.label}">
          <div class="stat-pie-icon-wrap">
            ${svg}
          </div>
          <div class="stat-pie-label">${dim.label}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="enterprise-report-card">
        <div class="report-blue-banner">
          <span>Employee Stats</span>
          <span style="font-size:12px;font-weight:500;opacity:0.95">Total Headcount: <strong>${emps.length} Employees</strong></span>
        </div>
        <div class="stats-pie-grid-15">
          ${tilesHtml}
        </div>
      </div>
    `;
  },

  showStatDrilldown(key, title) {
    const emps = DB.get('employees') || [];
    const total = emps.length || 1;
    const getterMap = {
      division: e => (e.divisionId === 1 ? 'Corporate Strategy & HR' : (e.divisionId === 2 ? 'Technology & Digital' : (e.divisionId === 3 ? 'Finance & Fiscal Governance' : (e.divisionId === 4 ? 'Commercial & Business Dev' : 'General Administration')))),
      department: e => Utils.getDeptName(e.departmentId) || 'Staff',
      designation: e => Utils.getDesigName(e.designationId) || 'Staff',
      jobStatus: e => e.jobStatus || (e.status === 'inactive' ? 'Ex-Employee' : 'Permanent'),
      gender: e => e.gender || 'Male',
      religion: e => e.religion || 'Islam',
      smoking: e => e.smoking || 'Non-Smoker',
      maritalStatus: e => e.maritalStatus || 'Married',
      nationality: e => e.nationality || 'Pakistani',
      state: e => e.state || 'Punjab',
      city: e => e.city || 'Lahore',
      workspace: e => e.workspace || 'On-site Office',
      reportTo: e => e.managerId ? Utils.getEmpName(e.managerId) : 'Executive Board',
      employeeCount: e => e.status === 'active' ? 'Active Staff' : 'On Leave / Inactive',
      technology: e => e.technology || 'Enterprise Stack'
    };

    const getter = getterMap[key] || (e => e[key] || 'Other');
    const groups = {};
    emps.forEach(e => {
      const val = getter(e);
      if (!groups[val]) groups[val] = [];
      groups[val].push(e);
    });

    const rowsHtml = Object.keys(groups).sort((a,b) => groups[b].length - groups[a].length).map(g => {
      const list = groups[g];
      const count = list.length;
      const pct = Math.round((count / total) * 100);
      const avatars = list.slice(0, 5).map(e => `
        <span class="avatar avatar-xs" title="${e.fullName} (${e.empNo})" style="background:${Utils.avatarColor(e.id)};font-size:10px;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:white;margin-right:-6px;border:1.5px solid white">
          ${Utils.avatarInitials(e.fullName)}
        </span>
      `).join('') + (list.length > 5 ? `<span style="font-size:11px;color:#64748b;margin-left:8px">+${list.length - 5}</span>` : '');

      return `
        <tr>
          <td style="font-weight:700;color:var(--text)">${g}</td>
          <td style="text-align:center"><span class="badge badge-primary" style="font-size:12px;background:#0099cc">${count}</span></td>
          <td style="text-align:center;font-weight:600;color:#0284c7">${pct}%</td>
          <td>${avatars}</td>
          <td>
            <button class="btn btn-ghost btn-xs" onclick="Reports.exportDemographicSlice('${key}', '${g.replace(/'/g, "\\'")}')" title="Export CSV for this group">
              <i class="fa fa-download"></i> CSV
            </button>
          </td>
        </tr>
      `;
    }).join('');

    Modal.open({
      title: `<i class="fa fa-chart-pie" style="color:#0099cc;margin-right:8px"></i> ${title} — Distribution Details`,
      body: `
        <div style="padding:8px 0">
          <div style="margin-bottom:14px;color:var(--text-2);font-size:13px">
            Demographic census breakdown across <strong>${Object.keys(groups).length}</strong> segments (Total: <strong>${emps.length} employees</strong>).
          </div>
          <div style="max-height:400px;overflow-y:auto">
            <table class="table" style="width:100%">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th style="text-align:center">Headcount</th>
                  <th style="text-align:center">Share (%)</th>
                  <th>Employees</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Close</button>
        <button class="btn btn-primary btn-sm" style="background:#0099cc" onclick="Reports.exportAllDemographicsCSV('${key}', '${title.replace(/'/g, "\\'")}')">
          <i class="fa fa-file-excel"></i> Export All Breakdown (CSV)
        </button>
      `
    });
  },

  exportDemographicSlice(key, sliceValue) {
    const emps = DB.get('employees') || [];
    const getterMap = {
      division: e => (e.divisionId === 1 ? 'Corporate Strategy & HR' : (e.divisionId === 2 ? 'Technology & Digital' : (e.divisionId === 3 ? 'Finance & Fiscal Governance' : (e.divisionId === 4 ? 'Commercial & Business Dev' : 'General Administration')))),
      department: e => Utils.getDeptName(e.departmentId) || 'Staff',
      designation: e => Utils.getDesigName(e.designationId) || 'Staff',
      jobStatus: e => e.jobStatus || (e.status === 'inactive' ? 'Ex-Employee' : 'Permanent'),
      gender: e => e.gender || 'Male',
      religion: e => e.religion || 'Islam',
      smoking: e => e.smoking || 'Non-Smoker',
      maritalStatus: e => e.maritalStatus || 'Married',
      nationality: e => e.nationality || 'Pakistani',
      state: e => e.state || 'Punjab',
      city: e => e.city || 'Lahore',
      workspace: e => e.workspace || 'On-site Office',
      reportTo: e => e.managerId ? Utils.getEmpName(e.managerId) : 'Executive Board',
      employeeCount: e => e.status === 'active' ? 'Active Staff' : 'On Leave / Inactive',
      technology: e => e.technology || 'Enterprise Stack'
    };
    const getter = getterMap[key] || (e => e[key] || 'Other');
    const filtered = emps.filter(e => getter(e) === sliceValue);

    const headers = ['Employee ID', 'Full Name', 'Email', 'CNIC', 'Phone', 'Department', 'Designation', 'Branch', 'Status', key.toUpperCase()];
    const rows = filtered.map(e => [
      e.empNo,
      `"${(e.fullName||'').replace(/"/g, '""')}"`,
      e.email,
      e.cnic,
      e.phone,
      `"${Utils.getDeptName(e.departmentId).replace(/"/g, '""')}"`,
      `"${Utils.getDesigName(e.designationId).replace(/"/g, '""')}"`,
      `"${Utils.getBranchName(e.branchId).replace(/"/g, '""')}"`,
      e.status,
      `"${(sliceValue||'').replace(/"/g, '""')}"`
    ].join(','));

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csv, `demographics_${key}_${sliceValue.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    Toast.show(`Exported ${filtered.length} employees for ${sliceValue}`, 'success');
  },

  exportAllDemographicsCSV(key, title) {
    const emps = DB.get('employees') || [];
    const getterMap = {
      division: e => (e.divisionId === 1 ? 'Corporate Strategy & HR' : (e.divisionId === 2 ? 'Technology & Digital' : (e.divisionId === 3 ? 'Finance & Fiscal Governance' : (e.divisionId === 4 ? 'Commercial & Business Dev' : 'General Administration')))),
      department: e => Utils.getDeptName(e.departmentId) || 'Staff',
      designation: e => Utils.getDesigName(e.designationId) || 'Staff',
      jobStatus: e => e.jobStatus || (e.status === 'inactive' ? 'Ex-Employee' : 'Permanent'),
      gender: e => e.gender || 'Male',
      religion: e => e.religion || 'Islam',
      smoking: e => e.smoking || 'Non-Smoker',
      maritalStatus: e => e.maritalStatus || 'Married',
      nationality: e => e.nationality || 'Pakistani',
      state: e => e.state || 'Punjab',
      city: e => e.city || 'Lahore',
      workspace: e => e.workspace || 'On-site Office',
      reportTo: e => e.managerId ? Utils.getEmpName(e.managerId) : 'Executive Board',
      employeeCount: e => e.status === 'active' ? 'Active Staff' : 'On Leave / Inactive',
      technology: e => e.technology || 'Enterprise Stack'
    };
    const getter = getterMap[key] || (e => e[key] || 'Other');
    const counts = {};
    emps.forEach(e => {
      const val = getter(e);
      counts[val] = (counts[val] || 0) + 1;
    });

    const headers = ['Category / Segment', 'Headcount', 'Percentage of Total Workforce (%)'];
    const rows = Object.keys(counts).map(k => [
      `"${k.replace(/"/g, '""')}"`,
      counts[k],
      ((counts[k] / emps.length) * 100).toFixed(2)
    ].join(','));

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csv, `demographic_distribution_${key}.csv`);
    Toast.show(`Demographic audit for ${title} exported!`, 'success');
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 5. ENTERPRISE REPORT 2: OFFICE LAYOUT
  // ═════════════════════════════════════════════════════════════════════════
  renderOfficeLayout(container) {
    const layouts = DB.get('office_layouts') || [];
    const currentCenter = this.officeCenter || 'Lahore Center I';
    let layout = layouts.find(l => l.centerName === currentCenter);
    if (!layout && layouts.length) layout = layouts[0];

    const zones = layout ? layout.zones : [
      { location: 'C1 - Dinning', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'C1 - Main Hall', totalSpaces: 48, occupied: 30, free: 18 },
      { location: 'C1 - Reception', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'C1 - Room 01', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'C1 - Room 02', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'Work From Home', totalSpaces: 0, occupied: 0, free: 0 }
    ];

    const totalSpaces = zones.reduce((acc, z) => acc + (z.totalSpaces || 0), 0);
    const totalOccupied = zones.reduce((acc, z) => acc + (z.occupied || 0), 0);
    const totalFree = zones.reduce((acc, z) => acc + (z.free || 0), 0);

    const rowsHtml = zones.map(z => `
      <tr>
        <td style="font-weight:600">${z.location}</td>
        <td>${z.totalSpaces}</td>
        <td style="color:${z.occupied > 0 ? '#0284c7' : 'inherit'};font-weight:${z.occupied > 0 ? '700' : 'normal'}">${z.occupied}</td>
        <td style="color:${z.free > 0 ? '#10b981' : 'inherit'}">${z.free}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="enterprise-report-card">
        <div class="report-blue-banner">
          <span>Office Layout</span>
        </div>
        <div class="office-layout-subbar">
          <div style="display:flex;align-items:center;gap:10px">
            <span>${currentCenter}</span>
            <select class="report-filter-input" style="height:28px;padding:2px 8px;font-size:12px;width:180px" onchange="Reports.setOfficeCenter(this.value)">
              <option value="Lahore Center I" ${currentCenter === 'Lahore Center I' ? 'selected' : ''}>Lahore Center I</option>
              <option value="Karachi Head Office" ${currentCenter === 'Karachi Head Office' ? 'selected' : ''}>Karachi Head Office</option>
              <option value="Islamabad Tech Hub" ${currentCenter === 'Islamabad Tech Hub' ? 'selected' : ''}>Islamabad Tech Hub</option>
            </select>
          </div>
          <div class="office-layout-actions">
            <button class="office-layout-icon-btn" onclick="Reports.exportOfficeLayoutExcel()" title="Export to Excel">
              <i class="fa fa-file-excel" style="color:#16a34a"></i>
            </button>
            <button class="office-layout-icon-btn" onclick="Reports.exportOfficeLayoutPDF()" title="Export to PDF">
              <i class="fa fa-file-pdf" style="color:#ef4444"></i>
            </button>
            <button class="office-layout-icon-btn" onclick="window.print()" title="Print Layout">
              <i class="fa fa-print" style="color:#0284c7"></i>
            </button>
          </div>
        </div>
        <table class="office-layout-table">
          <thead>
            <tr>
              <th style="width:40%">Location</th>
              <th style="width:20%">Total Spaces</th>
              <th style="width:20%">Occupied</th>
              <th style="width:20%">Free</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td>Total</td>
              <td>${totalSpaces}</td>
              <td>${totalOccupied}</td>
              <td>${totalFree}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  setOfficeCenter(centerName) {
    this.officeCenter = centerName;
    const container = document.getElementById('reports-tab-content');
    if (container) this.renderOfficeLayout(container);
  },

  exportOfficeLayoutExcel() {
    const currentCenter = this.officeCenter || 'Lahore Center I';
    const layouts = DB.get('office_layouts') || [];
    let layout = layouts.find(l => l.centerName === currentCenter);
    const zones = layout ? layout.zones : [
      { location: 'C1 - Dinning', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'C1 - Main Hall', totalSpaces: 48, occupied: 30, free: 18 },
      { location: 'C1 - Reception', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'C1 - Room 01', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'C1 - Room 02', totalSpaces: 0, occupied: 0, free: 0 },
      { location: 'Work From Home', totalSpaces: 0, occupied: 0, free: 0 }
    ];

    const totalSpaces = zones.reduce((acc, z) => acc + (z.totalSpaces || 0), 0);
    const totalOccupied = zones.reduce((acc, z) => acc + (z.occupied || 0), 0);
    const totalFree = zones.reduce((acc, z) => acc + (z.free || 0), 0);

    const headers = ['Location / Zone', 'Total Spaces', 'Occupied', 'Free'];
    const rows = zones.map(z => [
      `"${z.location.replace(/"/g, '""')}"`,
      z.totalSpaces || 0,
      z.occupied || 0,
      z.free || 0
    ].join(','));
    rows.push([`"Total"`, totalSpaces, totalOccupied, totalFree].join(','));

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csv, `office_layout_${currentCenter.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    Toast.show(`Office layout for ${currentCenter} exported!`, 'success');
  },

  exportOfficeLayoutPDF() {
    window.print();
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 6. ENTERPRISE REPORT 3: EMPLOYEE REPORT MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════
  renderEmployeeReportManagement(container) {
    const emps = DB.get('employees') || [];
    const depts = DB.get('departments') || [];
    const desigs = DB.get('designations') || [];
    const branches = DB.get('branches') || [];
    const managers = emps.filter(e => ['director', 'dept_manager', 'superadmin', 'hr_manager'].includes(e.role));

    const f = this.empReportFilters;

    const renderChipBox = (key) => {
      const items = f[key] || [];
      if (!items.length) {
        return `<span class="report-chip-tag">All ${key.charAt(0).toUpperCase() + key.slice(1)}s <span class="chip-del" onclick="Reports.removeEmpFilterChip('${key}', 'All ${key.charAt(0).toUpperCase() + key.slice(1)}s')">×</span></span>`;
      }
      return items.map(val => `
        <span class="report-chip-tag">
          ${val}
          <span class="chip-del" onclick="Reports.removeEmpFilterChip('${key}', '${val.replace(/'/g, "\\'")}')">×</span>
        </span>
      `).join('');
    };

    container.innerHTML = `
      <div class="enterprise-report-card">
        <div class="report-blue-banner">
          <span>Employee Report Management</span>
        </div>
        <div class="report-search-section">
          <div class="report-search-title">Search</div>
          <div class="report-filter-grid-3">
            <!-- Col 1 -->
            <div class="report-filter-field">
              <label class="report-filter-label">Location/Center:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="emp-filter-loc-select">
                  <option value="All Locations">All Locations</option>
                  ${branches.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addEmpFilterChip('location', 'emp-filter-loc-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box" id="emp-chips-location">
                ${renderChipBox('location')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Department :</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="emp-filter-dept-select">
                  <option value="All Departments">All Departments</option>
                  ${depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addEmpFilterChip('department', 'emp-filter-dept-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box" id="emp-chips-department">
                ${renderChipBox('department')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Employment Status:</label>
              <select class="report-filter-input" id="emp-filter-empstatus" onchange="Reports.empReportFilters.employmentStatus = this.value">
                <option value="Current Employees" ${f.employmentStatus === 'Current Employees' ? 'selected' : ''}>Current Employees</option>
                <option value="All Employees" ${f.employmentStatus === 'All Employees' ? 'selected' : ''}>All Employees</option>
                <option value="Ex-Employees" ${f.employmentStatus === 'Ex-Employees' ? 'selected' : ''}>Ex-Employees</option>
                <option value="Probationary" ${f.employmentStatus === 'Probationary' ? 'selected' : ''}>Probationary</option>
              </select>
            </div>

            <!-- Col 2 -->
            <div class="report-filter-field">
              <label class="report-filter-label">Designation:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="emp-filter-desig-select">
                  <option value="All Designations">All Designations</option>
                  ${desigs.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addEmpFilterChip('designation', 'emp-filter-desig-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box" id="emp-chips-designation">
                ${renderChipBox('designation')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Managers:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="emp-filter-mgr-select">
                  <option value="All Managers">All Managers</option>
                  ${managers.map(m => `<option value="${m.fullName}">${m.fullName}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addEmpFilterChip('manager', 'emp-filter-mgr-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box" id="emp-chips-manager">
                ${renderChipBox('manager')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Selected Employee(s) Status:</label>
              <select class="report-filter-input" id="emp-filter-selstatus" onchange="Reports.empReportFilters.selectedEmployeeStatus = this.value">
                <option value="All" ${f.selectedEmployeeStatus === 'All' ? 'selected' : ''}>All</option>
                <option value="Active" ${f.selectedEmployeeStatus === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Probation" ${f.selectedEmployeeStatus === 'Probation' ? 'selected' : ''}>Probation</option>
                <option value="Notice Period" ${f.selectedEmployeeStatus === 'Notice Period' ? 'selected' : ''}>Notice Period</option>
              </select>
            </div>

            <!-- Col 3 -->
            <div class="report-filter-field">
              <label class="report-filter-label">Division:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="emp-filter-div-select">
                  <option value="All Divisions">All Divisions</option>
                  <option value="Corporate Strategy & HR">Corporate Strategy & HR</option>
                  <option value="Technology & Digital">Technology & Digital</option>
                  <option value="Finance & Fiscal Governance">Finance & Fiscal Governance</option>
                  <option value="Commercial & Business Dev">Commercial & Business Dev</option>
                </select>
                <button class="report-add-btn" onclick="Reports.addEmpFilterChip('division', 'emp-filter-div-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box" id="emp-chips-division">
                ${renderChipBox('division')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Employee:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="emp-filter-emp-select">
                  <option value="All Employees">All Employees</option>
                  ${emps.map(e => `<option value="${e.fullName}-${e.empNo}">${e.fullName} (${e.empNo})</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addEmpFilterChip('employee', 'emp-filter-emp-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box" id="emp-chips-employee">
                ${renderChipBox('employee')}
              </div>
            </div>
          </div>
        </div>
        <div class="report-actions-row">
          <button class="btn-report-cyan" onclick="Reports.exportEmployeeReportExcel()"><i class="fa fa-file-excel"></i> Export to Excel</button>
          <button class="btn-report-cyan" onclick="Reports.displayEmployeeReport()"><i class="fa fa-table"></i> Display Report</button>
        </div>
        <div id="emp-report-results-table"></div>
      </div>
    `;

    if (this.empReportResults) {
      this.renderEmpResultsTable();
    }
  },

  addEmpFilterChip(category, selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const val = sel.value;
    if (!this.empReportFilters[category]) this.empReportFilters[category] = [];
    if (val.startsWith('All ')) {
      this.empReportFilters[category] = [val];
    } else {
      this.empReportFilters[category] = this.empReportFilters[category].filter(x => !x.startsWith('All '));
      if (!this.empReportFilters[category].includes(val)) {
        this.empReportFilters[category].push(val);
      }
    }
    const container = document.getElementById('reports-tab-content');
    if (container) this.renderEmployeeReportManagement(container);
  },

  removeEmpFilterChip(category, val) {
    if (!this.empReportFilters[category]) return;
    this.empReportFilters[category] = this.empReportFilters[category].filter(x => x !== val);
    if (!this.empReportFilters[category].length) {
      this.empReportFilters[category] = [`All ${category.charAt(0).toUpperCase() + category.slice(1)}s`];
    }
    const container = document.getElementById('reports-tab-content');
    if (container) this.renderEmployeeReportManagement(container);
  },

  displayEmployeeReport() {
    const emps = DB.get('employees') || [];
    const f = this.empReportFilters;

    const filtered = emps.filter(e => {
      // Location
      if (f.location && f.location.length && !f.location.includes('All Locations')) {
        const branchName = Utils.getBranchName(e.branchId);
        if (!f.location.includes(branchName)) return false;
      }
      // Department
      if (f.department && f.department.length && !f.department.includes('All Departments')) {
        const deptName = Utils.getDeptName(e.departmentId);
        if (!f.department.includes(deptName)) return false;
      }
      // Designation
      if (f.designation && f.designation.length && !f.designation.includes('All Designations')) {
        const desigName = Utils.getDesigName(e.designationId);
        if (!f.designation.includes(desigName)) return false;
      }
      // Manager
      if (f.manager && f.manager.length && !f.manager.includes('All Managers')) {
        const mgrName = Utils.getEmpName(e.managerId);
        if (!f.manager.includes(mgrName)) return false;
      }
      // Employee
      if (f.employee && f.employee.length && !f.employee.includes('All Employees')) {
        const tag = `${e.fullName}-${e.empNo}`;
        if (!f.employee.includes(tag) && !f.employee.some(t => t.includes(e.empNo))) return false;
      }
      // Employment Status
      if (f.employmentStatus === 'Current Employees' && e.status === 'inactive') return false;
      if (f.employmentStatus === 'Ex-Employees' && e.status !== 'inactive') return false;
      if (f.employmentStatus === 'Probationary' && e.jobStatus !== 'Probation') return false;

      // Selected Status
      if (f.selectedEmployeeStatus && f.selectedEmployeeStatus !== 'All') {
        if (f.selectedEmployeeStatus === 'Active' && e.status !== 'active') return false;
        if (f.selectedEmployeeStatus === 'Probation' && e.jobStatus !== 'Probation') return false;
      }

      return true;
    });

    this.empReportResults = filtered;
    this.renderEmpResultsTable();
    Toast.show(`Found ${filtered.length} employees matching criteria`, 'info');
  },

  renderEmpResultsTable() {
    const wrap = document.getElementById('emp-report-results-table');
    if (!wrap) return;
    const emps = this.empReportResults || [];

    if (!emps.length) {
      wrap.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-3);border-top:1px solid var(--border)">No employees match the selected criteria.</div>`;
      return;
    }

    const rows = emps.map(e => `
      <tr>
        <td><strong>${e.empNo}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="avatar avatar-xs" style="background:${Utils.avatarColor(e.id)};font-size:10px;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:white">
              ${Utils.avatarInitials(e.fullName)}
            </span>
            <div>
              <div style="font-weight:700;color:var(--text)">${e.fullName}</div>
              <div style="font-size:11px;color:var(--text-3)">${e.email}</div>
            </div>
          </div>
        </td>
        <td>${e.cnic || '—'}</td>
        <td>${Utils.getBranchName(e.branchId)}</td>
        <td>${Utils.getDeptName(e.departmentId)}</td>
        <td>${Utils.getDesigName(e.designationId)}</td>
        <td><span class="badge ${e.status === 'active' ? 'badge-success' : 'badge-danger'}">${e.status}</span></td>
        <td>${e.joinDate || '—'}</td>
        <td style="font-weight:700;color:var(--success)">${Utils.formatCurrency(e.salary || e.basicSalary || 0)}</td>
      </tr>
    `).join('');

    wrap.innerHTML = `
      <div style="padding:16px 20px;border-top:1px solid var(--border);background:var(--surface)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700;color:#0099cc">Report Output (${emps.length} Records)</span>
          <span style="font-size:12px;color:var(--text-2)">Sorted by Employee ID</span>
        </div>
        <div style="overflow-x:auto">
          <table class="table" style="width:100%">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>CNIC</th>
                <th>Location / Center</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Joining Date</th>
                <th>Salary (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportEmployeeReportExcel() {
    const emps = this.empReportResults || DB.get('employees') || [];
    if (!emps.length) {
      Toast.show('No employee data to export', 'warning');
      return;
    }

    const headers = ['Emp No', 'Full Name', 'CNIC', 'Corporate Email', 'Contact', 'Branch', 'Department', 'Designation', 'Status', 'Employment Type', 'Joining Date', 'Basic Salary (PKR)'];
    const rows = emps.map(e => [
      e.empNo,
      `"${(e.fullName||'').replace(/"/g, '""')}"`,
      e.cnic || '',
      e.email || '',
      e.phone || '',
      `"${Utils.getBranchName(e.branchId).replace(/"/g, '""')}"`,
      `"${Utils.getDeptName(e.departmentId).replace(/"/g, '""')}"`,
      `"${Utils.getDesigName(e.designationId).replace(/"/g, '""')}"`,
      e.status || '',
      e.employmentType || e.jobStatus || '',
      e.joinDate || '',
      e.salary || e.basicSalary || 0
    ].join(','));

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csv, `employee_report_management_${Utils.today()}.csv`);
    Toast.show(`Exported ${emps.length} employees to Excel!`, 'success');
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 7. ENTERPRISE REPORT 4: PERFORMANCE REVIEW REPORT
  // ═════════════════════════════════════════════════════════════════════════
  renderPerformanceReviewReport(container) {
    const emps = DB.get('employees') || [];
    const depts = DB.get('departments') || [];
    const desigs = DB.get('designations') || [];
    const branches = DB.get('branches') || [];
    const managers = emps.filter(e => ['director', 'dept_manager', 'superadmin', 'hr_manager'].includes(e.role));

    const f = this.perfReportFilters;

    const renderChipBox = (key) => {
      const items = f[key] || [];
      if (!items.length) {
        return `<span class="report-chip-tag">All ${key.charAt(0).toUpperCase() + key.slice(1)}s <span class="chip-del" onclick="Reports.removePerfFilterChip('${key}', 'All ${key.charAt(0).toUpperCase() + key.slice(1)}s')">×</span></span>`;
      }
      return items.map(val => `
        <span class="report-chip-tag">
          ${val}
          <span class="chip-del" onclick="Reports.removePerfFilterChip('${key}', '${val.replace(/'/g, "\\'")}')">×</span>
        </span>
      `).join('');
    };

    container.innerHTML = `
      <div class="enterprise-report-card">
        <div class="report-blue-banner">
          <span>Performance Review Report</span>
        </div>
        <div class="report-search-section">
          <div class="report-search-title">Search</div>

          <!-- Top Row Controls -->
          <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:10px">
              <label class="report-filter-label" style="margin-bottom:0">Review Status:</label>
              <select class="report-filter-input" style="width:160px" onchange="Reports.perfReportFilters.reviewStatus = this.value">
                <option value="All Status" ${f.reviewStatus === 'All Status' ? 'selected' : ''}>All Status</option>
                <option value="Completed" ${f.reviewStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                <option value="Pending" ${f.reviewStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Under Review" ${f.reviewStatus === 'Under Review' ? 'selected' : ''}>Under Review</option>
              </select>
            </div>

            <div style="display:flex;align-items:center;gap:10px">
              <label class="report-filter-label" style="margin-bottom:0">For the Quarter Ending:</label>
              <select class="report-filter-input" style="width:100px" onchange="Reports.perfReportFilters.quarterFrom = this.value">
                <option value="From">From</option>
                <option value="Q1" ${f.quarterFrom === 'Q1' ? 'selected' : ''}>Q1</option>
                <option value="Q2" ${f.quarterFrom === 'Q2' ? 'selected' : ''}>Q2</option>
                <option value="Q3" ${f.quarterFrom === 'Q3' ? 'selected' : ''}>Q3</option>
                <option value="Q4" ${f.quarterFrom === 'Q4' ? 'selected' : ''}>Q4</option>
              </select>
              <select class="report-filter-input" style="width:100px" onchange="Reports.perfReportFilters.quarterTo = this.value">
                <option value="To">To</option>
                <option value="Q1" ${f.quarterTo === 'Q1' ? 'selected' : ''}>Q1</option>
                <option value="Q2" ${f.quarterTo === 'Q2' ? 'selected' : ''}>Q2</option>
                <option value="Q3" ${f.quarterTo === 'Q3' ? 'selected' : ''}>Q3</option>
                <option value="Q4" ${f.quarterTo === 'Q4' ? 'selected' : ''}>Q4</option>
              </select>
              <select class="report-filter-input" style="width:110px" onchange="Reports.perfReportFilters.year = this.value">
                <option value="Year">Year</option>
                <option value="2026" ${f.year === '2026' ? 'selected' : ''}>2026</option>
                <option value="2025" ${f.year === '2025' ? 'selected' : ''}>2025</option>
                <option value="2024" ${f.year === '2024' ? 'selected' : ''}>2024</option>
              </select>
            </div>
          </div>

          <!-- Multi-criteria Filters -->
          <div class="report-filter-grid-3">
            <div class="report-filter-field">
              <label class="report-filter-label">Location/Center:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="perf-filter-loc-select">
                  <option value="All Locations">All Locations</option>
                  ${branches.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addPerfFilterChip('location', 'perf-filter-loc-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('location')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Department :</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="perf-filter-dept-select">
                  <option value="All Departments">All Departments</option>
                  ${depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addPerfFilterChip('department', 'perf-filter-dept-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('department')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Employment Status:</label>
              <select class="report-filter-input" onchange="Reports.perfReportFilters.employmentStatus = this.value">
                <option value="Current Employees">Current Employees</option>
                <option value="All Employees">All Employees</option>
                <option value="Ex-Employees">Ex-Employees</option>
              </select>
            </div>

            <div class="report-filter-field">
              <label class="report-filter-label">Designation:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="perf-filter-desig-select">
                  <option value="All Designations">All Designations</option>
                  ${desigs.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addPerfFilterChip('designation', 'perf-filter-desig-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('designation')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Managers:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="perf-filter-mgr-select">
                  <option value="All Managers">All Managers</option>
                  ${managers.map(m => `<option value="${m.fullName}">${m.fullName}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addPerfFilterChip('manager', 'perf-filter-mgr-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('manager')}
              </div>
            </div>

            <div class="report-filter-field">
              <label class="report-filter-label">Division:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="perf-filter-div-select">
                  <option value="All Divisions">All Divisions</option>
                  <option value="Corporate Strategy & HR">Corporate Strategy & HR</option>
                  <option value="Technology & Digital">Technology & Digital</option>
                  <option value="Finance & Fiscal Governance">Finance & Fiscal Governance</option>
                  <option value="Commercial & Business Dev">Commercial & Business Dev</option>
                </select>
                <button class="report-add-btn" onclick="Reports.addPerfFilterChip('division', 'perf-filter-div-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('division')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Employee:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="perf-filter-emp-select">
                  <option value="All Employees">All Employees</option>
                  ${emps.map(e => `<option value="${e.fullName}-${e.empNo}">${e.fullName} (${e.empNo})</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addPerfFilterChip('employee', 'perf-filter-emp-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('employee')}
              </div>
            </div>
          </div>
        </div>
        <div class="report-actions-row">
          <button class="btn-report-cyan" onclick="Reports.exportPerformanceReportExcel()"><i class="fa fa-file-excel"></i> Export to Excel</button>
          <button class="btn-report-cyan" onclick="Reports.displayPerformanceReport()"><i class="fa fa-table"></i> Display Report</button>
        </div>
        <div id="perf-report-results-table"></div>
      </div>
    `;

    if (this.perfReportResults) {
      this.renderPerfResultsTable();
    }
  },

  addPerfFilterChip(category, selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const val = sel.value;
    if (!this.perfReportFilters[category]) this.perfReportFilters[category] = [];
    if (val.startsWith('All ')) {
      this.perfReportFilters[category] = [val];
    } else {
      this.perfReportFilters[category] = this.perfReportFilters[category].filter(x => !x.startsWith('All '));
      if (!this.perfReportFilters[category].includes(val)) {
        this.perfReportFilters[category].push(val);
      }
    }
    const container = document.getElementById('reports-tab-content');
    if (container) this.renderPerformanceReviewReport(container);
  },

  removePerfFilterChip(category, val) {
    if (!this.perfReportFilters[category]) return;
    this.perfReportFilters[category] = this.perfReportFilters[category].filter(x => x !== val);
    if (!this.perfReportFilters[category].length) {
      this.perfReportFilters[category] = [`All ${category.charAt(0).toUpperCase() + category.slice(1)}s`];
    }
    const container = document.getElementById('reports-tab-content');
    if (container) this.renderPerformanceReviewReport(container);
  },

  displayPerformanceReport() {
    const reviews = DB.get('performance_reviews') || [];
    const emps = DB.get('employees') || [];
    const f = this.perfReportFilters;

    const filtered = reviews.filter(r => {
      const emp = emps.find(e => e.id === r.employeeId) || {};
      if (f.reviewStatus !== 'All Status' && r.status !== f.reviewStatus) return false;

      if (f.location && f.location.length && !f.location.includes('All Locations')) {
        const branch = Utils.getBranchName(emp.branchId);
        if (!f.location.includes(branch)) return false;
      }
      if (f.department && f.department.length && !f.department.includes('All Departments')) {
        const dept = Utils.getDeptName(emp.departmentId);
        if (!f.department.includes(dept)) return false;
      }
      if (f.employee && f.employee.length && !f.employee.includes('All Employees')) {
        const tag = `${emp.fullName}-${emp.empNo}`;
        if (!f.employee.includes(tag) && !f.employee.some(t => t.includes(emp.empNo))) return false;
      }
      return true;
    });

    this.perfReportResults = filtered;
    this.renderPerfResultsTable();
    Toast.show(`Displaying ${filtered.length} appraisal review records`, 'info');
  },

  renderPerfResultsTable() {
    const wrap = document.getElementById('perf-report-results-table');
    if (!wrap) return;
    const revs = this.perfReportResults || [];

    if (!revs.length) {
      wrap.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-3);border-top:1px solid var(--border)">No appraisal records match the selected criteria.</div>`;
      return;
    }

    const rows = revs.map(r => {
      const emp = DB.find('employees', r.employeeId) || { fullName: 'Employee #' + r.employeeId, empNo: 'EMP-' + r.employeeId };
      return `
        <tr>
          <td><strong>${emp.empNo}</strong></td>
          <td style="font-weight:700;color:var(--text)">${emp.fullName}</td>
          <td>${Utils.getDeptName(emp.departmentId)}</td>
          <td><span class="badge badge-info">${r.reviewPeriod || r.quarter || 'Q1 2026'}</span></td>
          <td style="text-align:center">${r.managerRating || r.reviewerScore || '—'}</td>
          <td style="text-align:center">${r.selfRating || '—'}</td>
          <td style="text-align:center;font-weight:700;color:#0099cc">${r.finalScore || r.rating || '4.5'}</td>
          <td><span class="badge badge-success">${r.status || 'Completed'}</span></td>
          <td style="font-size:12px;color:var(--text-2)">${r.recommendation || r.comments || 'Eligible for annual increment'}</td>
        </tr>
      `;
    }).join('');

    wrap.innerHTML = `
      <div style="padding:16px 20px;border-top:1px solid var(--border);background:var(--surface)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700;color:#0099cc">Appraisal Audit Ledger (${revs.length} Reviews)</span>
          <span style="font-size:12px;color:var(--text-2)">Official Performance Cycle 2026</span>
        </div>
        <div style="overflow-x:auto">
          <table class="table" style="width:100%">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Quarter / Period</th>
                <th style="text-align:center">Manager Score</th>
                <th style="text-align:center">Self Score</th>
                <th style="text-align:center">Final Rating</th>
                <th>Status</th>
                <th>Appraisal Recommendation</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportPerformanceReportExcel() {
    const revs = this.perfReportResults || DB.get('performance_reviews') || [];
    if (!revs.length) {
      Toast.show('No performance records to export', 'warning');
      return;
    }

    const headers = ['Emp No', 'Full Name', 'Department', 'Review Period', 'Quarter', 'Year', 'Manager Score', 'Self Score', 'Final Weighted Rating', 'Status', 'Recommendation'];
    const rows = revs.map(r => {
      const emp = DB.find('employees', r.employeeId) || { fullName: 'Employee #' + r.employeeId, empNo: 'EMP-' + r.employeeId };
      return [
        emp.empNo,
        `"${emp.fullName.replace(/"/g, '""')}"`,
        `"${Utils.getDeptName(emp.departmentId).replace(/"/g, '""')}"`,
        `"${(r.reviewPeriod || '').replace(/"/g, '""')}"`,
        r.quarter || 'Q1',
        r.year || '2026',
        r.managerRating || r.reviewerScore || '',
        r.selfRating || '',
        r.finalScore || r.rating || '',
        r.status || 'Completed',
        `"${(r.recommendation || r.comments || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csv, `performance_review_report_${Utils.today()}.csv`);
    Toast.show(`Exported ${revs.length} review appraisal records to Excel!`, 'success');
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 8. ENTERPRISE REPORT 5: TOKEN REPORT MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════
  renderTokenReportManagement(container) {
    const emps = DB.get('employees') || [];
    const depts = DB.get('departments') || [];
    const desigs = DB.get('designations') || [];
    const branches = DB.get('branches') || [];
    const managers = emps.filter(e => ['director', 'dept_manager', 'superadmin', 'hr_manager'].includes(e.role));

    const f = this.tokenReportFilters;

    const renderChipBox = (key) => {
      const items = f[key] || [];
      return items.map(val => `
        <span class="report-chip-tag">
          ${val}
          <span class="chip-del" onclick="Reports.removeTokenFilterChip('${key}', '${val.replace(/'/g, "\\'")}')">×</span>
        </span>
      `).join('');
    };

    container.innerHTML = `
      <div class="enterprise-report-card">
        <div class="report-blue-banner">
          <span>Token Report Management</span>
        </div>
        <div class="report-search-section">
          <div class="report-search-title">Search</div>

          <!-- Top Row Date Filter -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <label class="report-filter-label" style="margin-bottom:0">Date:<span style="color:#ef4444">*</span></label>
            <select class="report-filter-input" style="width:220px" onchange="Reports.tokenReportFilters.date = this.value">
              <option value="all">Select Option</option>
              <option value="today">Today (${Utils.today()})</option>
              <option value="month">Current Month (September 2026)</option>
              <option value="quarter">Current Quarter (Q3 2026)</option>
              <option value="all">All Dates Historical</option>
            </select>
          </div>

          <!-- Multi-criteria Filters -->
          <div class="report-filter-grid-3">
            <div class="report-filter-field">
              <label class="report-filter-label">Location/Center:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="tok-filter-loc-select">
                  <option value="All Locations">All Locations</option>
                  ${branches.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addTokenFilterChip('location', 'tok-filter-loc-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('location')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Department :</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="tok-filter-dept-select">
                  <option value="All Departments">All Departments</option>
                  ${depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addTokenFilterChip('department', 'tok-filter-dept-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('department')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Employment Status:</label>
              <select class="report-filter-input" onchange="Reports.tokenReportFilters.employmentStatus = this.value">
                <option value="Current Employees">Current Employees</option>
                <option value="All Employees">All Employees</option>
              </select>
            </div>

            <div class="report-filter-field">
              <label class="report-filter-label">Designation:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="tok-filter-desig-select">
                  <option value="All Designations">All Designations</option>
                  ${desigs.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addTokenFilterChip('designation', 'tok-filter-desig-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('designation')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Managers:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="tok-filter-mgr-select">
                  <option value="All Managers">All Managers</option>
                  ${managers.map(m => `<option value="${m.fullName}">${m.fullName}</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addTokenFilterChip('manager', 'tok-filter-mgr-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('manager')}
              </div>
            </div>

            <div class="report-filter-field">
              <label class="report-filter-label">Division:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="tok-filter-div-select">
                  <option value="All Divisions">All Divisions</option>
                  <option value="Corporate Strategy & HR">Corporate Strategy & HR</option>
                  <option value="Technology & Digital">Technology & Digital</option>
                  <option value="Finance & Fiscal Governance">Finance & Fiscal Governance</option>
                  <option value="Commercial & Business Dev">Commercial & Business Dev</option>
                </select>
                <button class="report-add-btn" onclick="Reports.addTokenFilterChip('division', 'tok-filter-div-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('division')}
              </div>

              <label class="report-filter-label" style="margin-top:12px">Employee:</label>
              <div class="report-filter-row">
                <select class="report-filter-input" id="tok-filter-emp-select">
                  <option value="All Employees">All Employees</option>
                  <option value="Ghulam Mustafa-00063" selected>Ghulam Mustafa-00063</option>
                  ${emps.filter(e => e.empNo !== '00063').map(e => `<option value="${e.fullName}-${e.empNo}">${e.fullName} (${e.empNo})</option>`).join('')}
                </select>
                <button class="report-add-btn" onclick="Reports.addTokenFilterChip('employee', 'tok-filter-emp-select')" title="Add filter">+</button>
              </div>
              <div class="report-selected-box">
                ${renderChipBox('employee')}
              </div>
            </div>
          </div>
        </div>
        <div class="report-actions-row">
          <button class="btn-report-cyan" onclick="Reports.exportTokenReportExcel()"><i class="fa fa-file-excel"></i> Export to Excel</button>
          <button class="btn-report-cyan" onclick="Reports.displayTokenReport()"><i class="fa fa-table"></i> Display Report</button>
        </div>
        <div id="token-report-results-table"></div>
      </div>
    `;

    if (this.tokenReportResults) {
      this.renderTokenResultsTable();
    }
  },

  addTokenFilterChip(category, selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const val = sel.value;
    if (!this.tokenReportFilters[category]) this.tokenReportFilters[category] = [];
    if (val.startsWith('All ')) {
      this.tokenReportFilters[category] = [val];
    } else {
      this.tokenReportFilters[category] = this.tokenReportFilters[category].filter(x => !x.startsWith('All '));
      if (!this.tokenReportFilters[category].includes(val)) {
        this.tokenReportFilters[category].push(val);
      }
    }
    const container = document.getElementById('reports-tab-content');
    if (container) this.renderTokenReportManagement(container);
  },

  removeTokenFilterChip(category, val) {
    if (!this.tokenReportFilters[category]) return;
    this.tokenReportFilters[category] = this.tokenReportFilters[category].filter(x => x !== val);
    if (!this.tokenReportFilters[category].length) {
      this.tokenReportFilters[category] = [`All ${category.charAt(0).toUpperCase() + category.slice(1)}s`];
    }
    const container = document.getElementById('reports-tab-content');
    if (container) this.renderTokenReportManagement(container);
  },

  displayTokenReport() {
    const tokens = DB.get('overtime_tokens') || [];
    const emps = DB.get('employees') || [];
    const f = this.tokenReportFilters;

    const filtered = tokens.filter(t => {
      const emp = emps.find(e => e.id === t.employeeId) || {};
      if (f.employee && f.employee.length && !f.employee.includes('All Employees')) {
        const tag = `${emp.fullName}-${emp.empNo}`;
        const match = f.employee.some(sel => sel.includes(emp.empNo) || sel === tag || (emp.empNo === '00063' && sel.includes('00063')));
        if (!match) return false;
      }
      return true;
    });

    this.tokenReportResults = filtered;
    this.renderTokenResultsTable();
    Toast.show(`Displaying ${filtered.length} token utilization records`, 'info');
  },

  renderTokenResultsTable() {
    const wrap = document.getElementById('token-report-results-table');
    if (!wrap) return;
    const tokens = this.tokenReportResults || [];

    if (!tokens.length) {
      wrap.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-3);border-top:1px solid var(--border)">No overtime or short leave token records match the search filter.</div>`;
      return;
    }

    const rows = tokens.map(t => {
      const emp = DB.find('employees', t.employeeId) || { fullName: 'Employee #' + t.employeeId, empNo: 'EMP-' + t.employeeId };
      return `
        <tr>
          <td><strong style="color:#0099cc">${t.tokenNumber || 'TOK-' + t.id}</strong></td>
          <td>${t.date || Utils.today()}</td>
          <td><strong>${emp.empNo}</strong></td>
          <td style="font-weight:700;color:var(--text)">${emp.fullName}</td>
          <td>${Utils.getDeptName(emp.departmentId)}</td>
          <td><span class="badge badge-primary" style="background:#0284c7">${t.hours || 1} hr(s)</span></td>
          <td>${t.activityType || 'Overtime Activity'}</td>
          <td style="font-size:12px;color:var(--text-2)">${t.reason || 'Project Delivery'}</td>
          <td><span class="badge badge-success">${t.status || 'Approved'}</span></td>
          <td>${t.approvedBy || 'Manager'}</td>
        </tr>
      `;
    }).join('');

    wrap.innerHTML = `
      <div style="padding:16px 20px;border-top:1px solid var(--border);background:var(--surface)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700;color:#0099cc">Token Audit Register (${tokens.length} Records)</span>
          <span style="font-size:12px;color:var(--text-2)">Approved Overtime & Short Leave Entitlements</span>
        </div>
        <div style="overflow-x:auto">
          <table class="table" style="width:100%">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Date</th>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Hours</th>
                <th>Activity Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportTokenReportExcel() {
    const tokens = this.tokenReportResults || DB.get('overtime_tokens') || [];
    if (!tokens.length) {
      Toast.show('No token records to export', 'warning');
      return;
    }

    const headers = ['Token Ref #', 'Date', 'Emp No', 'Employee Name', 'Department', 'Hours Claimed', 'Activity Type', 'Reason', 'Status', 'Approved By'];
    const rows = tokens.map(t => {
      const emp = DB.find('employees', t.employeeId) || { fullName: 'Employee #' + t.employeeId, empNo: 'EMP-' + t.employeeId };
      return [
        t.tokenNumber || 'TOK-' + t.id,
        t.date || Utils.today(),
        emp.empNo,
        `"${emp.fullName.replace(/"/g, '""')}"`,
        `"${Utils.getDeptName(emp.departmentId).replace(/"/g, '""')}"`,
        t.hours || 1,
        `"${(t.activityType || '').replace(/"/g, '""')}"`,
        `"${(t.reason || '').replace(/"/g, '""')}"`,
        t.status || 'Approved',
        `"${(t.approvedBy || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csv, `token_report_management_${Utils.today()}.csv`);
    Toast.show(`Exported ${tokens.length} token usage records to Excel!`, 'success');
  },

  // ═════════════════════════════════════════════════════════════════════════
  // 9. ENTERPRISE REPORT 6: EMPLOYEE INCREMENT DETAILS
  // ═════════════════════════════════════════════════════════════════════════
  renderEmployeeIncrementDetails(container) {
    const f = this.incrementReportFilters;

    container.innerHTML = `
      <div class="enterprise-report-card">
        <div class="report-blue-banner">
          <span>Employee Increment Details</span>
        </div>
        <div class="report-search-section" style="display:flex;align-items:center;gap:30px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="report-filter-label" style="margin-bottom:0">From Date:<span style="color:#ef4444">*</span></span>
            <input type="date" class="report-filter-input" id="inc-from-date" value="${f.fromDate}" onchange="Reports.incrementReportFilters.fromDate = this.value" style="width:180px">
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="report-filter-label" style="margin-bottom:0">To Date:<span style="color:#ef4444">*</span></span>
            <input type="date" class="report-filter-input" id="inc-to-date" value="${f.toDate}" onchange="Reports.incrementReportFilters.toDate = this.value" style="width:180px">
          </div>
        </div>
        <div class="report-actions-row">
          <button class="btn-report-cyan" onclick="Reports.exportIncrementReportExcel()"><i class="fa fa-file-excel"></i> Export to Excel</button>
          <button class="btn-report-cyan" onclick="Reports.displayIncrementReport()"><i class="fa fa-table"></i> Display Report</button>
        </div>
        <div id="increment-report-results-table"></div>
      </div>
    `;

    if (this.incrementReportResults) {
      this.renderIncrementResultsTable();
    }
  },

  displayIncrementReport() {
    const increments = DB.get('employee_increments') || [];
    const from = this.incrementReportFilters.fromDate;
    const to = this.incrementReportFilters.toDate;

    const filtered = increments.filter(inc => {
      if (from && inc.effectiveDate < from) return false;
      if (to && inc.effectiveDate > to) return false;
      return true;
    });

    this.incrementReportResults = filtered;
    this.renderIncrementResultsTable();
    Toast.show(`Displaying ${filtered.length} salary increment records`, 'info');
  },

  renderIncrementResultsTable() {
    const wrap = document.getElementById('increment-report-results-table');
    if (!wrap) return;
    const incs = this.incrementReportResults || [];

    if (!incs.length) {
      wrap.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-3);border-top:1px solid var(--border)">No salary increment records found in the specified date range.</div>`;
      return;
    }

    const rows = incs.map(inc => `
      <tr>
        <td><strong>${inc.empNo}</strong></td>
        <td style="font-weight:700;color:var(--text)">${inc.fullName}</td>
        <td>${Utils.getDeptName(inc.departmentId)}</td>
        <td>${Utils.getDesigName(inc.designationId)}</td>
        <td style="color:var(--text-2)">${Utils.formatCurrency(inc.previousSalary)}</td>
        <td style="font-weight:700;color:#0099cc">+${Utils.formatCurrency(inc.incrementAmount)}</td>
        <td><span class="badge badge-success">+${inc.incrementPct}%</span></td>
        <td style="font-weight:700;color:var(--success)">${Utils.formatCurrency(inc.revisedSalary)}</td>
        <td>${inc.effectiveDate}</td>
        <td>${inc.approvedBy || 'Executive Committee'}</td>
        <td style="font-size:12px;color:var(--text-2)">${inc.reason || 'Annual Merit'}</td>
      </tr>
    `).join('');

    wrap.innerHTML = `
      <div style="padding:16px 20px;border-top:1px solid var(--border);background:var(--surface)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700;color:#0099cc">Salary Progression & Increment Ledger (${incs.length} Records)</span>
          <span style="font-size:12px;color:var(--text-2)">Effective Period: ${this.incrementReportFilters.fromDate} to ${this.incrementReportFilters.toDate}</span>
        </div>
        <div style="overflow-x:auto">
          <table class="table" style="width:100%">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Previous Salary (PKR)</th>
                <th>Increment Amount</th>
                <th>Increment %</th>
                <th>Revised Package (PKR)</th>
                <th>Effective Date</th>
                <th>Approved By</th>
                <th>Appraisal Reason</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportIncrementReportExcel() {
    const incs = this.incrementReportResults || DB.get('employee_increments') || [];
    if (!incs.length) {
      Toast.show('No salary increment records to export', 'warning');
      return;
    }

    const headers = ['Emp No', 'Employee Name', 'Department', 'Designation', 'Previous Salary (PKR)', 'Increment Amount (PKR)', 'Increment %', 'Revised Salary (PKR)', 'Effective Date', 'Approved By', 'Reason'];
    const rows = incs.map(inc => [
      inc.empNo,
      `"${inc.fullName.replace(/"/g, '""')}"`,
      `"${Utils.getDeptName(inc.departmentId).replace(/"/g, '""')}"`,
      `"${Utils.getDesigName(inc.designationId).replace(/"/g, '""')}"`,
      inc.previousSalary,
      inc.incrementAmount,
      inc.incrementPct,
      inc.revisedSalary,
      inc.effectiveDate,
      `"${(inc.approvedBy || '').replace(/"/g, '""')}"`,
      `"${(inc.reason || '').replace(/"/g, '""')}"`
    ].join(','));

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    Utils.downloadCSV(csv, `employee_increments_${Utils.today()}.csv`);
    Toast.show(`Exported ${incs.length} increment records to Excel!`, 'success');
  },

  // ═══════════════════════════════════════════════
  // RECRUITMENT FUNNEL & ASSESSMENT ANALYTICS REPORT
  // ═══════════════════════════════════════════════
  renderRecruitmentFunnelReport(container) {
    if (typeof Recruitment !== 'undefined' && typeof Recruitment.renderAssessmentSheets === 'function') {
      Recruitment.renderAssessmentSheets(container);
    } else {
      container.innerHTML = `
        <div class="card" style="padding:40px;text-align:center">
          <i class="fa fa-spinner fa-spin" style="font-size:32px;color:var(--primary);margin-bottom:12px"></i>
          <div>Loading Recruitment Assessment & Funnel Matrix...</div>
        </div>
      `;
    }
  }
};
