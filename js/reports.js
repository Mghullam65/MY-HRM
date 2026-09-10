// ============================================================
// HRM SYSTEM — Executive BI Analytics & Custom Report Builder
// ============================================================

const Reports = {
  currentTab: 'executive', // 'executive' | 'builder' | 'standard'
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;border:1px solid var(--border)">
            ${[
              { id: 'executive', label: 'Executive BI Analytics', icon: 'fa-chart-pie' },
              { id: 'builder', label: 'Custom Report Builder', icon: 'fa-wrench' },
              { id: 'standard', label: 'Standard Enterprise Reports', icon: 'fa-book' }
            ].map(tab => `
              <button class="tab-toggle-btn ${this.currentTab === tab.id ? 'active' : ''}" onclick="Reports.switchTab('${tab.id}')">
                <i class="fa ${tab.icon}" style="margin-right:6px"></i>${tab.label}
              </button>
            `).join('')}
          </div>

          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="Reports.render()">
              <i class="fa fa-rotate-right"></i> Refresh
            </button>
            ${this.currentTab !== 'executive' ? `
              <button class="btn btn-ghost btn-sm" onclick="Reports.exportCSV()">
                <i class="fa fa-file-csv"></i> Export CSV
              </button>
              <button class="btn btn-primary btn-sm" onclick="Reports.printExecutiveReport()">
                <i class="fa fa-print"></i> Print Executive PDF
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="window.print()">
                <i class="fa fa-print"></i> Print BI Dashboard
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

    if (this.currentTab === 'executive') {
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
  }
};
