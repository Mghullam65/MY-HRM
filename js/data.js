// ============================================================
// HRM SYSTEM — Data Layer & localStorage Manager
// ============================================================

const DB = {
  // ─── Seed all data into localStorage ───────────────────────
  init() {
    if (localStorage.getItem('hrm_initialized')) {
      this.ensureAuditLogs();
      this.ensureBirthday();
      this.ensureOfferLetters();
      this.ensureOnboardingData();
      this.ensureAttendanceLeaveAuditData();
      this.ensureHierarchyAndCorrections();
      this.ensureDocumentExpiries();
      this.ensureExitClearances();
      this.ensureHRLetters();
      return;
    }
    this.seed();
    this.ensureBirthday();
    this.ensureOfferLetters();
    this.ensureOnboardingData();
    this.ensureAttendanceLeaveAuditData();
    this.ensureHierarchyAndCorrections();
    this.ensureDocumentExpiries();
    this.ensureExitClearances();
    this.ensureHRLetters();
    localStorage.setItem('hrm_initialized', '1');
  },

  ensureAuditLogs() {
    const logs = this.get('audit_logs');
    if (!logs || logs.length < 10) {
      this.set('audit_logs', auditLogs);
    }
  },

  ensureOfferLetters() {
    const letters = this.get('offer_letters');
    if (!letters || !letters.length) {
      this.set('offer_letters', offerLetters);
    }
  },

  ensureOnboardingData() {
    const emps = this.get('employees') || [];
    let saad = emps.find(e => e.id === 26 || e.fullName === 'Saad Ibrahim');
    if (!saad) {
      saad = {
        id: 26, empNo: 'EMP-026', firstName: 'Saad', lastName: 'Ibrahim', fullName: 'Saad Ibrahim',
        email: 'saad.ibrahim@company.com', phone: '0345-4444444', cnic: '42101-5849201-3',
        dob: '1995-04-18', gender: 'Male', maritalStatus: 'Single',
        address: 'Sector F-7/2, Islamabad',
        departmentId: 4, designationId: 8, branchId: 3, shiftId: 1,
        joiningDate: '2026-09-05', confirmationDate: null,
        employmentType: 'Permanent', status: 'active', role: 'onboarding',
        onboardingStatus: 'submitted_for_review',
        salary: 140000, photo: null, managerId: 8, reportingTo: 8,
        bloodGroup: 'B+', nationality: 'Pakistani', religion: 'Islam',
        bankName: 'HBL', accountNo: '1122334455667', iban: 'PK36HABB0000001122334455',
        emergencyContact: { name: 'Tariq Ibrahim', relation: 'Father', phone: '0345-9988776' },
        qualifications: [{ degree: 'BBA / Marketing', institution: 'NUST', year: '2018', grade: '3.6 CGPA' }],
        experience: [{ company: 'Apex Global', designation: 'Assistant Sales Lead', from: '2019', to: '2026' }]
      };
      emps.push(saad);
      this.set('employees', emps);
    }

    // Ensure user account
    const users = this.get('users') || [];
    if (!users.some(u => u.username === 'saad.ibrahim')) {
      users.push({
        id: 5, employeeId: 26, username: 'saad.ibrahim', password: 'emp123',
        role: 'onboarding', status: 'active', lastLogin: null
      });
      this.set('users', users);
    }

    // Ensure seed documents for Saad Ibrahim
    const docs = this.get('documents') || [];
    if (!docs.some(d => d.employeeId === 26)) {
      const nextDocId = docs.length > 0 ? Math.max(...docs.map(x => x.id || 0)) + 1 : 1;
      docs.push(
        { id: nextDocId, employeeId: 26, type: 'CNIC', name: 'CNIC Copy (Front & Back)', filename: 'saad_cnic_verified.pdf', size: '1.4 MB', uploadedOn: '2026-09-05', status: 'verified' },
        { id: nextDocId + 1, employeeId: 26, type: 'Degree', name: 'BBA Degree & Official Transcripts', filename: 'nust_bba_degree.pdf', size: '2.8 MB', uploadedOn: '2026-09-05', status: 'verified' },
        { id: nextDocId + 2, employeeId: 26, type: 'CV', name: 'Updated Curriculum Vitae (CV)', filename: 'saad_ibrahim_cv.pdf', size: '420 KB', uploadedOn: '2026-09-05', status: 'verified' },
        { id: nextDocId + 3, employeeId: 26, type: 'Experience Letter', name: 'Relieving & Experience Certificate', filename: 'apex_experience_cert.pdf', size: '890 KB', uploadedOn: '2026-09-05', status: 'verified' },
        { id: nextDocId + 4, employeeId: 26, type: 'Photograph', name: 'Passport Size Blue Background Photo', filename: 'saad_photo.jpg', size: '310 KB', uploadedOn: '2026-09-05', status: 'verified' }
      );
      this.set('documents', docs);
    }

    // Ensure roles contains onboarding
    const rolesList = this.get('roles') || [];
    if (!rolesList.some(r => r.code === 'onboarding')) {
      rolesList.push({ id: 5, name: 'New Joiner (Onboarding)', code: 'onboarding', description: 'Self-service onboarding & document upload allowed' });
      this.set('roles', rolesList);
    }
  },

  ensureBirthday() {
    const emps = this.get('employees') || [];
    const todayMMDD = new Date().toISOString().slice(5, 10);
    const hasToday = emps.some(e => e.dob?.slice(5) === todayMMDD && e.status === 'active');
    if (!hasToday && emps.length > 3) {
      const emp = emps.find(e => e.id === 12) || emps[3];
      if (emp) {
        emp.dob = '1996-' + todayMMDD;
        this.set('employees', emps);
      }
    }
  },

  ensureAttendanceLeaveAuditData() {
    // 1. Ensure shifts have time-in window attributes
    const s = this.get('shifts') || [];
    let shiftUpdated = false;
    s.forEach(shift => {
      if (!shift.timeInWindowEnd) {
        shift.timeInWindowStart = shift.id === 1 ? '10:00' : (shift.startTime || '09:00');
        shift.timeInWindowEnd = shift.id === 1 ? '11:00' : (shift.startTime ? (parseInt(shift.startTime.split(':')[0]) + 1).toString().padStart(2,'0') + ':00' : '10:00');
        shiftUpdated = true;
      }
    });
    if (shiftUpdated || s.length === 0) {
      if (s.length > 0) this.set('shifts', s);
    }

    // 2. Ensure initial audit discrepancies in attendance and leaves
    const att = this.get('attendance') || [];
    const today = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    // Ensure a late punch after 11:00 AM window cutoff
    const hasLatePostCutoff = att.some(a => a.date?.startsWith(currentMonth) && a.timeIn && a.timeIn > '11:00');
    if (!hasLatePostCutoff && att.length > 0) {
      const rec = att.find(a => a.date?.startsWith(currentMonth) && a.employeeId === 3);
      if (rec) {
        rec.timeIn = '11:22';
        rec.status = 'late';
        rec.remarks = 'Check-in after 11:00 AM window cutoff (Late 22 mins)';
        this.set('attendance', att);
      }
    }

    // Ensure a missing punch out record on a past date
    const hasMissingPunch = att.some(a => a.date?.startsWith(currentMonth) && a.timeIn && (!a.timeOut || a.timeOut === ''));
    if (!hasMissingPunch && att.length > 0) {
      const rec = att.find(a => a.date?.startsWith(currentMonth) && a.employeeId === 7 && a.date !== today);
      if (rec) {
        rec.timeOut = '';
        rec.remarks = 'Missing check-out punch';
        this.set('attendance', att);
      }
    }

    // Ensure an unexplained absence
    const hasAbsence = att.some(a => a.date?.startsWith(currentMonth) && a.status === 'absent');
    if (!hasAbsence && att.length > 0) {
      const rec = att.find(a => a.date?.startsWith(currentMonth) && a.employeeId === 5);
      if (rec) {
        rec.status = 'absent';
        rec.timeIn = null;
        rec.timeOut = null;
        this.set('attendance', att);
      }
    }

    // Ensure at least one sample leave request with voluntary salary deduction
    const leaves = this.get('leave_requests') || [];
    const hasSalaryDeductionLeave = leaves.some(l => l.salaryDeduction === true);
    if (!hasSalaryDeductionLeave && leaves.length > 0) {
      const targetLeave = leaves.find(l => l.status === 'pending' || l.status === 'manager_approved') || leaves[0];
      if (targetLeave) {
        targetLeave.salaryDeduction = true;
        targetLeave.deductionDays = targetLeave.days;
        targetLeave.deductionAmount = Math.round(120000 / 30 * targetLeave.days);
        targetLeave.reason = targetLeave.reason + ' (Employee requested salary deduction / LOP)';
        this.set('leave_requests', leaves);
      }
    }
  },

  ensureHierarchyAndCorrections() {
    // 1. Ensure attendance_corrections table exists
    let corrections = this.get('attendance_corrections');
    if (!corrections || !corrections.length) {
      corrections = [
        {
          id: 1,
          employeeId: 4, // Fatima Raza
          date: '2026-09-02',
          type: 'attendance_correction',
          timeIn: '09:05',
          timeOut: '18:15',
          reason: 'Biometric fingerprint scanner glitch at main entrance',
          status: 'pending',
          managerId: 3,
          managerStatus: 'pending',
          managerApprovedAt: null,
          managerRemarks: '',
          hrStatus: 'pending',
          hrApprovedAt: null,
          hrRemarks: '',
          createdAt: '2026-09-02'
        },
        {
          id: 2,
          employeeId: 9, // Tariq Hussain
          date: '2026-09-03',
          type: 'work_from_home',
          timeIn: '09:00',
          timeOut: '18:00',
          reason: 'Severe rain and urban road blockage in Karachi',
          status: 'manager_approved',
          managerId: 3,
          managerStatus: 'approved',
          managerApprovedAt: '2026-09-03T10:30:00Z',
          managerRemarks: 'Approved for remote working day.',
          hrStatus: 'pending',
          hrApprovedAt: null,
          hrRemarks: '',
          createdAt: '2026-09-03'
        },
        {
          id: 3,
          employeeId: 4, // Fatima Raza
          date: '2026-08-25',
          type: 'attendance_correction',
          timeIn: '09:10',
          timeOut: '18:30',
          reason: 'Official off-site client deployment meeting',
          status: 'approved',
          managerId: 3,
          managerStatus: 'approved',
          managerApprovedAt: '2026-08-25T19:00:00Z',
          managerRemarks: 'Verified offsite meeting with client.',
          hrStatus: 'approved',
          hrApprovedAt: '2026-08-26T09:15:00Z',
          hrRemarks: 'Approved and logged in payroll.',
          createdAt: '2026-08-25'
        }
      ];
      this.set('attendance_corrections', corrections);
    }

    // 2. Ensure reporting hierarchy and Deputy Manager's 4 team members
    const emps = this.get('employees') || [];
    let empUpdated = false;

    // A. HR Manager (Sara Malik, ID: 2) reports to Admin (ID: 1)
    const sara = emps.find(e => e.id === 2);
    if (sara) {
      sara.managerId = 1;
      sara.reportingTo = 1;
      sara.adminId = 1;
      sara.reportingChain = [
        { role: 'Executive Administrator', id: 1, name: 'Ahmed Khan', title: 'Super Admin / CEO', level: 1, power: 'Universal Oversight & Executive Authority' }
      ];
      empUpdated = true;
    }

    // B. Deputy Manager (Usman Baig, ID: 3) reports to Admin (ID: 1) AND HR (ID: 2)
    const usman = emps.find(e => e.id === 3);
    if (usman) {
      usman.managerId = 1; // Primary Admin
      usman.hrManagerId = 2; // HR Manager
      usman.reportingTo = 1;
      usman.reportingChain = [
        { role: 'Executive Administrator', id: 1, name: 'Ahmed Khan', title: 'Super Admin / CEO', level: 1, power: 'Executive Oversight & Final Authority' },
        { role: 'Human Resources Manager', id: 2, name: 'Sara Malik', title: 'Head of Human Resources', level: 2, power: 'Corporate HR Authority' }
      ];
      empUpdated = true;
    }

    // C. Exactly 4 employees report to Usman Baig (Deputy Manager)
    const usmanTeamIds = [4, 9, 25, 13]; // Fatima Raza, Tariq Hussain, Sehar Nawaz, Omar Farhan
    emps.forEach(e => {
      if (usmanTeamIds.includes(e.id)) {
        e.managerId = 3; // Deputy Manager
        e.hrManagerId = 2; // HR Manager
        e.adminId = 1; // Super Admin
        e.reportingTo = 3;
        e.reportingChain = [
          { role: 'Direct Reporting Manager', id: 3, name: 'Usman Baig', title: 'Deputy Manager / Tech Lead', level: 1, power: 'First Level Approval (Leaves, Corrections, WFH, Reviews)' },
          { role: 'Human Resources Manager', id: 2, name: 'Sara Malik', title: 'Head of Human Resources', level: 2, power: 'Corporate HR & Final Approval Authority' },
          { role: 'Executive Administrator', id: 1, name: 'Ahmed Khan', title: 'Super Admin / CEO', level: 3, power: 'Universal Oversight & Executive Authority' }
        ];
        empUpdated = true;
      } else if (e.id !== 3 && (e.managerId === 3 || e.reportingTo === 3)) {
        // Any other employee that accidentally had manager 3, assign to manager 1 or 2
        e.managerId = 1;
        e.reportingTo = 1;
        empUpdated = true;
      }

      // Default profile photos
      const defaultPhotos = {
        1: 'assets/avatars/ahmed_khan.jpg',
        2: 'assets/avatars/sara_malik.jpg',
        3: 'assets/avatars/usman_baig.jpg',
        4: 'assets/avatars/fatima_raza.jpg',
        9: 'assets/avatars/tariq_hussain.jpg',
        13: 'assets/avatars/omar_farhan.jpg',
        25: 'assets/avatars/sehar_nawaz.jpg'
      };
      if (!e.photo && defaultPhotos[e.id]) {
        e.photo = defaultPhotos[e.id];
        empUpdated = true;
      }

      // Ensure rich profile fields are populated
      if (!e.lunchSubscription) {
        e.lunchSubscription = {
          subscribed: true,
          plan: 'Standard Lunch (Mon-Fri)',
          cafeteriaPass: `CAF-${String(e.id).padStart(4, '0')}`,
          diet: 'Regular / Halal',
          registeredDate: e.joiningDate || '2023-01-01'
        };
        empUpdated = true;
      }
      if (!e.officeTimings) {
        e.officeTimings = {
          shift: 'General Morning Shift',
          timeIn: '09:00 AM',
          timeOut: '06:00 PM',
          graceTime: '15 Mins',
          workingDays: 'Monday - Friday (5 Days)'
        };
        empUpdated = true;
      }
      if (!e.misInfo) {
        e.misInfo = {
          biometricId: `BIO-${String(1000 + e.id)}`,
          costCenter: `CC-ENG-0${(e.departmentId || 1)}`,
          division: 'Engineering & Operations',
          costCode: `ERP-PK-${String(e.id).padStart(3, '0')}`
        };
        empUpdated = true;
      }
      if (!e.taxInfo) {
        e.taxInfo = {
          ntn: `${4000000 + e.id * 137}-7`,
          taxSlab: 'Slab 2 (5% after basic threshold)',
          filerStatus: 'Active Tax Filer',
          taxExemptions: 'Standard Medical & Conveyance Allowance'
        };
        empUpdated = true;
      }
      if (!e.insuranceDetails) {
        e.insuranceDetails = {
          policyNo: `JUB-CORP-${String(88000 + e.id)}`,
          provider: 'Jubilee Life & Health Insurance',
          tier: (e.role === 'superadmin' || e.role === 'dept_manager' || e.role === 'hr_manager') ? 'Executive Platinum' : 'Corporate Gold',
          coverageLimit: 'PKR 1,500,000 / annum',
          dependentsCovered: e.maritalStatus === 'Married' ? 2 : 0
        };
        empUpdated = true;
      }
      if (!e.dependants || !e.dependants.length) {
        e.dependants = e.maritalStatus === 'Married' ? [
          { name: `${e.lastName || 'Family'} Dependant`, relation: e.gender === 'Male' ? 'Spouse' : 'Spouse', dob: '1992-05-14', cnic: '42201-9988776-1', insured: true }
        ] : [];
        empUpdated = true;
      }
      if (!e.languages || !e.languages.length) {
        e.languages = [
          { language: 'English', proficiency: 'Professional / Fluent' },
          { language: 'Urdu', proficiency: 'Native / Mother Tongue' }
        ];
        empUpdated = true;
      }
      if (!e.technologies || !e.technologies.length) {
        e.technologies = ['JavaScript / TypeScript', 'React', 'Node.js', 'REST APIs', 'SQL Database', 'Git Version Control'];
        empUpdated = true;
      }
      if (!e.nextYearTargets || !e.nextYearTargets.length) {
        e.nextYearTargets = [
          { target: 'Achieve 98% on-time sprint task delivery', metric: 'Sprint Velocity', weight: '40%', timeline: 'Q1-Q4' },
          { target: 'Complete advanced certification in core technology', metric: 'Certification', weight: '30%', timeline: 'Q3' },
          { target: 'Mentor junior team members and conduct code reviews', metric: 'Code Quality', weight: '30%', timeline: 'Ongoing' }
        ];
        empUpdated = true;
      }
      if (!e.pseEvaluation) {
        e.pseEvaluation = {
          jobKnowledge: 4,
          workQuality: 5,
          teamwork: 4,
          punctuality: 4,
          leadership: 4,
          overallScore: '4.2 / 5.0',
          managerComments: 'Consistent high performer with strong initiative and collaborative team mindset.',
          employeeComments: 'Striving to take on higher architectural responsibility and streamline build pipelines.',
          evaluatedBy: 'Usman Baig (Deputy Manager)',
          evaluatedDate: '2026-08-30'
        };
        empUpdated = true;
      }
    });

    if (empUpdated) {
      this.set('employees', emps);
    }
  },

  ensureDocumentExpiries() {
    let docs = this.get('document_expiries');
    if (!docs || !docs.length) {
      docs = [
        {
          id: 1, employeeId: 1, docType: 'Passport', docNumber: 'PK-7788991',
          issueDate: '2020-01-10', expiryDate: '2030-01-09',
          issuingAuthority: 'Directorate of Passports PK',
          notes: 'Official executive diplomatic passport', status: 'active'
        },
        {
          id: 2, employeeId: 1, docType: 'CNIC', docNumber: '42201-1234567-1',
          issueDate: '2018-05-15', expiryDate: '2028-05-14',
          issuingAuthority: 'NADRA Karachi',
          notes: 'Smart National Identity Card', status: 'active'
        },
        {
          id: 3, employeeId: 2, docType: 'CNIC', docNumber: '42201-2345678-2',
          issueDate: '2016-10-19', expiryDate: '2026-10-18',
          issuingAuthority: 'NADRA Clifton',
          notes: 'Expiring in under 45 days. Renewal reminder queued.', status: 'expiring_soon'
        },
        {
          id: 4, employeeId: 2, docType: 'Passport', docNumber: 'PK-9922110',
          issueDate: '2019-02-14', expiryDate: '2029-02-13',
          issuingAuthority: 'Directorate of Passports PK',
          notes: 'Standard 36-page booklet', status: 'active'
        },
        {
          id: 5, employeeId: 3, docType: 'Driving License', docNumber: 'SINDH-KHI-88990',
          issueDate: '2021-09-25', expiryDate: '2026-09-24',
          issuingAuthority: 'Traffic Police Sindh (Clifton Branch)',
          notes: 'Motor Car / LTV License. CRITICAL: Expiring in under 20 days!', status: 'urgent'
        },
        {
          id: 6, employeeId: 3, docType: 'CNIC', docNumber: '42201-3456789-3',
          issueDate: '2017-11-10', expiryDate: '2027-11-09',
          issuingAuthority: 'NADRA Defence',
          notes: 'Verified biometric chip card', status: 'active'
        },
        {
          id: 7, employeeId: 4, docType: 'Passport', docNumber: 'PK-3344552',
          issueDate: '2021-09-21', expiryDate: '2026-09-20',
          issuingAuthority: 'Directorate of Passports PK',
          notes: 'Urgent renewal required for scheduled international client training', status: 'urgent'
        },
        {
          id: 8, employeeId: 4, docType: 'CNIC', docNumber: '42201-4567890-4',
          issueDate: '2019-05-30', expiryDate: '2029-05-29',
          issuingAuthority: 'NADRA Bahria',
          notes: 'National Identity Card', status: 'active'
        },
        {
          id: 9, employeeId: 7, docType: 'CNIC', docNumber: '42201-7890123-7',
          issueDate: '2016-04-14', expiryDate: '2026-04-13',
          issuingAuthority: 'NADRA Nazimabad',
          notes: 'OVERDUE: Expired 5 months ago! Urgent replacement required.', status: 'expired'
        },
        {
          id: 10, employeeId: 7, docType: 'Medical Fitness', docNumber: 'MED-FIT-2025-08',
          issueDate: '2025-08-01', expiryDate: '2026-08-01',
          issuingAuthority: 'Civil Hospital Karachi Diagnostic Center',
          notes: 'Annual mandatory medical certificate expired.', status: 'expired'
        },
        {
          id: 11, employeeId: 9, docType: 'Visa / Work Permit', docNumber: 'UAE-WP-99881',
          issueDate: '2024-10-31', expiryDate: '2026-10-30',
          issuingAuthority: 'Ministry of Human Resources & Emiratisation (MOHRE)',
          notes: 'Expiring in under 55 days. Extension paperwork initiated.', status: 'expiring_soon'
        },
        {
          id: 12, employeeId: 13, docType: 'Driving License', docNumber: 'ICT-ISB-44551',
          issueDate: '2022-04-10', expiryDate: '2027-04-09',
          issuingAuthority: 'Islamabad Traffic Police (ITP)',
          notes: 'Valid commercial and private driver license', status: 'active'
        },
        {
          id: 13, employeeId: 25, docType: 'CNIC', docNumber: '42201-7788902-1',
          issueDate: '2021-02-15', expiryDate: '2031-02-14',
          issuingAuthority: 'NADRA FB Area',
          notes: 'Valid for next 5 years', status: 'active'
        }
      ];
      this.set('document_expiries', docs);
    }
  },

  ensureExitClearances() {
    let clearances = this.get('exit_clearances');
    if (!clearances || !clearances.length) {
      clearances = [
        {
          id: 1,
          employeeId: 11, // Kamran Ali (Ex-employee)
          resignationDate: '2024-03-01',
          lastWorkingDay: '2024-03-31',
          noticePeriodDays: 30,
          reason: 'Personal Relocation to Islamabad & Higher Education',
          status: 'completed',
          departments: {
            it: {
              cleared: true, clearedBy: 'Usman Baig (Tech Lead)', clearedDate: '2024-03-29',
              remarks: 'Dell Latitude laptop, charger & monitor returned in good condition. Email and GitHub disabled.',
              items: [
                { name: 'Laptop & Charger Returned', done: true },
                { name: 'Email & Cloud Accounts Deactivated', done: true },
                { name: 'Source Code & VPN Access Revoked', done: true }
              ]
            },
            admin: {
              cleared: true, clearedBy: 'Amna Sheikh (Operations)', clearedDate: '2024-03-30',
              remarks: 'RFID Access card returned. Locker 14 inspected and cleared. Cafeteria pass cancelled.',
              items: [
                { name: 'Building Access Card Handed In', done: true },
                { name: 'Locker Keys Returned & Cleared', done: true },
                { name: 'Cafeteria Card Deactivated', done: true }
              ]
            },
            finance: {
              cleared: true, clearedBy: 'Bilal Ahmed (Finance Manager)', clearedDate: '2024-03-30',
              remarks: 'Zero loan balance outstanding. Petty cash advance of PKR 4,500 settled with receipts.',
              items: [
                { name: 'Company Loan Balances Settled', done: true },
                { name: 'Petty Cash Advances Reconciled', done: true },
                { name: 'Corporate Fuel/Credit Card Revoked', done: true }
              ]
            },
            hr: {
              cleared: true, clearedBy: 'Sara Malik (HR Head)', clearedDate: '2024-03-31',
              remarks: 'Exit interview conducted. Handover documentation signed. Experience and relieving letters issued.',
              items: [
                { name: 'Exit Interview Completed', done: true },
                { name: 'Health Insurance Cards Returned', done: true },
                { name: 'Handover Document Signed by Supervisor', done: true },
                { name: 'Final F&F Settlement Statement Approved', done: true }
              ]
            }
          },
          settlement: {
            basicSalary: 80000,
            workedDays: 31,
            unpaidSalary: 80000,
            leaveBalanceDays: 12,
            leaveEncashmentAmount: 32000, // (80000/30)*12
            gratuityYears: 5,
            gratuityAmount: 400000, // 80000*5
            noticeShortfallDays: 0,
            noticeDeduction: 0,
            loanDeduction: 0,
            otherDeductions: 0,
            netPayable: 512000,
            paymentStatus: 'paid',
            paidDate: '2024-04-05',
            chequeNo: 'HBL-PAY-992140'
          }
        },
        {
          id: 2,
          employeeId: 7, // Hassan Qureshi
          resignationDate: '2026-08-25',
          lastWorkingDay: '2026-09-25',
          noticePeriodDays: 30,
          reason: 'Career Advancement / Accepted Overseas Senior Role in Dubai',
          status: 'in_progress',
          departments: {
            it: {
              cleared: true, clearedBy: 'Usman Baig (Tech Lead)', clearedDate: '2026-09-02',
              remarks: 'Hardware inspection scheduled. Backup of project files completed.',
              items: [
                { name: 'Laptop & Charger Returned', done: false },
                { name: 'Email & Cloud Accounts Scheduled Deactivation', done: true },
                { name: 'Source Code & VPN Access Revoked', done: false }
              ]
            },
            admin: {
              cleared: false, clearedBy: '', clearedDate: '',
              remarks: 'Awaiting badge and cabinet keys return on last working day.',
              items: [
                { name: 'Building Access Card Handed In', done: false },
                { name: 'Locker Keys Returned & Cleared', done: false },
                { name: 'Cafeteria Card Deactivated', done: false }
              ]
            },
            finance: {
              cleared: true, clearedBy: 'Bilal Ahmed (Finance Manager)', clearedDate: '2026-09-04',
              remarks: 'No active loans or travel advances pending.',
              items: [
                { name: 'Company Loan Balances Settled', done: true },
                { name: 'Petty Cash Advances Reconciled', done: true },
                { name: 'Corporate Fuel/Credit Card Revoked', done: true }
              ]
            },
            hr: {
              cleared: false, clearedBy: '', clearedDate: '',
              remarks: 'Exit interview scheduled for 2026-09-22. Knowledge transfer in progress.',
              items: [
                { name: 'Exit Interview Completed', done: false },
                { name: 'Health Insurance Cards Returned', done: false },
                { name: 'Handover Document Signed by Supervisor', done: true },
                { name: 'Final F&F Settlement Statement Approved', done: false }
              ]
            }
          },
          settlement: {
            basicSalary: 75000,
            workedDays: 25,
            unpaidSalary: 62500, // (75000/30)*25
            leaveBalanceDays: 8,
            leaveEncashmentAmount: 20000, // (75000/30)*8
            gratuityYears: 6,
            gratuityAmount: 450000, // 75000*6
            noticeShortfallDays: 0,
            noticeDeduction: 0,
            loanDeduction: 0,
            otherDeductions: 0,
            netPayable: 532500,
            paymentStatus: 'pending',
            paidDate: null,
            chequeNo: ''
          }
        }
      ];
      this.set('exit_clearances', clearances);
    }
  },

  ensureHRLetters() {
    let letters = this.get('hr_letters');
    if (!letters || !letters.length) {
      letters = [
        {
          id: 1,
          refNo: 'HRM/EXP/2024/001',
          employeeId: 11,
          templateType: 'experience',
          title: 'Experience & Service Certificate',
          recipient: 'To Whom It May Concern',
          issueDate: '2024-04-05',
          issuedBy: 'Sara Malik (Head of HR)',
          purpose: 'Official proof of employment & service tenure',
          content: 'This is to certify that Mr. Kamran Ali was employed with HRM Pro as Software Engineer from June 1, 2018 to March 31, 2024.'
        },
        {
          id: 2,
          refNo: 'HRM/SAL/2026/014',
          employeeId: 4,
          templateType: 'salary_certificate',
          title: 'Salary Verification & Employment Certificate',
          recipient: 'The Visa Officer, British High Commission, Islamabad',
          issueDate: '2026-08-15',
          issuedBy: 'Sara Malik (Head of HR)',
          purpose: 'United Kingdom Standard Visitor Visa Application',
          content: 'This certificate verifies that Ms. Fatima Raza is currently employed as Software Engineer earning a gross salary of PKR 85,000 per month.'
        },
        {
          id: 3,
          refNo: 'HRM/CONF/2019/008',
          employeeId: 3,
          templateType: 'confirmation',
          title: 'Official Employment Confirmation Letter',
          recipient: 'Mr. Usman Baig',
          issueDate: '2019-09-15',
          issuedBy: 'Ahmed Khan (Super Admin / CEO)',
          purpose: 'Completion of 3-Month Probationary Period',
          content: 'We are pleased to confirm your appointment as Deputy Manager / Lead Software Engineer effective September 15, 2019.'
        }
      ];
      this.set('hr_letters', letters);
    }
  },

  reset() {
    Object.keys(localStorage).filter(k => k.startsWith('hrm_')).forEach(k => localStorage.removeItem(k));
    this.seed();
    localStorage.setItem('hrm_initialized', '1');
  },

  seed() {
    this.set('departments', departments);
    this.set('designations', designations);
    this.set('branches', branches);
    this.set('shifts', shifts);
    this.set('locations', locations);
    this.set('employees', employees);
    this.set('attendance', attendance);
    this.set('attendance_logs', attendanceLogs);
    this.set('leave_requests', leaveRequests);
    this.set('leave_balances', leaveBalances);
    this.set('leave_types', leaveTypes);
    this.set('holidays', holidays);
    this.set('salary', salaryRecords);
    this.set('allowances', allowances);
    this.set('deductions', deductions);
    this.set('performance_reviews', performanceReviews);
    this.set('kpis', kpis);
    this.set('recruitment', recruitmentJobs);
    this.set('applications', applications);
    this.set('events', events);
    this.set('announcements', announcements);
    this.set('audit_logs', auditLogs);
    this.set('roles', roles);
    this.set('permissions', permissions);
    this.set('users', users);
    this.set('assets', assets);
    this.set('trainings', trainings);
    this.set('promotions', promotions);
    this.set('transfers', transfers);
    this.set('skills', skills);
    this.set('banks', banks);
    this.set('salary_grades', salaryGrades);
    this.set('job_titles', jobTitles);
    this.set('projects', projects);
    this.set('teams', teams);
    this.set('loans', loans);
    this.set('documents', documents);
    this.set('notes', notes);
    this.set('dependents', dependentsList);
    this.set('exit_records', exitRecords);
    this.set('goals', goals);
    this.set('offer_letters', offerLetters);
    this.set('attendance_corrections', attendanceCorrections);
  },

  get(key) {
    try { return JSON.parse(localStorage.getItem(`hrm_${key}`)) || []; }
    catch { return []; }
  },

  set(key, val) {
    localStorage.setItem(`hrm_${key}`, JSON.stringify(val));
  },

  getObj(key) {
    try { return JSON.parse(localStorage.getItem(`hrm_${key}`)) || {}; }
    catch { return {}; }
  },

  add(key, item) {
    const arr = this.get(key);
    arr.push(item);
    this.set(key, arr);
    return item;
  },

  update(key, id, updates) {
    const arr = this.get(key);
    const idx = arr.findIndex(x => x.id === id);
    if (idx !== -1) { arr[idx] = { ...arr[idx], ...updates }; this.set(key, arr); return arr[idx]; }
    return null;
  },

  delete(key, id) {
    const arr = this.get(key).filter(x => x.id !== id);
    this.set(key, arr);
  },

  find(key, id) { return this.get(key).find(x => x.id === id) || null; },

  nextId(key) {
    const arr = this.get(key);
    return arr.length > 0 ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1;
  },

  log(action, module, details, userId) {
    const logs = this.get('audit_logs');
    logs.unshift({ id: Date.now(), action, module, details, userId, timestamp: new Date().toISOString() });
    if (logs.length > 300) logs.pop();
    this.set('audit_logs', logs);
    if (typeof App !== 'undefined' && App.refreshHistoryDrawer) {
      App.refreshHistoryDrawer();
    }
  },

  deleteLog(id) {
    let logs = this.get('audit_logs');
    logs = logs.filter(l => l.id !== Number(id));
    this.set('audit_logs', logs);
    return logs;
  },

  clearLogs() {
    this.set('audit_logs', []);
    return [];
  }
};

// ============================================================
// SEED DATA
// ============================================================

const departments = [
  { id: 1, name: 'Human Resources', code: 'HR', headId: 2, employeeCount: 5, status: 'active' },
  { id: 2, name: 'Information Technology', code: 'IT', headId: 3, employeeCount: 8, status: 'active' },
  { id: 3, name: 'Finance & Accounting', code: 'FIN', headId: 5, employeeCount: 6, status: 'active' },
  { id: 4, name: 'Sales & Marketing', code: 'MKT', headId: 8, employeeCount: 10, status: 'active' },
  { id: 5, name: 'Operations', code: 'OPS', headId: 10, employeeCount: 7, status: 'active' },
  { id: 6, name: 'Administration', code: 'ADM', headId: 12, employeeCount: 4, status: 'active' },
  { id: 7, name: 'Legal', code: 'LGL', headId: 14, employeeCount: 3, status: 'active' },
  { id: 8, name: 'Customer Support', code: 'CS', headId: 16, employeeCount: 9, status: 'active' },
];

const designations = [
  { id: 1, name: 'CEO', departmentId: 6, level: 'C-Level', status: 'active' },
  { id: 2, name: 'HR Manager', departmentId: 1, level: 'Manager', status: 'active' },
  { id: 3, name: 'Software Engineer', departmentId: 2, level: 'Mid', status: 'active' },
  { id: 4, name: 'Deputy Manager / Tech Lead', departmentId: 2, level: 'Manager', status: 'active' },
  { id: 5, name: 'Finance Manager', departmentId: 3, level: 'Manager', status: 'active' },
  { id: 6, name: 'Accountant', departmentId: 3, level: 'Mid', status: 'active' },
  { id: 7, name: 'Sales Executive', departmentId: 4, level: 'Junior', status: 'active' },
  { id: 8, name: 'Marketing Manager', departmentId: 4, level: 'Manager', status: 'active' },
  { id: 9, name: 'Operations Manager', departmentId: 5, level: 'Manager', status: 'active' },
  { id: 10, name: 'HR Executive', departmentId: 1, level: 'Junior', status: 'active' },
  { id: 11, name: 'UI/UX Designer', departmentId: 2, level: 'Mid', status: 'active' },
  { id: 12, name: 'Project Manager', departmentId: 2, level: 'Senior', status: 'active' },
  { id: 13, name: 'Customer Support Rep', departmentId: 8, level: 'Junior', status: 'active' },
];

const branches = [
  { id: 1, name: 'Head Office', city: 'Karachi', address: 'Plot 12, Block B, PECHS', status: 'active' },
  { id: 2, name: 'Lahore Branch', city: 'Lahore', address: 'Gulberg III, Lahore', status: 'active' },
  { id: 3, name: 'Islamabad Branch', city: 'Islamabad', address: 'Blue Area, F-7', status: 'active' },
];

const shifts = [
  { id: 1, name: 'Morning', startTime: '09:00', endTime: '18:00', gracePeriod: 15, timeInWindowStart: '10:00', timeInWindowEnd: '11:00', status: 'active' },
  { id: 2, name: 'Evening', startTime: '14:00', endTime: '22:00', gracePeriod: 15, timeInWindowStart: '14:00', timeInWindowEnd: '15:00', status: 'active' },
  { id: 3, name: 'Night', startTime: '22:00', endTime: '06:00', gracePeriod: 15, timeInWindowStart: '22:00', timeInWindowEnd: '23:00', status: 'active' },
  { id: 4, name: 'Flexible', startTime: '08:00', endTime: '17:00', gracePeriod: 30, timeInWindowStart: '08:00', timeInWindowEnd: '11:00', status: 'active' },
];

const locations = [
  { id: 1, name: 'Karachi', country: 'Pakistan', status: 'active' },
  { id: 2, name: 'Lahore', country: 'Pakistan', status: 'active' },
  { id: 3, name: 'Islamabad', country: 'Pakistan', status: 'active' },
];

const employees = [
  {
    id: 1, empNo: 'EMP-001', firstName: 'Ahmed', lastName: 'Khan', fullName: 'Ahmed Khan',
    email: 'ahmed.khan@company.com', phone: '0300-1234567', cnic: '42201-1234567-1',
    dob: '1985-03-15', gender: 'Male', maritalStatus: 'Married',
    address: 'House 12, Block 5, Gulshan-e-Iqbal, Karachi',
    departmentId: 6, designationId: 1, branchId: 1, shiftId: 1,
    joiningDate: '2015-01-01', confirmationDate: '2015-04-01',
    employmentType: 'Permanent', status: 'active', role: 'superadmin',
    salary: 350000, photo: 'assets/avatars/ahmed_khan.jpg', managerId: null, reportingTo: null,
    bloodGroup: 'O+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '1234567890123', iban: 'PK36HABB0000001123456702',
    emergencyContact: { name: 'Fatima Khan', relation: 'Wife', phone: '0300-9876543' },
    qualifications: [{ degree: 'MBA', institution: 'IBA Karachi', year: '2010', grade: 'A' }],
    experience: [{ company: 'XYZ Corp', designation: 'Manager', from: '2010', to: '2014' }],
  },
  {
    id: 2, empNo: 'EMP-002', firstName: 'Sara', lastName: 'Malik', fullName: 'Sara Malik',
    email: 'sara.malik@company.com', phone: '0321-2345678', cnic: '42201-2345678-2',
    dob: '1990-07-22', gender: 'Female', maritalStatus: 'Single',
    address: 'Flat 5A, Block C, Clifton, Karachi',
    departmentId: 1, designationId: 2, branchId: 1, shiftId: 1,
    joiningDate: '2018-03-01', confirmationDate: '2018-06-01',
    employmentType: 'Permanent', status: 'active', role: 'hr_manager',
    salary: 120000, photo: 'assets/avatars/sara_malik.jpg', managerId: 1, reportingTo: 1,
    bloodGroup: 'A+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '9876543210123', iban: 'PK36MUCB0000001123456702',
    emergencyContact: { name: 'Ali Malik', relation: 'Brother', phone: '0321-7654321' },
    qualifications: [{ degree: 'BBA', institution: 'Karachi University', year: '2012', grade: 'B+' }],
    experience: [],
  },
  {
    id: 3, empNo: 'EMP-003', firstName: 'Usman', lastName: 'Baig', fullName: 'Usman Baig',
    email: 'usman.baig@company.com', phone: '0333-3456789', cnic: '42201-3456789-3',
    dob: '1988-11-10', gender: 'Male', maritalStatus: 'Married',
    address: 'House 45, DHA Phase 4, Karachi',
    departmentId: 2, designationId: 4, branchId: 1, shiftId: 1,
    joiningDate: '2019-06-15', confirmationDate: '2019-09-15',
    employmentType: 'Permanent', status: 'active', role: 'dept_manager',
    salary: 150000, photo: 'assets/avatars/usman_baig.jpg', managerId: 1, reportingTo: 2,
    bloodGroup: 'B+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'UBL', accountNo: '1122334455667', iban: 'PK36UNIL0000001123456702',
    emergencyContact: { name: 'Asma Baig', relation: 'Wife', phone: '0333-5678901' },
    qualifications: [{ degree: 'BS Computer Science', institution: 'FAST NUCES', year: '2010', grade: 'A' }],
    experience: [{ company: 'TechCo', designation: 'Developer', from: '2010', to: '2019' }],
  },
  {
    id: 4, empNo: 'EMP-004', firstName: 'Fatima', lastName: 'Raza', fullName: 'Fatima Raza',
    email: 'fatima.raza@company.com', phone: '0345-4567890', cnic: '42201-4567890-4',
    dob: '1995-05-30', gender: 'Female', maritalStatus: 'Single',
    address: 'Apartment 3B, Bahria Town, Karachi',
    departmentId: 2, designationId: 3, branchId: 1, shiftId: 1,
    joiningDate: '2021-02-01', confirmationDate: '2021-05-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 85000, photo: 'assets/avatars/fatima_raza.jpg', managerId: 3, reportingTo: 3,
    bloodGroup: 'AB+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '5566778899001', iban: 'PK36HABB0000005566778899',
    emergencyContact: { name: 'Raza Ali', relation: 'Father', phone: '0345-1234567' },
    qualifications: [{ degree: 'BS Software Engineering', institution: 'NED University', year: '2017', grade: 'A-' }],
    experience: [],
  },
  {
    id: 5, empNo: 'EMP-005', firstName: 'Bilal', lastName: 'Ahmed', fullName: 'Bilal Ahmed',
    email: 'bilal.ahmed@company.com', phone: '0311-5678901', cnic: '42201-5678901-5',
    dob: '1982-09-18', gender: 'Male', maritalStatus: 'Married',
    address: 'House 78, PECHS Block 2, Karachi',
    departmentId: 3, designationId: 5, branchId: 1, shiftId: 1,
    joiningDate: '2016-08-15', confirmationDate: '2016-11-15',
    employmentType: 'Permanent', status: 'active', role: 'dept_manager',
    salary: 130000, photo: null, managerId: 1, reportingTo: 1,
    bloodGroup: 'O-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '7788990011223', iban: 'PK36MUCB0000007788990011',
    emergencyContact: { name: 'Zara Ahmed', relation: 'Wife', phone: '0311-9012345' },
    qualifications: [{ degree: 'M.Com', institution: 'Karachi University', year: '2005', grade: 'A' }],
    experience: [{ company: 'ABC Finance', designation: 'Accountant', from: '2005', to: '2016' }],
  },
  {
    id: 6, empNo: 'EMP-006', firstName: 'Zara', lastName: 'Siddiqui', fullName: 'Zara Siddiqui',
    email: 'zara.siddiqui@company.com', phone: '0322-6789012', cnic: '42201-6789012-6',
    dob: '1993-12-05', gender: 'Female', maritalStatus: 'Single',
    address: 'House 22, Block 14, Federal B Area, Karachi',
    departmentId: 1, designationId: 10, branchId: 1, shiftId: 1,
    joiningDate: '2022-01-10', confirmationDate: '2022-04-10',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 65000, photo: null, managerId: 2, reportingTo: 2,
    bloodGroup: 'A-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'UBL', accountNo: '3344556677889', iban: 'PK36UNIL0000003344556677',
    emergencyContact: { name: 'Imran Siddiqui', relation: 'Father', phone: '0322-1234567' },
    qualifications: [{ degree: 'BBA-HR', institution: 'Bahria University', year: '2015', grade: 'B+' }],
    experience: [],
  },
  {
    id: 7, empNo: 'EMP-007', firstName: 'Hassan', lastName: 'Qureshi', fullName: 'Hassan Qureshi',
    email: 'hassan.qureshi@company.com', phone: '0334-7890123', cnic: '42201-7890123-7',
    dob: '1991-04-14', gender: 'Male', maritalStatus: 'Married',
    address: 'House 56, North Nazimabad, Block H, Karachi',
    departmentId: 4, designationId: 7, branchId: 1, shiftId: 1,
    joiningDate: '2020-05-20', confirmationDate: '2020-08-20',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 75000, photo: null, managerId: 8, reportingTo: 8,
    bloodGroup: 'B-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '9900112233445', iban: 'PK36HABB0000009900112233',
    emergencyContact: { name: 'Nadia Qureshi', relation: 'Wife', phone: '0334-2345678' },
    qualifications: [{ degree: 'BBA', institution: 'IoBM', year: '2013', grade: 'B' }],
    experience: [],
  },
  {
    id: 8, empNo: 'EMP-008', firstName: 'Nadia', lastName: 'Farooq', fullName: 'Nadia Farooq',
    email: 'nadia.farooq@company.com', phone: '0313-8901234', cnic: '42201-8901234-8',
    dob: '1987-08-25', gender: 'Female', maritalStatus: 'Married',
    address: 'House 34, Gulshan-e-Hadeed Phase 2, Karachi',
    departmentId: 4, designationId: 8, branchId: 1, shiftId: 1,
    joiningDate: '2017-11-01', confirmationDate: '2018-02-01',
    employmentType: 'Permanent', status: 'active', role: 'dept_manager',
    salary: 140000, photo: null, managerId: 1, reportingTo: 1,
    bloodGroup: 'O+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '5544332211009', iban: 'PK36MUCB0000005544332211',
    emergencyContact: { name: 'Tariq Farooq', relation: 'Husband', phone: '0313-3456789' },
    qualifications: [{ degree: 'MBA Marketing', institution: 'LUMS', year: '2009', grade: 'A' }],
    experience: [{ company: 'MediaCo', designation: 'Brand Manager', from: '2009', to: '2017' }],
  },
  {
    id: 9, empNo: 'EMP-009', firstName: 'Tariq', lastName: 'Hussain', fullName: 'Tariq Hussain',
    email: 'tariq.hussain@company.com', phone: '0341-9012345', cnic: '42201-9012345-9',
    dob: '1989-02-28', gender: 'Male', maritalStatus: 'Single',
    address: 'Room 12, Block 7, Liaquatabad, Karachi',
    departmentId: 2, designationId: 11, branchId: 1, shiftId: 1,
    joiningDate: '2021-09-01', confirmationDate: '2021-12-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 90000, photo: 'assets/avatars/tariq_hussain.jpg', managerId: 3, reportingTo: 3,
    bloodGroup: 'AB-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'UBL', accountNo: '6677889900112', iban: 'PK36UNIL0000006677889900',
    emergencyContact: { name: 'Imran Hussain', relation: 'Father', phone: '0341-4567890' },
    qualifications: [{ degree: 'BS Design', institution: 'Indus Valley', year: '2011', grade: 'A' }],
    experience: [{ company: 'DesignStudio', designation: 'Designer', from: '2011', to: '2021' }],
  },
  {
    id: 10, empNo: 'EMP-010', firstName: 'Amna', lastName: 'Sheikh', fullName: 'Amna Sheikh',
    email: 'amna.sheikh@company.com', phone: '0301-0123456', cnic: '42201-0123456-0',
    dob: '1992-06-17', gender: 'Female', maritalStatus: 'Married',
    address: 'House 89, Block 11, Gulistan-e-Jauhar, Karachi',
    departmentId: 5, designationId: 9, branchId: 1, shiftId: 1,
    joiningDate: '2019-04-01', confirmationDate: '2019-07-01',
    employmentType: 'Permanent', status: 'active', role: 'dept_manager',
    salary: 125000, photo: null, managerId: 1, reportingTo: 1,
    bloodGroup: 'A+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '2233445566778', iban: 'PK36HABB0000002233445566',
    emergencyContact: { name: 'Khalid Sheikh', relation: 'Husband', phone: '0301-5678901' },
    qualifications: [{ degree: 'MBA Operations', institution: 'IBA', year: '2014', grade: 'A-' }],
    experience: [],
  },
  // Ex-employees
  {
    id: 11, empNo: 'EMP-011', firstName: 'Kamran', lastName: 'Ali', fullName: 'Kamran Ali',
    email: 'kamran.ali@company.com', phone: '0308-1122334', cnic: '42201-1122334-1',
    dob: '1984-10-20', gender: 'Male', maritalStatus: 'Married',
    address: 'House 34, Johar Town, Lahore',
    departmentId: 2, designationId: 3, branchId: 2, shiftId: 1,
    joiningDate: '2018-06-01', confirmationDate: '2018-09-01', exitDate: '2024-03-31',
    employmentType: 'Permanent', status: 'inactive', role: 'employee',
    salary: 80000, photo: null, managerId: 3, reportingTo: 3,
    bloodGroup: 'B+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '1234567890124', iban: 'PK36HABB0000001234567890',
    emergencyContact: { name: 'Rukhsana Ali', relation: 'Wife', phone: '0308-4455667' },
    qualifications: [], experience: [],
  },
  // New joiners
  {
    id: 12, empNo: 'EMP-012', firstName: 'Rabia', lastName: 'Nawaz', fullName: 'Rabia Nawaz',
    email: 'rabia.nawaz@company.com', phone: '0323-2233445', cnic: '42201-2233445-2',
    dob: '1998-01-12', gender: 'Female', maritalStatus: 'Single',
    address: 'Flat 2, DHA Phase 6, Lahore',
    departmentId: 1, designationId: 10, branchId: 2, shiftId: 1,
    joiningDate: '2026-08-01', confirmationDate: null,
    employmentType: 'Probation', status: 'active', role: 'employee',
    salary: 55000, photo: null, managerId: 2, reportingTo: 2,
    bloodGroup: 'O+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '9988776655443', iban: 'PK36MUCB0000009988776655',
    emergencyContact: { name: 'Nawaz Ahmad', relation: 'Father', phone: '0323-3344556' },
    qualifications: [{ degree: 'BSBA', institution: 'Punjab University', year: '2020', grade: 'B+' }],
    experience: [],
  },
  {
    id: 16, empNo: 'EMP-016', firstName: 'Ayesha', lastName: 'Zafar', fullName: 'Ayesha Zafar',
    email: 'ayesha.zafar@company.com', phone: '0312-1234567', cnic: '42201-1234568-1',
    dob: '1993-02-14', gender: 'Female', maritalStatus: 'Single',
    address: 'Apartment 7C, Defence View, Karachi',
    departmentId: 8, designationId: 13, branchId: 1, shiftId: 1,
    joiningDate: '2024-01-15', confirmationDate: '2024-04-15',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 62000, photo: null, managerId: null, reportingTo: null,
    bloodGroup: 'A+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '1111222233334', iban: 'PK36MUCB0000001111222233',
    emergencyContact: { name: 'Zafar Ahmed', relation: 'Father', phone: '0312-9876543' },
    qualifications: [{ degree: 'BBA', institution: 'Bahria University', year: '2015', grade: 'B' }],
    experience: [{ company: 'CallCo', designation: 'CSR', from: '2015', to: '2023' }],
  },
  {
    id: 17, empNo: 'EMP-017', firstName: 'Faisal', lastName: 'Mahmood', fullName: 'Faisal Mahmood',
    email: 'faisal.mahmood@company.com', phone: '0323-9876543', cnic: '42201-9876543-1',
    dob: '1990-08-05', gender: 'Male', maritalStatus: 'Married',
    address: 'House 23, Gulberg, Lahore',
    departmentId: 3, designationId: 6, branchId: 2, shiftId: 1,
    joiningDate: '2022-05-01', confirmationDate: '2022-08-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 78000, photo: null, managerId: 5, reportingTo: 5,
    bloodGroup: 'O+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'UBL', accountNo: '2222333344445', iban: 'PK36UNIL0000002222333344',
    emergencyContact: { name: 'Sana Mahmood', relation: 'Wife', phone: '0323-1234567' },
    qualifications: [{ degree: 'M.Com', institution: 'Punjab University', year: '2012', grade: 'B+' }],
    experience: [{ company: 'AuditFirm', designation: 'Auditor', from: '2012', to: '2022' }],
  },
  {
    id: 18, empNo: 'EMP-018', firstName: 'Hina', lastName: 'Pervaiz', fullName: 'Hina Pervaiz',
    email: 'hina.pervaiz@company.com', phone: '0333-5544332', cnic: '42201-5544332-1',
    dob: '1996-11-22', gender: 'Female', maritalStatus: 'Single',
    address: 'Flat 4B, I-8 Islamabad',
    departmentId: 1, designationId: 10, branchId: 3, shiftId: 1,
    joiningDate: '2025-03-01', confirmationDate: '2025-06-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 58000, photo: null, managerId: 2, reportingTo: 2,
    bloodGroup: 'B-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '3333444455556', iban: 'PK36HABB0000003333444455',
    emergencyContact: { name: 'Pervaiz Ahmed', relation: 'Father', phone: '0333-6655443' },
    qualifications: [{ degree: 'MBA-HR', institution: 'FAST NUCES', year: '2018', grade: 'A-' }],
    experience: [],
  },
  {
    id: 19, empNo: 'EMP-019', firstName: 'Junaid', lastName: 'Alam', fullName: 'Junaid Alam',
    email: 'junaid.alam@company.com', phone: '0311-7766554', cnic: '42201-7766554-1',
    dob: '1988-06-30', gender: 'Male', maritalStatus: 'Married',
    address: 'House 56, Model Town, Lahore',
    departmentId: 4, designationId: 7, branchId: 2, shiftId: 1,
    joiningDate: '2020-02-15', confirmationDate: '2020-05-15',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 73000, photo: null, managerId: 8, reportingTo: 8,
    bloodGroup: 'AB+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '4444555566667', iban: 'PK36MUCB0000004444555566',
    emergencyContact: { name: 'Nida Alam', relation: 'Wife', phone: '0311-8877665' },
    qualifications: [{ degree: 'MBA Marketing', institution: 'UMT', year: '2010', grade: 'B' }],
    experience: [{ company: 'SalesCo', designation: 'Sales Rep', from: '2010', to: '2020' }],
  },
  {
    id: 20, empNo: 'EMP-020', firstName: 'Kiran', lastName: 'Iqbal', fullName: 'Kiran Iqbal',
    email: 'kiran.iqbal@company.com', phone: '0345-8877665', cnic: '42201-8877665-1',
    dob: '1994-04-18', gender: 'Female', maritalStatus: 'Single',
    address: 'Flat 12, Clifton Block 9, Karachi',
    departmentId: 5, designationId: 9, branchId: 1, shiftId: 1,
    joiningDate: '2023-08-01', confirmationDate: '2023-11-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 68000, photo: null, managerId: 10, reportingTo: 10,
    bloodGroup: 'O-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'UBL', accountNo: '5555666677778', iban: 'PK36UNIL0000005555666677',
    emergencyContact: { name: 'Iqbal Hussain', relation: 'Father', phone: '0345-9988776' },
    qualifications: [{ degree: 'BS Operations', institution: 'IBA', year: '2016', grade: 'A' }],
    experience: [],
  },
  {
    id: 21, empNo: 'EMP-021', firstName: 'Mohsin', lastName: 'Raza', fullName: 'Mohsin Raza',
    email: 'mohsin.raza@company.com', phone: '0341-2233445', cnic: '42201-2233446-1',
    dob: '1991-09-12', gender: 'Male', maritalStatus: 'Married',
    address: 'House 78, Satellite Town, Rawalpindi',
    departmentId: 2, designationId: 3, branchId: 3, shiftId: 1,
    joiningDate: '2024-04-01', confirmationDate: null,
    employmentType: 'Probation', status: 'active', role: 'employee',
    salary: 75000, photo: null, managerId: 3, reportingTo: 3,
    bloodGroup: 'A-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '6666777788889', iban: 'PK36HABB0000006666777788',
    emergencyContact: { name: 'Rubab Raza', relation: 'Wife', phone: '0341-3344556' },
    qualifications: [{ degree: 'BS CS', institution: 'COMSATS', year: '2013', grade: 'A' }],
    experience: [{ company: 'WebTech', designation: 'Developer', from: '2013', to: '2024' }],
  },
  {
    id: 22, empNo: 'EMP-022', firstName: 'Lubna', lastName: 'Saeed', fullName: 'Lubna Saeed',
    email: 'lubna.saeed@company.com', phone: '0301-3344556', cnic: '42201-3344557-1',
    dob: '1987-12-25', gender: 'Female', maritalStatus: 'Married',
    address: 'House 9, Block 3, PECHS, Karachi',
    departmentId: 7, designationId: 1, branchId: 1, shiftId: 1,
    joiningDate: '2021-06-15', confirmationDate: '2021-09-15',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 95000, photo: null, managerId: 1, reportingTo: 1,
    bloodGroup: 'B+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '7777888899990', iban: 'PK36MUCB0000007777888899',
    emergencyContact: { name: 'Saeed Khan', relation: 'Husband', phone: '0301-4455667' },
    qualifications: [{ degree: 'LLB', institution: 'Karachi University', year: '2009', grade: 'A' }],
    experience: [{ company: 'LawFirm', designation: 'Advocate', from: '2009', to: '2021' }],
  },
  {
    id: 23, empNo: 'EMP-023', firstName: 'Asad', lastName: 'Mehmood', fullName: 'Asad Mehmood',
    email: 'asad.mehmood@company.com', phone: '0308-4455668', cnic: '42201-4455669-1',
    dob: '1985-03-08', gender: 'Male', maritalStatus: 'Married',
    address: 'House 34, Johar Town, Lahore',
    departmentId: 6, designationId: 1, branchId: 2, shiftId: 1,
    joiningDate: '2017-09-01', confirmationDate: '2017-12-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 88000, photo: null, managerId: 1, reportingTo: 1,
    bloodGroup: 'O+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'UBL', accountNo: '8888999900001', iban: 'PK36UNIL0000008888999900',
    emergencyContact: { name: 'Saba Mehmood', relation: 'Wife', phone: '0308-5566779' },
    qualifications: [{ degree: 'BBA', institution: 'LUMS', year: '2007', grade: 'B+' }],
    experience: [{ company: 'AdminCo', designation: 'Admin Officer', from: '2007', to: '2017' }],
  },
  {
    id: 24, empNo: 'EMP-024', firstName: 'Noman', lastName: 'Tariq', fullName: 'Noman Tariq',
    email: 'noman.tariq@company.com', phone: '0323-6677889', cnic: '42201-6677890-1',
    dob: '1992-07-14', gender: 'Male', maritalStatus: 'Single',
    address: 'F-10 Markaz, Islamabad',
    departmentId: 8, designationId: 13, branchId: 3, shiftId: 2,
    joiningDate: '2025-01-10', confirmationDate: null,
    employmentType: 'Probation', status: 'active', role: 'employee',
    salary: 55000, photo: null, managerId: null, reportingTo: null,
    bloodGroup: 'AB-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '9999000011112', iban: 'PK36HABB0000009999000011',
    emergencyContact: { name: 'Tariq Mahmood', relation: 'Father', phone: '0323-7788900' },
    qualifications: [{ degree: 'BS IT', institution: 'Air University', year: '2014', grade: 'B' }],
    experience: [{ company: 'TeleConnect', designation: 'Support Exec', from: '2014', to: '2024' }],
  },
  {
    id: 25, empNo: 'EMP-025', firstName: 'Sehar', lastName: 'Nawaz', fullName: 'Sehar Nawaz',
    email: 'sehar.nawaz@company.com', phone: '0335-7788901', cnic: '42201-7788902-1',
    dob: '1999-01-29', gender: 'Female', maritalStatus: 'Single',
    address: 'Flat 5, Block 14, FB Area, Karachi',
    departmentId: 2, designationId: 3, branchId: 1, shiftId: 1,
    joiningDate: '2026-07-01', confirmationDate: null,
    employmentType: 'Probation', status: 'active', role: 'employee',
    salary: 65000, photo: 'assets/avatars/sehar_nawaz.jpg', managerId: 3, reportingTo: 3,
    bloodGroup: 'A+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '0000111122223', iban: 'PK36MUCB0000000000111122',
    emergencyContact: { name: 'Nawaz Hussain', relation: 'Father', phone: '0335-8899012' },
    qualifications: [{ degree: 'BS Software Engineering', institution: 'NED University', year: '2021', grade: 'A' }],
    experience: [],
  },
  {
    id: 13, empNo: 'EMP-013', firstName: 'Omar', lastName: 'Farhan', fullName: 'Omar Farhan',
    email: 'omar.farhan@company.com', phone: '0335-3344556', cnic: '42201-3344556-3',
    dob: '1997-03-25', gender: 'Male', maritalStatus: 'Single',
    address: 'Room 5, G-9, Islamabad',
    departmentId: 2, designationId: 3, branchId: 3, shiftId: 1,
    joiningDate: '2026-08-15', confirmationDate: null,
    employmentType: 'Probation', status: 'active', role: 'employee',
    salary: 70000, photo: 'assets/avatars/omar_farhan.jpg', managerId: 3, reportingTo: 3,
    bloodGroup: 'A-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'UBL', accountNo: '4455667788990', iban: 'PK36UNIL0000004455667788',
    emergencyContact: { name: 'Farhan Ahmad', relation: 'Father', phone: '0335-5566778' },
    qualifications: [{ degree: 'BS CS', institution: 'COMSATS', year: '2019', grade: 'A' }],
    experience: [],
  },
  {
    id: 14, empNo: 'EMP-014', firstName: 'Sana', lastName: 'Ijaz', fullName: 'Sana Ijaz',
    email: 'sana.ijaz@company.com', phone: '0342-4455667', cnic: '42201-4455667-4',
    dob: '1994-07-08', gender: 'Female', maritalStatus: 'Married',
    address: 'House 67, Gulberg III, Lahore',
    departmentId: 4, designationId: 7, branchId: 1, shiftId: 1,
    joiningDate: '2023-05-01', confirmationDate: '2023-08-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 72000, photo: null, managerId: 8, reportingTo: 8,
    bloodGroup: 'B+', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'HBL', accountNo: '6677889900113', iban: 'PK36HABB0000006677889900',
    emergencyContact: { name: 'Ijaz Ahmad', relation: 'Husband', phone: '0342-6677889' },
    qualifications: [{ degree: 'MBA', institution: 'UCP', year: '2016', grade: 'B+' }],
    experience: [],
  },
  {
    id: 15, empNo: 'EMP-015', firstName: 'Imran', lastName: 'Butt', fullName: 'Imran Butt',
    email: 'imran.butt@company.com', phone: '0300-5566778', cnic: '42201-5566778-5',
    dob: '1986-11-30', gender: 'Male', maritalStatus: 'Married',
    address: 'House 12, Bahria Town Phase 5, Islamabad',
    departmentId: 8, designationId: 13, branchId: 3, shiftId: 2,
    joiningDate: '2020-10-01', confirmationDate: '2021-01-01',
    employmentType: 'Permanent', status: 'active', role: 'employee',
    salary: 60000, photo: null, managerId: null, reportingTo: null,
    bloodGroup: 'O-', nationality: 'Pakistani', religion: 'Islam',
    bankName: 'MCB', accountNo: '7788990011224', iban: 'PK36MUCB0000007788990011',
    emergencyContact: { name: 'Saima Butt', relation: 'Wife', phone: '0300-7788990' },
    qualifications: [], experience: [],
  },
];

// ── Generate attendance for current month ──
function genAttendance() {
  const records = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const activeEmps = [1,2,3,4,5,6,7,8,9,10,12,13,14,15];
  const statuses = ['present','present','present','present','present','late','absent','half_day'];
  let id = 1;
  for (let d = 1; d <= today.getDate(); d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    activeEmps.forEach(empId => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const inH = status === 'late' ? 9 + Math.floor(Math.random()*2) + 1 : 9;
      const inM = status === 'late' ? Math.floor(Math.random()*50) : Math.floor(Math.random()*15);
      records.push({
        id: id++, employeeId: empId, date: dateStr,
        timeIn: status === 'absent' ? null : `${String(inH).padStart(2,'0')}:${String(inM).padStart(2,'0')}`,
        timeOut: status === 'absent' ? null : `18:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
        status, overtime: Math.random() > 0.8 ? Math.floor(Math.random()*3) : 0,
        device: 'ZKTeco-01', remarks: ''
      });
    });
  }
  return records;
}
const attendance = genAttendance();

const attendanceLogs = [
  { id: 1, employeeId: 1, date: '2026-08-31', timeIn: '09:02', timeOut: '18:05', device: 'ZKTeco-01', status: 'present' },
  { id: 2, employeeId: 2, date: '2026-08-31', timeIn: '09:15', timeOut: '18:10', device: 'ZKTeco-01', status: 'present' },
  { id: 3, employeeId: 3, date: '2026-08-31', timeIn: '09:45', timeOut: '18:30', device: 'ZKTeco-02', status: 'late' },
  { id: 4, employeeId: 4, date: '2026-08-31', timeIn: '09:05', timeOut: '18:00', device: 'ZKTeco-01', status: 'present' },
  { id: 5, employeeId: 5, date: '2026-08-31', timeIn: null, timeOut: null, device: null, status: 'absent' },
  { id: 6, employeeId: 6, date: '2026-08-31', timeIn: '09:00', timeOut: '13:00', device: 'ZKTeco-01', status: 'half_day' },
];

const leaveTypes = [
  { id: 1, name: 'Casual Leave', code: 'CL', maxDays: 12, carryForward: false, color: '#3b82f6' },
  { id: 2, name: 'Annual Leave', code: 'AL', maxDays: 20, carryForward: true, color: '#10b981' },
  { id: 3, name: 'Sick Leave', code: 'SL', maxDays: 15, carryForward: false, color: '#f59e0b' },
  { id: 4, name: 'Maternity Leave', code: 'ML', maxDays: 90, carryForward: false, color: '#ec4899' },
  { id: 5, name: 'Paternity Leave', code: 'PL', maxDays: 7, carryForward: false, color: '#8b5cf6' },
  { id: 6, name: 'Unpaid Leave', code: 'UL', maxDays: 30, carryForward: false, color: '#6b7280' },
  { id: 7, name: 'Compensatory', code: 'COMP', maxDays: 5, carryForward: true, color: '#14b8a6' },
  { id: 8, name: 'Half Day', code: 'HD', maxDays: 24, carryForward: false, color: '#f97316' },
];

const leaveRequests = [
  { id: 1, employeeId: 4, typeId: 1, from: '2026-09-05', to: '2026-09-06', days: 2, reason: 'Personal work', status: 'pending', managerId: 3, hrId: 2, appliedOn: '2026-08-28', approvedOn: null, comments: '' },
  { id: 2, employeeId: 7, typeId: 3, from: '2026-09-02', to: '2026-09-02', days: 1, reason: 'Feeling unwell', status: 'pending', managerId: 8, hrId: 2, appliedOn: '2026-08-30', approvedOn: null, comments: '' },
  { id: 3, employeeId: 6, typeId: 2, from: '2026-09-10', to: '2026-09-14', days: 5, reason: 'Vacation', status: 'manager_approved', managerId: 2, hrId: 2, appliedOn: '2026-08-25', approvedOn: null, comments: 'Approved by manager' },
  { id: 4, employeeId: 9, typeId: 1, from: '2026-08-20', to: '2026-08-20', days: 1, reason: 'Family function', status: 'approved', managerId: 3, hrId: 2, appliedOn: '2026-08-18', approvedOn: '2026-08-19', comments: 'Approved' },
  { id: 5, employeeId: 14, typeId: 3, from: '2026-08-15', to: '2026-08-16', days: 2, reason: 'Fever', status: 'rejected', managerId: 8, hrId: 2, appliedOn: '2026-08-14', approvedOn: '2026-08-14', comments: 'Peak season, cannot approve' },
];

const leaveBalances = [
  { id: 1, employeeId: 1, year: 2026, balances: { 1: 12, 2: 20, 3: 15, 7: 5 } },
  { id: 2, employeeId: 2, year: 2026, balances: { 1: 10, 2: 18, 3: 13, 7: 3 } },
  { id: 3, employeeId: 3, year: 2026, balances: { 1: 11, 2: 19, 3: 14, 7: 4 } },
  { id: 4, employeeId: 4, year: 2026, balances: { 1: 10, 2: 20, 3: 15, 7: 5 } },
  { id: 5, employeeId: 5, year: 2026, balances: { 1: 12, 2: 17, 3: 12, 7: 2 } },
  { id: 6, employeeId: 6, year: 2026, balances: { 1: 7, 2: 15, 3: 13, 7: 5 } },
];

const holidays = [
  { id: 1, name: 'Pakistan Independence Day', date: '2026-08-14', type: 'national', optional: false },
  { id: 2, name: 'Eid ul-Adha', date: '2026-06-17', type: 'religious', optional: false },
  { id: 3, name: 'Labour Day', date: '2026-05-01', type: 'national', optional: false },
  { id: 4, name: 'Iqbal Day', date: '2026-11-09', type: 'national', optional: false },
  { id: 5, name: 'Christmas', date: '2026-12-25', type: 'religious', optional: true },
  { id: 6, name: 'Quaid Day', date: '2026-12-25', type: 'national', optional: false },
  { id: 7, name: 'New Year', date: '2027-01-01', type: 'national', optional: false },
  { id: 8, name: 'Eid ul-Fitr', date: '2027-03-31', type: 'religious', optional: false },
];

const salaryRecords = [
  { id: 1, employeeId: 1, month: '2026-08', basic: 350000, allowances: 75000, deductions: 45000, overtime: 0, bonus: 0, tax: 52500, netSalary: 327500, status: 'processed', paidOn: '2026-08-31' },
  { id: 2, employeeId: 2, month: '2026-08', basic: 120000, allowances: 30000, deductions: 15000, overtime: 5000, bonus: 0, tax: 18000, netSalary: 122000, status: 'processed', paidOn: '2026-08-31' },
  { id: 3, employeeId: 3, month: '2026-08', basic: 150000, allowances: 35000, deductions: 20000, overtime: 8000, bonus: 0, tax: 22500, netSalary: 150500, status: 'processed', paidOn: '2026-08-31' },
  { id: 4, employeeId: 4, month: '2026-08', basic: 85000, allowances: 20000, deductions: 10000, overtime: 0, bonus: 0, tax: 12750, netSalary: 82250, status: 'pending', paidOn: null },
  { id: 5, employeeId: 5, month: '2026-08', basic: 130000, allowances: 32000, deductions: 18000, overtime: 0, bonus: 10000, tax: 19500, netSalary: 134500, status: 'processed', paidOn: '2026-08-31' },
  { id: 6, employeeId: 6, month: '2026-08', basic: 65000, allowances: 15000, deductions: 8000, overtime: 0, bonus: 0, tax: 9750, netSalary: 62250, status: 'pending', paidOn: null },
];

const allowances = [
  { id: 1, name: 'House Rent Allowance', code: 'HRA', type: 'percentage', value: 45, taxable: false, status: 'active' },
  { id: 2, name: 'Medical Allowance', code: 'MED', type: 'fixed', value: 10000, taxable: false, status: 'active' },
  { id: 3, name: 'Fuel Allowance', code: 'FUEL', type: 'fixed', value: 8000, taxable: false, status: 'active' },
  { id: 4, name: 'Utility Allowance', code: 'UTIL', type: 'percentage', value: 10, taxable: false, status: 'active' },
  { id: 5, name: 'Mobile Allowance', code: 'MOB', type: 'fixed', value: 3000, taxable: false, status: 'active' },
  { id: 6, name: 'Special Allowance', code: 'SPEC', type: 'fixed', value: 5000, taxable: true, status: 'active' },
];

const deductions = [
  { id: 1, name: 'EOBI', code: 'EOBI', type: 'percentage', value: 1, taxable: false, status: 'active' },
  { id: 2, name: 'SESSI', code: 'SESSI', type: 'fixed', value: 2000, taxable: false, status: 'active' },
  { id: 3, name: 'Provident Fund', code: 'PF', type: 'percentage', value: 5, taxable: false, status: 'active' },
  { id: 4, name: 'Income Tax', code: 'TAX', type: 'calculated', value: 0, taxable: false, status: 'active' },
  { id: 5, name: 'Loan Deduction', code: 'LOAN', type: 'fixed', value: 0, taxable: false, status: 'inactive' },
];

const performanceReviews = [
  { id: 1, employeeId: 4, reviewerId: 3, type: 'quarterly', quarter: 'Q2', year: 2026, kpiScore: 85, kraScore: 80, managerFeedback: 'Good performance, needs to improve time management', selfFeedback: 'Working hard on all tasks', overallRating: 4, status: 'completed', reviewDate: '2026-07-15', incrementRecommended: false, promotionRecommended: false },
  { id: 2, employeeId: 6, reviewerId: 2, type: 'quarterly', quarter: 'Q2', year: 2026, kpiScore: 90, kraScore: 88, managerFeedback: 'Excellent work ethic and initiative', selfFeedback: 'Achieved all targets', overallRating: 5, status: 'completed', reviewDate: '2026-07-15', incrementRecommended: true, promotionRecommended: false },
  { id: 3, employeeId: 7, reviewerId: 8, type: 'quarterly', quarter: 'Q2', year: 2026, kpiScore: 70, kraScore: 72, managerFeedback: 'Needs improvement in sales targets', selfFeedback: 'Working on client relationships', overallRating: 3, status: 'completed', reviewDate: '2026-07-15', incrementRecommended: false, promotionRecommended: false },
  { id: 4, employeeId: 9, reviewerId: 3, type: 'quarterly', quarter: 'Q3', year: 2026, kpiScore: 0, kraScore: 0, managerFeedback: '', selfFeedback: '', overallRating: 0, status: 'pending', reviewDate: null, incrementRecommended: false, promotionRecommended: false },
];

const kpis = [
  { id: 1, name: 'Task Completion Rate', departmentId: 2, target: 95, unit: '%', weight: 30 },
  { id: 2, name: 'Bug Resolution Time', departmentId: 2, target: 24, unit: 'hrs', weight: 25 },
  { id: 3, name: 'Sales Target Achievement', departmentId: 4, target: 100, unit: '%', weight: 40 },
  { id: 4, name: 'Customer Satisfaction', departmentId: 8, target: 4.5, unit: '/5', weight: 35 },
  { id: 5, name: 'Attendance Rate', departmentId: null, target: 95, unit: '%', weight: 10 },
];

const recruitmentJobs = [
  { id: 1, title: 'Senior React Developer', departmentId: 2, positions: 2, status: 'open', postedOn: '2026-08-01', deadline: '2026-09-30', salary: '150000-200000', experience: '4-6 years', description: 'Looking for experienced React developer', applicantCount: 12 },
  { id: 2, title: 'HR Executive', departmentId: 1, positions: 1, status: 'open', postedOn: '2026-08-10', deadline: '2026-09-15', salary: '60000-80000', experience: '2-3 years', description: 'HR executive for daily operations', applicantCount: 8 },
  { id: 3, title: 'Sales Manager', departmentId: 4, positions: 1, status: 'interviewing', postedOn: '2026-07-15', deadline: '2026-08-31', salary: '120000-160000', experience: '5-8 years', description: 'Sales manager for enterprise clients', applicantCount: 5 },
  { id: 4, title: 'Accountant', departmentId: 3, positions: 1, status: 'closed', postedOn: '2026-06-01', deadline: '2026-07-31', salary: '70000-90000', experience: '3-5 years', description: 'Experienced accountant needed', applicantCount: 15 },
];

const applications = [
  { id: 1, jobId: 1, name: 'Ali Hassan', email: 'ali@gmail.com', phone: '0300-1111111', cnic: '42101-1122334-1', stage: 'applied', appliedOn: '2026-08-05', resume: 'ali_cv.pdf', interviewDate: null, score: 0, notes: '' },
  { id: 2, jobId: 1, name: 'Maria Khan', email: 'maria@gmail.com', phone: '0321-2222222', cnic: '42201-3948572-8', stage: 'shortlisted', appliedOn: '2026-08-07', resume: 'maria_cv.pdf', interviewDate: '2026-09-05', score: 75, notes: 'Good React skills' },
  { id: 3, jobId: 1, name: 'Zaid Farooq', email: 'zaid@gmail.com', phone: '0333-3333333', cnic: '35202-8192043-5', stage: 'interview', appliedOn: '2026-08-09', resume: 'zaid_cv.pdf', interviewDate: '2026-09-02', score: 80, notes: 'Strong candidate' },
  { id: 4, jobId: 3, name: 'Saad Ibrahim', email: 'saad@gmail.com', phone: '0345-4444444', cnic: '42101-5849201-3', stage: 'offer', appliedOn: '2026-07-20', resume: 'saad_cv.pdf', interviewDate: '2026-08-10', score: 90, notes: 'Excellent profile, offer extended' },
];

const offerLetters = [
  {
    id: 1,
    refNo: 'HRM-OL-2026-001',
    applicationId: 4,
    candidateName: 'Saad Ibrahim',
    cnic: '42101-5849201-3',
    email: 'saad@gmail.com',
    phone: '0345-4444444',
    designation: 'Sales Manager',
    departmentId: 4,
    employmentType: 'permanent',
    duration: 'Standard Permanent Role',
    grossSalary: 140000,
    basicSalary: 84000,
    allowances: { house: 28000, medical: 14000, conveyance: 14000 },
    joiningDate: '2026-09-15',
    reportingManagerId: 8,
    probationMonths: 3,
    issueDate: '2026-09-04',
    expiryDate: '2026-09-06',
    status: 'sent',
    location: 'Head Office, Islamabad',
    workHours: 'Mon - Fri, 09:00 AM - 06:00 PM',
    benefits: [
      'Company Provident Fund (5% Employee + 5% Employer Match)',
      'Comprehensive Medical & Hospitalization Insurance (Family OPD & IPD)',
      '20 Annual Leaves + 12 Casual Leaves + 15 Sick Leaves with carry forward',
      'Annual Performance Appraisal & Eid Performance Bonuses',
      'Corporate Laptop, Official Mobile SIM & Fuel Allowance',
      'Continuous Professional Learning & Certification Sponsorship'
    ],
    notes: 'Candidate accepted verbal offer. Formal agreement issued.'
  },
  {
    id: 2,
    refNo: 'HRM-OL-2026-002',
    applicationId: 3,
    candidateName: 'Zaid Farooq',
    cnic: '35202-8192043-5',
    email: 'zaid@gmail.com',
    phone: '0333-3333333',
    designation: 'Senior React Developer',
    departmentId: 2,
    employmentType: 'contract',
    duration: '1 Year (Renewable on mutual consent)',
    grossSalary: 180000,
    basicSalary: 108000,
    allowances: { house: 36000, medical: 18000, conveyance: 18000 },
    joiningDate: '2026-09-20',
    reportingManagerId: 3,
    probationMonths: 2,
    issueDate: '2026-09-05',
    expiryDate: '2026-09-07',
    status: 'draft',
    location: 'Lahore Tech Center / Hybrid',
    workHours: 'Mon - Fri, 09:00 AM - 06:00 PM',
    benefits: [
      'Competitive Fixed Compensation Package',
      'Comprehensive Medical & Hospitalization Insurance',
      '15 Paid Annual Leaves + All Gazetted Public Holidays',
      'Company MacBook Pro & Home Office Setup Grant',
      'Hybrid Work Arrangement (2 Days Remote per week)'
    ],
    notes: 'Fixed 1-year contract subject to project milestones.'
  },
  {
    id: 3,
    refNo: 'HRM-OL-2026-003',
    applicationId: 2,
    candidateName: 'Maria Khan',
    cnic: '42201-3948572-8',
    email: 'maria@gmail.com',
    phone: '0321-2222222',
    designation: 'Frontend Engineering Intern',
    departmentId: 2,
    employmentType: 'internship',
    duration: '3 Months (Leading to Permanent Placement)',
    grossSalary: 45000,
    basicSalary: 45000,
    allowances: { house: 0, medical: 0, conveyance: 0 },
    joiningDate: '2026-09-15',
    reportingManagerId: 4,
    probationMonths: 1,
    issueDate: '2026-09-05',
    expiryDate: '2026-09-07',
    status: 'accepted',
    location: 'Karachi Office',
    workHours: 'Mon - Fri, 09:00 AM - 05:00 PM',
    benefits: [
      'Monthly Stipend of PKR 45,000',
      'Dedicated Senior Engineering Mentorship & Code Reviews',
      'Official Development Workstation & Tools Access',
      'Paid Public Holidays & 1 Day/Month Casual Leave',
      'Fast-track Assessment for Full-time Junior Engineer role upon completion'
    ],
    notes: 'Outstanding technical assessment. High potential intern.'
  }
];

const events = [
  { id: 1, title: 'Company Annual Dinner', type: 'company', date: '2026-09-15', time: '19:00', location: 'Pearl Continental Hotel', description: 'Annual dinner for all employees', status: 'upcoming' },
  { id: 2, title: 'React Training Workshop', type: 'training', date: '2026-09-05', time: '10:00', location: 'IT Training Room', description: 'Advanced React patterns workshop', status: 'upcoming' },
  { id: 3, title: 'Q3 Strategy Meeting', type: 'meeting', date: '2026-09-01', time: '10:00', location: 'Board Room', description: 'Q3 review and planning', status: 'upcoming' },
  { id: 4, title: 'Health & Safety Training', type: 'training', date: '2026-09-20', time: '14:00', location: 'Conference Hall', description: 'Mandatory safety training', status: 'upcoming' },
  { id: 5, title: 'Eid ul-Adha Celebration', type: 'company', date: '2026-06-17', time: '12:00', location: 'Head Office', description: 'Company Eid celebration', status: 'completed' },
];

const announcements = [
  { id: 1, title: 'Office Timing Change — September 2026', body: 'Please note that office timings will be 9:00 AM to 6:00 PM starting September 1, 2026. All employees are requested to update their schedules accordingly.', authorId: 2, date: '2026-08-28', priority: 'high', read: [] },
  { id: 2, title: 'New Leave Policy Update', body: 'The leave policy has been updated to include compensatory leaves. Employees working on weekends/holidays are entitled to compensatory leave. Details are available in the HR portal.', authorId: 2, date: '2026-08-25', priority: 'normal', read: [] },
  { id: 3, title: 'Performance Review Schedule Q3', body: 'Q3 performance reviews will begin from October 1, 2026. All managers are requested to initiate performance review forms for their team members.', authorId: 1, date: '2026-08-20', priority: 'normal', read: [] },
  { id: 4, title: 'IT Infrastructure Upgrade', body: 'The IT department will be upgrading network infrastructure this weekend. There may be brief internet outages on Sunday, August 30 from 2:00 AM to 6:00 AM.', authorId: 3, date: '2026-08-27', priority: 'low', read: [] },
];

const auditLogs = [
  { id: 1, action: 'LOGIN', module: 'Auth', details: 'Super Admin logged into the system', userId: 1, timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { id: 2, action: 'PROCESS', module: 'Payroll', details: 'Generated August 2026 salary slip for Fatima Raza (EMP-004)', userId: 1, timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
  { id: 3, action: 'APPROVE', module: 'Leaves', details: 'Approved 2 days annual leave for Omar Farhan (EMP-009)', userId: 2, timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString() },
  { id: 4, action: 'UPDATE', module: 'Attendance', details: 'Clock-in time adjusted for Bilal Qureshi (EMP-007) on Sep 05', userId: 2, timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString() },
  { id: 5, action: 'ADD', module: 'Payroll', details: 'Provident Fund voluntary deposit recorded for Zaid Farooq (PKR 5,000)', userId: 1, timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString() },
  { id: 6, action: 'UPDATE', module: 'Performance', details: 'Updated Q3 Goal: "Refactor HRM Payroll Engine" to 85%', userId: 1, timestamp: new Date(Date.now() - 290 * 60 * 1000).toISOString() },
  { id: 7, action: 'ADD', module: 'Employees', details: 'New employee Rabia Nawaz (EMP-012) added to Engineering', userId: 2, timestamp: new Date(Date.now() - 380 * 60 * 1000).toISOString() },
  { id: 8, action: 'PROCESS', module: 'Payroll', details: 'Bulk processed August 2026 payroll for 18 active employees', userId: 1, timestamp: new Date(Date.now() - 22 * 3600 * 1000).toISOString() },
  { id: 9, action: 'UPDATE', module: 'Settings', details: 'Provident Fund policy updated: 5% Employee, 5% Employer match', userId: 1, timestamp: new Date(Date.now() - 25 * 3600 * 1000).toISOString() },
  { id: 10, action: 'ADD', module: 'Recruitment', details: 'New job opening created: Senior UI/UX Designer', userId: 2, timestamp: new Date(Date.now() - 27 * 3600 * 1000).toISOString() },
  { id: 11, action: 'APPLY', module: 'Leaves', details: 'Maternity leave application submitted by Ayesha Malik', userId: 5, timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString() },
  { id: 12, action: 'LOGIN', module: 'Auth', details: 'HR Manager Sara Malik logged into portal', userId: 2, timestamp: new Date(Date.now() - 32 * 3600 * 1000).toISOString() },
  { id: 13, action: 'UPDATE', module: 'Employees', details: 'Employee profile updated: Usman Baig (EMP-003)', userId: 2, timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString() },
  { id: 14, action: 'ADD', module: 'Attendance', details: 'Bulk marked attendance for 24 employees on Sep 02 (Present)', userId: 2, timestamp: new Date(Date.now() - 68 * 3600 * 1000).toISOString() },
  { id: 15, action: 'TRANSFER', module: 'Employees', details: 'Hassan Raza transferred from Islamabad to Karachi branch', userId: 1, timestamp: new Date(Date.now() - 76 * 3600 * 1000).toISOString() },
  { id: 16, action: 'ADD', module: 'Events', details: 'Published announcement: "Office Timing Change — Sep 2026"', userId: 2, timestamp: new Date(Date.now() - 85 * 3600 * 1000).toISOString() },
  { id: 17, action: 'APPROVE', module: 'Leaves', details: 'Manager approval granted for Casual Leave (Zainab Tariq)', userId: 3, timestamp: new Date(Date.now() - 98 * 3600 * 1000).toISOString() },
  { id: 18, action: 'ADD', module: 'Administration', details: 'Created new Grade: Executive Level 2 (EX-2)', userId: 1, timestamp: new Date(Date.now() - 120 * 3600 * 1000).toISOString() },
  { id: 19, action: 'UPDATE', module: 'Settings', details: 'Updated company attendance policy: Grace period set to 15 mins', userId: 1, timestamp: new Date(Date.now() - 140 * 3600 * 1000).toISOString() },
  { id: 20, action: 'ADD', module: 'Payroll', details: 'Created new allowance: Fuel Allowance (PKR 8,000)', userId: 1, timestamp: new Date(Date.now() - 165 * 3600 * 1000).toISOString() },
  { id: 21, action: 'LOGIN', module: 'Auth', details: 'Department Manager Usman Baig logged in', userId: 3, timestamp: new Date(Date.now() - 190 * 3600 * 1000).toISOString() }
];

const roles = [
  { id: 1, name: 'Super Admin', code: 'superadmin', description: 'Full corporate system access & governance', permissions: 'all' },
  { id: 2, name: 'HR Manager', code: 'hr_manager', description: 'HR operations, employees, recruitment, payroll & role assignment' },
  { id: 3, name: 'Department Manager', code: 'dept_manager', description: 'Team management, attendance review & leave approvals' },
  { id: 4, name: 'Employee', code: 'employee', description: 'Self-service view-only access (personal leaves, attendance, salary)' },
  { id: 5, name: 'New Joiner (Onboarding)', code: 'onboarding', description: 'Induction mode allowing personal info completion & document uploads' },
];

const permissions = {
  superadmin: ['dashboard','employees','attendance','leaves','payroll','performance','recruitment','events','reports','administration','settings','backup'],
  hr_manager: ['dashboard','employees.add','employees.edit','employees.view','employees.role','attendance','leaves.approve','payroll','performance','recruitment','reports','administration.departments','administration.users'],
  dept_manager: ['dashboard','employees.view.team','attendance.view.team','leaves.approve.team','performance.review.team'],
  employee: ['dashboard','attendance.own','leaves.request','salary.own','profile','performance.own','events','holidays'],
  onboarding: ['dashboard','profile','attendance','leaves','events','holidays'],
};

const users = [
  { id: 1, employeeId: 1, username: 'admin', password: 'admin123', role: 'superadmin', status: 'active', lastLogin: new Date().toISOString() },
  { id: 2, employeeId: 2, username: 'sara.malik', password: 'hr123', role: 'hr_manager', status: 'active', lastLogin: new Date(Date.now()-3600000).toISOString() },
  { id: 3, employeeId: 3, username: 'usman.baig', password: 'mgr123', role: 'dept_manager', status: 'active', lastLogin: null },
  { id: 4, employeeId: 4, username: 'fatima.raza', password: 'emp123', role: 'employee', status: 'active', lastLogin: null },
];

const assets = [
  { id: 1, name: 'Dell Laptop', code: 'ASSET-001', category: 'IT Equipment', assignedTo: 3, assignedOn: '2019-06-15', condition: 'good', status: 'assigned' },
  { id: 2, name: 'iPhone 14', code: 'ASSET-002', category: 'Mobile', assignedTo: 8, assignedOn: '2023-01-01', condition: 'good', status: 'assigned' },
  { id: 3, name: 'MacBook Pro', code: 'ASSET-003', category: 'IT Equipment', assignedTo: 4, assignedOn: '2021-02-01', condition: 'excellent', status: 'assigned' },
  { id: 4, name: 'Office Chair (Ergonomic)', code: 'ASSET-004', category: 'Furniture', assignedTo: 1, assignedOn: '2020-01-01', condition: 'good', status: 'assigned' },
  { id: 5, name: 'HP Printer', code: 'ASSET-005', category: 'IT Equipment', assignedTo: null, assignedOn: null, condition: 'good', status: 'available' },
];

const trainings = [
  { id: 1, employeeId: 3, title: 'AWS Cloud Practitioner', provider: 'AWS', from: '2025-03-01', to: '2025-03-05', cost: 50000, certificate: true, status: 'completed' },
  { id: 2, employeeId: 4, title: 'React Advanced Patterns', provider: 'Udemy', from: '2025-06-01', to: '2025-06-15', cost: 5000, certificate: true, status: 'completed' },
  { id: 3, employeeId: 2, title: 'SHRM-CP Certification', provider: 'SHRM', from: '2026-10-01', to: '2026-10-05', cost: 80000, certificate: true, status: 'upcoming' },
];

const promotions = [
  { id: 1, employeeId: 3, fromDesignationId: 3, toDesignationId: 4, effectiveDate: '2023-07-01', incrementAmount: 30000, approvedBy: 1, remarks: 'Promoted based on excellent performance' },
];

const transfers = [
  { id: 1, employeeId: 15, fromBranchId: 1, toBranchId: 3, effectiveDate: '2020-10-01', reason: 'Expansion requirements', approvedBy: 1 },
];

const skills = [
  { id: 1, name: 'JavaScript', category: 'Technical', status: 'active' },
  { id: 2, name: 'React', category: 'Technical', status: 'active' },
  { id: 3, name: 'Project Management', category: 'Management', status: 'active' },
  { id: 4, name: 'Communication', category: 'Soft Skill', status: 'active' },
  { id: 5, name: 'SAP', category: 'Technical', status: 'active' },
  { id: 6, name: 'QuickBooks', category: 'Technical', status: 'active' },
];

const banks = [
  { id: 1, name: 'Habib Bank Limited', code: 'HBL', swiftCode: 'HABBPKKA' },
  { id: 2, name: 'MCB Bank', code: 'MCB', swiftCode: 'MUCBPKKA' },
  { id: 3, name: 'United Bank Limited', code: 'UBL', swiftCode: 'UNILPKKA' },
  { id: 4, name: 'Allied Bank', code: 'ABL', swiftCode: 'ABPAPKKA' },
  { id: 5, name: 'Meezan Bank', code: 'MEEZ', swiftCode: 'MEZNPKKA' },
];

const salaryGrades = [
  { id: 1, grade: 'G1', minSalary: 25000, maxSalary: 50000, description: 'Junior' },
  { id: 2, grade: 'G2', minSalary: 50001, maxSalary: 100000, description: 'Mid-Level' },
  { id: 3, grade: 'G3', minSalary: 100001, maxSalary: 200000, description: 'Senior' },
  { id: 4, grade: 'G4', minSalary: 200001, maxSalary: 400000, description: 'Management' },
  { id: 5, grade: 'G5', minSalary: 400001, maxSalary: 1000000, description: 'Executive' },
];

const jobTitles = [
  { id: 1, title: 'Junior Developer', departmentId: 2, grade: 'G1' },
  { id: 2, title: 'Software Engineer', departmentId: 2, grade: 'G2' },
  { id: 3, title: 'Senior Engineer', departmentId: 2, grade: 'G3' },
  { id: 4, title: 'HR Executive', departmentId: 1, grade: 'G1' },
  { id: 5, title: 'HR Manager', departmentId: 1, grade: 'G3' },
];

const projects = [
  { id: 1, name: 'ERP Implementation', departmentId: 2, managerId: 3, startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', members: [3,4,9,13] },
  { id: 2, name: 'Marketing Campaign Q3', departmentId: 4, managerId: 8, startDate: '2026-07-01', endDate: '2026-09-30', status: 'active', members: [7,8,14] },
  { id: 3, name: 'Finance Audit 2026', departmentId: 3, managerId: 5, startDate: '2026-10-01', endDate: '2026-10-31', status: 'upcoming', members: [5,6] },
];

const teams = [
  { id: 1, name: 'IT Core Team', departmentId: 2, leaderId: 3, members: [3,4,9,13] },
  { id: 2, name: 'Sales Team A', departmentId: 4, leaderId: 8, members: [7,8,14] },
  { id: 3, name: 'HR Team', departmentId: 1, leaderId: 2, members: [2,6,12] },
];

const loans = [
  { id: 1, employeeId: 7, amount: 200000, purpose: 'Home appliances', installments: 12, monthlyDeduction: 16667, startDate: '2026-06-01', remaining: 10, status: 'active' },
  { id: 2, employeeId: 9, amount: 100000, purpose: 'Medical emergency', installments: 6, monthlyDeduction: 16667, startDate: '2026-05-01', remaining: 0, status: 'completed' },
];

const documents = [
  { id: 1, employeeId: 1, type: 'CNIC', name: 'CNIC Front', filename: 'cnic_front.jpg', uploadedOn: '2021-01-01' },
  { id: 2, employeeId: 1, type: 'Appointment Letter', name: 'Appointment Letter 2015', filename: 'appointment_2015.pdf', uploadedOn: '2021-01-01' },
  { id: 3, employeeId: 4, type: 'CV', name: 'Resume 2021', filename: 'fatima_cv.pdf', uploadedOn: '2021-02-01' },
  { id: 4, employeeId: 4, type: 'Degree', name: 'BS Degree', filename: 'bs_degree.pdf', uploadedOn: '2021-02-01' },
];

const notes = [
  { id: 1, employeeId: 4, note: 'Strong performer in Q2. Recommended for senior role next year.', addedBy: 2, addedOn: '2026-07-20', type: 'performance' },
  { id: 2, employeeId: 6, note: 'Attended SHRM training. Very proactive and detail oriented.', addedBy: 2, addedOn: '2026-08-01', type: 'general' },
  { id: 3, employeeId: 3, note: 'Completed AWS certification. Eligible for Grade G3 increment review.', addedBy: 1, addedOn: '2026-06-15', type: 'training' },
];

const dependentsList = [
  { id: 1, employeeId: 1, name: 'Fatima Khan', relation: 'Spouse', dob: '1988-05-10', cnic: '42201-0987654-2', status: 'active' },
  { id: 2, employeeId: 1, name: 'Ali Khan', relation: 'Child', dob: '2012-03-22', cnic: null, status: 'active' },
  { id: 3, employeeId: 3, name: 'Asma Baig', relation: 'Spouse', dob: '1990-11-14', cnic: '42201-1234321-3', status: 'active' },
  { id: 4, employeeId: 5, name: 'Zara Ahmed', relation: 'Spouse', dob: '1985-07-30', cnic: '42201-9876541-4', status: 'active' },
];

const exitRecords = [
  {
    id: 1, employeeId: 11, exitDate: '2024-03-31', reason: 'Resignation',
    noticePeriod: 30, lastWorkingDay: '2024-03-31',
    interviewNotes: 'Employee cited personal reasons. Left on good terms.',
    clearance: { it: true, hr: true, finance: true, admin: true, library: false },
    approvedBy: 1, createdOn: '2024-03-01'
  },
];

const goals = [
  { id: 1, employeeId: 4, title: 'Complete React certification', targetDate: '2026-12-31', progress: 60, status: 'in_progress', departmentId: 2 },
  { id: 2, employeeId: 6, title: 'Reduce employee turnover by 10%', targetDate: '2026-12-31', progress: 40, status: 'in_progress', departmentId: 1 },
  { id: 3, employeeId: 3, title: 'Onboard 3 new developers', targetDate: '2026-09-30', progress: 100, status: 'completed', departmentId: 2 },
  { id: 4, employeeId: 9, title: 'Design new company website', targetDate: '2026-10-31', progress: 25, status: 'in_progress', departmentId: 2 },
];

const attendanceCorrections = [
  {
    id: 1,
    employeeId: 4, // Fatima Raza
    date: '2026-09-02',
    type: 'attendance_correction',
    timeIn: '09:05',
    timeOut: '18:15',
    reason: 'Biometric fingerprint scanner glitch at main entrance',
    status: 'pending',
    managerId: 3,
    managerStatus: 'pending',
    managerApprovedAt: null,
    managerRemarks: '',
    hrStatus: 'pending',
    hrApprovedAt: null,
    hrRemarks: '',
    createdAt: '2026-09-02'
  },
  {
    id: 2,
    employeeId: 9, // Tariq Hussain
    date: '2026-09-03',
    type: 'work_from_home',
    timeIn: '09:00',
    timeOut: '18:00',
    reason: 'Severe rain and urban road blockage in Karachi',
    status: 'manager_approved',
    managerId: 3,
    managerStatus: 'approved',
    managerApprovedAt: '2026-09-03T10:30:00Z',
    managerRemarks: 'Approved for remote working day.',
    hrStatus: 'pending',
    hrApprovedAt: null,
    hrRemarks: '',
    createdAt: '2026-09-03'
  },
  {
    id: 3,
    employeeId: 4, // Fatima Raza
    date: '2026-08-25',
    type: 'attendance_correction',
    timeIn: '09:10',
    timeOut: '18:30',
    reason: 'Official off-site client deployment meeting',
    status: 'approved',
    managerId: 3,
    managerStatus: 'approved',
    managerApprovedAt: '2026-08-25T19:00:00Z',
    managerRemarks: 'Verified offsite meeting with client.',
    hrStatus: 'approved',
    hrApprovedAt: '2026-08-26T09:15:00Z',
    hrRemarks: 'Approved and logged in payroll.',
    createdAt: '2026-08-25'
  }
];

// Utility functions
const Utils = {
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  formatCurrency(amount) {
    if (!amount) return 'PKR 0';
    return `PKR ${Number(amount).toLocaleString('en-PK')}`;
  },
  formatTime(timeStr) { return timeStr || '—'; },
  getAge(dob) {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  },
  getDeptName(id) { return DB.find('departments', id)?.name || '—'; },
  getDesigName(id) { return DB.find('designations', id)?.name || '—'; },
  getBranchName(id) { return DB.find('branches', id)?.name || '—'; },
  getEmpName(id) { return DB.find('employees', id)?.fullName || '—'; },
  getLeaveTypeName(id) { return DB.find('leave_types', id)?.name || '—'; },
  statusBadge(status, map = {}) {
    const defaults = {
      active: 'badge-success', inactive: 'badge-danger', pending: 'badge-warning',
      approved: 'badge-success', rejected: 'badge-danger', present: 'badge-success',
      absent: 'badge-danger', late: 'badge-warning', half_day: 'badge-info',
      processed: 'badge-success', open: 'badge-success', closed: 'badge-secondary',
      interviewing: 'badge-warning', completed: 'badge-success', upcoming: 'badge-info',
      manager_approved: 'badge-info', probation: 'badge-warning',
    };
    const cls = map[status] || defaults[status] || 'badge-secondary';
    const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—';
    return `<span class="badge ${cls}">${label}</span>`;
  },
  avatarInitials(name) {
    return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  },
  avatarColor(id) {
    const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#10b981','#f97316'];
    return colors[id % colors.length];
  },
  today() { return new Date().toISOString().split('T')[0]; },
  thisMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; },
  generateId() { return Date.now() + Math.floor(Math.random()*1000); },
  downloadCSV(csvString, filename = 'export.csv') {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
