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
      this.ensureTaxAndStatutoryData();
      this.ensureRosterAndGeofenceData();
      this.ensureTalentAndLMSData();
      this.ensureEngagementData();
      this.ensureCompanyPolicies();
      this.ensureLifeEventsAndDependents();
      this.ensureWebhooksAndTemplates();
      this.ensureBatch9Data();
      this.ensureUserNotifications();
      this.ensureDisciplinaryData();
      this.ensureNormalizedProfileData();
      this.ensureTrainingAndCertificates();
      this.ensureRBACData();
      this.ensureTravelAndExpenseData();
      this.ensureSalaryStructureData();
      this.ensureHierarchyData();
      this.ensureExitLifecycleData();
      this.ensureAssetCatalogData();
      this.ensureTelemetryData();
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
    this.ensureTaxAndStatutoryData();
    this.ensureRosterAndGeofenceData();
    this.ensureTalentAndLMSData();
    this.ensureEngagementData();
    this.ensureCompanyPolicies();
    this.ensureLifeEventsAndDependents();
    this.ensureWebhooksAndTemplates();
    this.ensureBatch9Data();
    this.ensureUserNotifications();
    this.ensureDisciplinaryData();
    this.ensureNormalizedProfileData();
    this.ensureTrainingAndCertificates();
    this.ensureRBACData();
    this.ensureTravelAndExpenseData();
    this.ensureSalaryStructureData();
    this.ensureHierarchyData();
    this.ensureExitLifecycleData();
    this.ensureAssetCatalogData();
    this.ensureTelemetryData();
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
          issueDate: '2016-09-28', expiryDate: '2026-09-28',
          issuingAuthority: 'NADRA Clifton',
          notes: 'CRITICAL: Smart CNIC expiring in under 20 days! Renewal required.', status: 'urgent'
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
    } else {
      let cnic4 = docs.find(d => parseInt(d.employeeId) === 4 && d.docType === 'CNIC');
      if (!cnic4) {
        docs.push({
          id: docs.length ? Math.max(...docs.map(x => x.id)) + 1 : 14,
          employeeId: 4,
          docType: 'CNIC',
          docNumber: '42201-4567890-4',
          issueDate: '2016-09-28',
          expiryDate: '2026-09-28',
          issuingAuthority: 'NADRA Clifton',
          notes: 'CRITICAL: Smart CNIC expiring in under 20 days! Renewal required.',
          status: 'urgent'
        });
        this.set('document_expiries', docs);
      } else {
        cnic4.expiryDate = '2026-09-28';
        cnic4.status = 'urgent';
        this.set('document_expiries', docs);
      }
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
          content: 'This is to certify that Mr. Kamran Ali was employed with HRM Pro as Software Engineer from June 1, 2018 to March 31, 2024.',
          acknowledged: true,
          acknowledgedAt: '2024-04-06T10:00:00.000Z'
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
          content: 'This certificate verifies that Ms. Fatima Raza is currently employed as Software Engineer earning a gross salary of PKR 85,000 per month.',
          acknowledged: false
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
          content: 'We are pleased to confirm your appointment as Deputy Manager / Lead Software Engineer effective September 15, 2019.',
          acknowledged: true,
          acknowledgedAt: '2019-09-16T09:00:00.000Z'
        }
      ];
      this.set('hr_letters', letters);
    } else {
      let modified = false;
      if (!letters.some(l => parseInt(l.employeeId) === 4)) {
        letters.push({
          id: letters.reduce((max, l) => Math.max(max, l.id || 0), 0) + 1,
          refNo: 'HRM/SAL/2026/014',
          employeeId: 4,
          templateType: 'salary_certificate',
          title: 'Salary Verification & Employment Certificate',
          recipient: 'The Visa Officer, British High Commission, Islamabad',
          issueDate: '2026-08-15',
          issuedBy: 'Sara Malik (Head of HR)',
          purpose: 'United Kingdom Standard Visitor Visa Application',
          content: 'This certificate verifies that Ms. Fatima Raza is currently employed as Software Engineer earning a gross salary of PKR 85,000 per month.',
          acknowledged: false
        });
        modified = true;
      }
      letters.forEach(l => {
        if (l.acknowledged === undefined) {
          l.acknowledged = (parseInt(l.employeeId) === 4) ? false : true;
          modified = true;
        }
      });
      if (modified) {
        this.set('hr_letters', letters);
      }
    }
  },

  calculateFBRTax(monthlyIncome) {
    const annualIncome = Math.max(0, Number(monthlyIncome) || 0) * 12;
    let annualTax = 0;
    let slabDesc = 'Slab 1 (Up to PKR 600K: 0%)';
    let slabId = 1;

    if (annualIncome <= 600000) {
      annualTax = 0;
      slabDesc = 'Slab 1 (Up to PKR 600,000: 0%)';
      slabId = 1;
    } else if (annualIncome <= 1200000) {
      annualTax = (annualIncome - 600000) * 0.05;
      slabDesc = 'Slab 2 (PKR 600K - 1.2M: 5% of excess)';
      slabId = 2;
    } else if (annualIncome <= 2200000) {
      annualTax = 30000 + (annualIncome - 1200000) * 0.15;
      slabDesc = 'Slab 3 (PKR 1.2M - 2.2M: PKR 30K + 15%)';
      slabId = 3;
    } else if (annualIncome <= 3200000) {
      annualTax = 180000 + (annualIncome - 2200000) * 0.25;
      slabDesc = 'Slab 4 (PKR 2.2M - 3.2M: PKR 180K + 25%)';
      slabId = 4;
    } else if (annualIncome <= 4100000) {
      annualTax = 430000 + (annualIncome - 3200000) * 0.30;
      slabDesc = 'Slab 5 (PKR 3.2M - 4.1M: PKR 430K + 30%)';
      slabId = 5;
    } else {
      annualTax = 700000 + (annualIncome - 4100000) * 0.35;
      slabDesc = 'Slab 6 (Above PKR 4.1M: PKR 700K + 35%)';
      slabId = 6;
    }

    const monthlyTax = Math.round(annualTax / 12);
    const effectiveRate = annualIncome > 0 ? ((annualTax / annualIncome) * 100).toFixed(2) : 0;

    return {
      annualIncome,
      annualTax: Math.round(annualTax),
      monthlyTax,
      slabDesc,
      slabId,
      effectiveRate
    };
  },

  ensureTaxAndStatutoryData() {
    // 1. Ensure tax_config
    let config = this.get('tax_config');
    if (!config || !config.slabs) {
      config = {
        financialYear: '2024–2026',
        act: 'Finance Act 2024 / FBR SRO',
        statutoryMinWage: 37000,
        slabs: [
          { slab: 1, min: 0, max: 600000, rate: 0, fixed: 0, desc: 'Up to PKR 600,000 (Tax Free)' },
          { slab: 2, min: 600000, max: 1200000, rate: 0.05, fixed: 0, desc: '5% of amount exceeding PKR 600,000' },
          { slab: 3, min: 1200000, max: 2200000, rate: 0.15, fixed: 30000, desc: 'PKR 30,000 + 15% of amount exceeding PKR 1,200,000' },
          { slab: 4, min: 2200000, max: 3200000, rate: 0.25, fixed: 180000, desc: 'PKR 180,000 + 25% of amount exceeding PKR 2,200,000' },
          { slab: 5, min: 3200000, max: 4100000, rate: 0.30, fixed: 430000, desc: 'PKR 430,000 + 30% of amount exceeding PKR 3,200,000' },
          { slab: 6, min: 4100000, max: Infinity, rate: 0.35, fixed: 700000, desc: 'PKR 700,000 + 35% of amount exceeding PKR 4,100,000' }
        ],
        eobi: { employerRate: 0.05, employeeRate: 0.01, wageBase: 37000, employerAmt: 1850, employeeAmt: 370, totalAmt: 2220 },
        sessi: { employerRate: 0.06, employeeRate: 0, wageBase: 37000, employerAmt: 2220, employeeAmt: 0, totalAmt: 2220 },
        gratuity: { formula: '1 Month Basic Salary x Completed Years of Service (Minimum 1 Year Required)' }
      };
      this.set('tax_config', config);
    }

    // 2. Ensure salary records have accurate FBR tax calculated
    const salaries = this.get('salary') || [];
    let salUpdated = false;
    salaries.forEach(s => {
      const gross = (s.basic || 0) + (s.allowances || 0);
      const taxCalc = this.calculateFBRTax(gross);
      if (s.tax !== taxCalc.monthlyTax) {
        s.tax = taxCalc.monthlyTax;
        s.netSalary = Math.round((s.basic || 0) + (s.allowances || 0) + (s.overtime || 0) + (s.bonus || 0) - (s.deductions || 0) - s.tax);
        salUpdated = true;
      }
    });
    if (salUpdated) {
      this.set('salary', salaries);
    }

    // 3. Ensure EOBI ledger
    let eobiLedger = this.get('eobi_ledger');
    if (!eobiLedger || !eobiLedger.length) {
      const emps = (this.get('employees') || []).filter(e => e.status === 'active');
      const months = ['2026-07', '2026-08', '2026-09'];
      eobiLedger = [];
      let nextEobiId = 1;
      months.forEach(m => {
        emps.forEach(e => {
          eobiLedger.push({
            id: nextEobiId++,
            employeeId: e.id,
            month: m,
            eobiNo: `EOBI-${String(100000 + e.id * 142)}-PK`,
            wageBase: 37000,
            employeeShare: 370,
            employerShare: 1850,
            totalContribution: 2220,
            status: m === '2026-09' ? 'pending_deposit' : 'deposited',
            depositSlipNo: m === '2026-09' ? null : `NBP-EOBI-CH-${m.replace('-','')}-${String(e.id).padStart(3,'0')}`,
            depositDate: m === '2026-09' ? null : `${m}-28`
          });
        });
      });
      this.set('eobi_ledger', eobiLedger);
    }

    // 4. Ensure SESSI / PESSI ledger
    let sessiLedger = this.get('sessi_ledger');
    if (!sessiLedger || !sessiLedger.length) {
      const emps = (this.get('employees') || []).filter(e => e.status === 'active');
      const months = ['2026-07', '2026-08', '2026-09'];
      sessiLedger = [];
      let nextSessiId = 1;
      months.forEach(m => {
        emps.forEach(e => {
          const isSindh = e.branchId === 1 || e.branchId === 2;
          sessiLedger.push({
            id: nextSessiId++,
            employeeId: e.id,
            month: m,
            institution: isSindh ? 'SESSI (Sindh)' : 'PESSI (Punjab)',
            socialSecurityNo: `SS-${isSindh ? 'KHI' : 'LHE'}-${String(88000 + e.id * 19)}`,
            wageBase: 37000,
            employerContribution: 2220,
            employeeContribution: 0,
            status: m === '2026-09' ? 'pending_deposit' : 'deposited',
            paymentChallanNo: m === '2026-09' ? null : `NBP-${isSindh ? 'SESSI' : 'PESSI'}-${m.replace('-','')}-${String(e.id).padStart(3,'0')}`,
            paymentDate: m === '2026-09' ? null : `${m}-29`
          });
        });
      });
      this.set('sessi_ledger', sessiLedger);
    }

    // 5. Ensure Gratuity Liability Pool
    let gratuityPool = this.get('gratuity_pool');
    if (!gratuityPool || !gratuityPool.length) {
      const emps = (this.get('employees') || []).filter(e => e.status === 'active');
      const now = new Date('2026-09-08');
      gratuityPool = emps.map((e, idx) => {
        const join = new Date(e.joiningDate || '2023-01-01');
        const diffYears = (now - join) / (1000 * 60 * 60 * 24 * 365.25);
        const completedYears = Math.floor(diffYears);
        const basicSalary = Math.round(Number(e.salary || 60000) * 0.65); // Standard 65% basic ratio
        const accruedGratuity = completedYears >= 1 ? completedYears * basicSalary : 0;
        const monthlyAccrualProvision = Math.round(basicSalary / 12);

        return {
          id: idx + 1,
          employeeId: e.id,
          joiningDate: e.joiningDate,
          completedYears,
          exactTenureYears: diffYears.toFixed(1),
          basicSalary,
          eligible: completedYears >= 1,
          accruedLiability: accruedGratuity,
          monthlyProvision: monthlyAccrualProvision,
          vestingPercentage: completedYears >= 1 ? 100 : 0,
          fundedStatus: '100% Fully Provisioned'
        };
      });
      this.set('gratuity_pool', gratuityPool);
    }
  },

  calculateGeoDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // Distance in meters
  },

  ensureRosterAndGeofenceData() {
    // 1. Branch Geofences
    let geofences = this.get('branch_geofences');
    if (!geofences || !geofences.length) {
      geofences = [
        {
          id: 1, branchId: 1, branchName: 'Karachi Head Office',
          latitude: 24.8607, longitude: 67.0011, radiusMeters: 200,
          ipRange: '192.168.1.0/24, 115.186.140.0/24',
          enforceGeo: true, enforceIP: true, status: 'active',
          address: 'Plot 12, Block B, PECHS, Karachi'
        },
        {
          id: 2, branchId: 2, branchName: 'Lahore Tech Center',
          latitude: 31.5204, longitude: 74.3587, radiusMeters: 250,
          ipRange: '192.168.2.0/24, 115.186.141.0/24',
          enforceGeo: true, enforceIP: true, status: 'active',
          address: 'Gulberg III, Main Boulevard, Lahore'
        },
        {
          id: 3, branchId: 3, branchName: 'Islamabad Executive Branch',
          latitude: 33.6844, longitude: 73.0479, radiusMeters: 200,
          ipRange: '192.168.3.0/24, 115.186.142.0/24',
          enforceGeo: true, enforceIP: false, status: 'active',
          address: 'Floor 7, Executive Tower, Blue Area, Islamabad'
        }
      ];
      this.set('branch_geofences', geofences);
    }

    // 2. Biometric Devices
    let devices = this.get('biometric_devices');
    if (!devices || !devices.length) {
      devices = [
        { id: 1, name: 'ZKTeco-01 Main Lobby', serial: 'ZK-MB20-KHI-01', ip: '192.168.1.201', port: 4370, branchId: 1, location: 'Ground Floor Reception', status: 'online', lastSync: new Date().toISOString(), model: 'ZKTeco SilkBio-101TC (Face + Fingerprint)' },
        { id: 2, name: 'ZKTeco-02 Engineering Wing', serial: 'ZK-IN05-LHE-02', ip: '192.168.2.201', port: 4370, branchId: 2, location: 'Floor 2 Entry Gate', status: 'online', lastSync: new Date().toISOString(), model: 'ZKTeco IN05-A (RFID + Biometric)' },
        { id: 3, name: 'ZKTeco-03 Executive Suites', serial: 'ZK-KF50-ISB-03', ip: '192.168.3.201', port: 4370, branchId: 3, location: 'Floor 7 Turnstile', status: 'online', lastSync: new Date().toISOString(), model: 'ZKTeco ProCapture-X' }
      ];
      this.set('biometric_devices', devices);
    }

    // 3. Shift Roster for current month and next 7 days
    let roster = this.get('shift_roster');
    if (!roster || !roster.length) {
      roster = [];
      const emps = (this.get('employees') || []).filter(e => e.status === 'active');
      const today = new Date();
      let rosterId = 1;

      // Seed for current window (-3 to +7 days)
      for (let offset = -3; offset <= 7; offset++) {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

        emps.forEach(e => {
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          let shiftId = e.shiftId || 1;

          // Introduce rotational variation across support & IT
          if (e.departmentId === 8 || e.departmentId === 2) {
            if (e.id % 3 === 0) shiftId = 2; // Evening
            else if (e.id % 5 === 0) shiftId = 3; // Night
            else shiftId = 1; // Morning
          }

          roster.push({
            id: rosterId++,
            employeeId: e.id,
            date: dateStr,
            shiftId: isWeekend ? null : shiftId,
            isOff: isWeekend,
            status: isWeekend ? 'weekend' : 'scheduled',
            notes: isWeekend ? 'Weekly Rest Day' : ''
          });
        });
      }
      this.set('shift_roster', roster);
    }

    // 4. Shift Swaps
    let swaps = this.get('shift_swaps');
    if (!swaps || !swaps.length) {
      swaps = [
        {
          id: 1,
          requesterId: 4, // Fatima Raza
          targetEmployeeId: 9, // Tariq Hussain
          date: '2026-09-12',
          requestedShiftId: 2, // Wants Evening shift
          targetShiftId: 1,    // Fatima offers Morning shift
          reason: 'Family appointment in the morning; willing to cover evening shift for Tariq',
          status: 'pending_peer', // Pending Tariq's consent
          createdAt: '2026-09-08T10:15:00Z',
          peerRespondedAt: null,
          managerApprovedAt: null,
          managerRemarks: ''
        },
        {
          id: 2,
          requesterId: 7, // Bilal Qureshi (Sales)
          targetEmployeeId: 14, // Sana Ijaz
          date: '2026-09-15',
          requestedShiftId: 1, // Wants Morning
          targetShiftId: 2,    // Offers Evening
          reason: 'Doctor scheduled visit in late afternoon',
          status: 'peer_accepted', // Sana accepted; pending Manager approval
          createdAt: '2026-09-07T14:30:00Z',
          peerRespondedAt: '2026-09-07T16:00:00Z',
          managerApprovedAt: null,
          managerRemarks: ''
        },
        {
          id: 3,
          requesterId: 13, // Omar Farhan
          targetEmployeeId: 25, // Sehar Nawaz
          date: '2026-09-02',
          requestedShiftId: 2,
          targetShiftId: 1,
          reason: 'University exam revision class in morning',
          status: 'approved',
          createdAt: '2026-09-01T09:00:00Z',
          peerRespondedAt: '2026-09-01T11:00:00Z',
          managerApprovedAt: '2026-09-01T15:30:00Z',
          managerRemarks: 'Approved by Usman Baig (Deputy Manager).'
        }
      ];
      this.set('shift_swaps', swaps);
    }
  },

  ensureTalentAndLMSData() {
    // 1. 360-Degree Feedback Reviews
    let f360 = this.get('feedback_360');
    if (!f360 || !f360.length) {
      f360 = [
        {
          id: 1,
          cycle: 'Q3 2026 Annual Review',
          employeeId: 4, // Fatima Raza
          raterId: 4, // Self
          relationship: 'Self',
          scores: { technical: 4, leadership: 4, teamwork: 5, innovation: 4, values: 5 },
          overallScore: 4.4,
          strengths: 'Deep React expertise, clean architecture, high commitment to quality sprint delivery.',
          improvements: 'Could delegate more frontend boilerplate to junior engineers to focus on core design.',
          status: 'completed',
          submittedAt: '2026-08-20'
        },
        {
          id: 2,
          cycle: 'Q3 2026 Annual Review',
          employeeId: 4, // Fatima Raza
          raterId: 3, // Usman Baig (Manager)
          relationship: 'Manager',
          scores: { technical: 5, leadership: 4, teamwork: 5, innovation: 4, values: 5 },
          overallScore: 4.6,
          strengths: 'Outstanding technical velocity, reliable on production deployments, natural mentor to juniors.',
          improvements: 'Encouraged to present architectural patterns in company engineering guild seminars.',
          status: 'completed',
          submittedAt: '2026-08-22'
        },
        {
          id: 3,
          cycle: 'Q3 2026 Annual Review',
          employeeId: 4, // Fatima Raza
          raterId: 9, // Tariq Hussain (Peer)
          relationship: 'Peer',
          scores: { technical: 5, leadership: 4, teamwork: 4, innovation: 5, values: 5 },
          overallScore: 4.6,
          strengths: 'Fantastic pair programming partner; provides rigorous, helpful code reviews.',
          improvements: 'None noted.',
          status: 'completed',
          submittedAt: '2026-08-23'
        },
        {
          id: 4,
          cycle: 'Q3 2026 Annual Review',
          employeeId: 3, // Usman Baig (Deputy Manager)
          raterId: 1, // Ahmed Khan (CEO)
          relationship: 'Manager',
          scores: { technical: 5, leadership: 5, teamwork: 4, innovation: 4, values: 5 },
          overallScore: 4.6,
          strengths: 'Exemplary leadership of engineering squad, zero downtime record, great hiring decisions.',
          improvements: 'Transitioning into executive management track for upcoming CTO succession.',
          status: 'completed',
          submittedAt: '2026-08-15'
        }
      ];
      this.set('feedback_360', f360);
    }

    // 2. LMS Courses
    let courses = this.get('courses_lms');
    if (!courses || !courses.length) {
      courses = [
        {
          id: 1,
          title: 'Advanced React & TypeScript Architecture',
          category: 'Technical / Engineering',
          provider: 'Internal Tech Guild',
          duration: '24 Hours',
          cpdCredits: 15,
          level: 'Advanced',
          description: 'Production state machines, custom hooks, micro-frontends, and performance profiling.',
          modulesCount: 8,
          enrolledCount: 9,
          status: 'active'
        },
        {
          id: 2,
          title: 'AWS Certified Cloud Practitioner & Serverless',
          category: 'Cloud & Infrastructure',
          provider: 'Amazon Web Services',
          duration: '35 Hours',
          cpdCredits: 25,
          level: 'Intermediate',
          description: 'IAM security, Lambda event streaming, DynamoDB design, and CloudFormation IAC.',
          modulesCount: 12,
          enrolledCount: 6,
          status: 'active'
        },
        {
          id: 3,
          title: 'Strategic People Leadership & Talent Retention',
          category: 'Management & Leadership',
          provider: 'SHRM Executive Series',
          duration: '18 Hours',
          cpdCredits: 20,
          level: 'Executive',
          description: 'Executive coaching, high-performing team dynamics, conflict mediation, and OKR execution.',
          modulesCount: 6,
          enrolledCount: 5,
          status: 'active'
        },
        {
          id: 4,
          title: 'Corporate Infosec, Data Privacy & ISO 27001',
          category: 'Compliance & Governance',
          provider: 'Global Security Bureau',
          duration: '10 Hours',
          cpdCredits: 10,
          level: 'Mandatory',
          description: 'Phishing defense, GDPR compliance, corporate password policies, and data handling protocols.',
          modulesCount: 4,
          enrolledCount: 25,
          status: 'active'
        }
      ];
      this.set('courses_lms', courses);
    }

    // 3. Course Enrollments
    let enrollments = this.get('course_enrollments');
    if (!enrollments || !enrollments.length) {
      enrollments = [
        { id: 1, employeeId: 4, courseId: 1, progress: 100, score: 95, status: 'completed', enrolledDate: '2026-07-01', completedDate: '2026-08-10', certificateRef: 'CERT-RCT-2026-004' },
        { id: 2, employeeId: 4, courseId: 2, progress: 65, score: 0, status: 'in_progress', enrolledDate: '2026-08-15', completedDate: null, certificateRef: null },
        { id: 3, employeeId: 3, courseId: 2, progress: 100, score: 98, status: 'completed', enrolledDate: '2026-06-01', completedDate: '2026-07-15', certificateRef: 'CERT-AWS-2026-003' },
        { id: 4, employeeId: 3, courseId: 3, progress: 80, score: 0, status: 'in_progress', enrolledDate: '2026-08-01', completedDate: null, certificateRef: null },
        { id: 5, employeeId: 2, courseId: 3, progress: 100, score: 94, status: 'completed', enrolledDate: '2026-05-10', completedDate: '2026-06-25', certificateRef: 'CERT-SHRM-2026-002' },
        { id: 6, employeeId: 9, courseId: 1, progress: 45, score: 0, status: 'in_progress', enrolledDate: '2026-08-10', completedDate: null, certificateRef: null },
        { id: 7, employeeId: 13, courseId: 4, progress: 100, score: 100, status: 'completed', enrolledDate: '2026-08-01', completedDate: '2026-08-05', certificateRef: 'CERT-SEC-2026-013' }
      ];
      this.set('course_enrollments', enrollments);
    }

    // 4. Executive Succession Plans & 9-Box Grid
    let plans = this.get('succession_plans');
    if (!plans || !plans.length) {
      plans = [
        {
          id: 1,
          roleTitle: 'Chief Technology Officer / VP of Engineering',
          departmentId: 2,
          criticality: 'High',
          currentIncumbent: 'Ahmed Khan (Interim / CEO Oversight)',
          incumbentId: 1,
          successors: [
            { employeeId: 3, name: 'Usman Baig', currentRole: 'Deputy Manager', readiness: 'Ready Now (< 3 mos)', performance: 'High', potential: 'High', gridCategory: 'Star / Future Leader', developmentGoal: 'Executive Boardroom Strategy & Investor Communications' },
            { employeeId: 4, name: 'Fatima Raza', currentRole: 'Senior Software Engineer', readiness: 'Ready with Mentorship (1-2 yrs)', performance: 'High', potential: 'High', gridCategory: 'High Potential', developmentGoal: 'Cloud Infrastructure & High-Volume Architecture' }
          ]
        },
        {
          id: 2,
          roleTitle: 'Head of Human Resources',
          departmentId: 1,
          criticality: 'High',
          currentIncumbent: 'Sara Malik',
          incumbentId: 2,
          successors: [
            { employeeId: 6, name: 'Rabia Nawaz', currentRole: 'HR Executive', readiness: 'Ready with Mentorship (6-12 mos)', performance: 'High', potential: 'Medium', gridCategory: 'Core Contributor', developmentGoal: 'Enterprise Compensation & Labor Law Certifications' }
          ]
        },
        {
          id: 3,
          roleTitle: 'Sales & Revenue Director',
          departmentId: 4,
          criticality: 'Medium',
          currentIncumbent: 'Farhan Zaidi',
          incumbentId: 8,
          successors: [
            { employeeId: 7, name: 'Bilal Qureshi', currentRole: 'Sales Executive', readiness: 'Ready with Mentorship (1 yr)', performance: 'Medium', potential: 'High', gridCategory: 'Emerging Leader', developmentGoal: 'Enterprise B2B Deal Structuring & Negotiation' }
          ]
        }
      ];
      this.set('succession_plans', plans);
    }
  },

  ensureEngagementData() {
    // 1. Company Asset Inventory & Lifecycle
    let assets = this.get('assets');
    if (!assets || !assets.length || !assets[0]?.assetTag) {
      assets = [
        {
          id: 1,
          assetTag: 'AST-LPT-001',
          name: 'Apple MacBook Pro 16" M3 Max',
          category: 'Laptop',
          brand: 'Apple',
          model: 'MacBook Pro 16-inch Space Black',
          serialNumber: 'C02G4589MD6V',
          purchaseDate: '2024-03-15',
          purchaseCost: 820000,
          warrantyExpiry: '2027-03-14',
          status: 'assigned',
          assignedTo: 4, // Fatima Raza
          assignedDate: '2024-03-20',
          condition: 'excellent',
          specs: 'Apple M3 Max (16-core CPU, 40-core GPU), 64GB Unified RAM, 1TB SSD',
          location: 'Karachi Tech Hub',
          acknowledged: true,
          custodyHistory: [
            { employeeId: 4, assignedDate: '2024-03-20', returnDate: null, condition: 'New in Box', remarks: 'Handed over for primary engineering work' }
          ]
        },
        {
          id: 2,
          assetTag: 'AST-LPT-002',
          name: 'Dell Precision 5570 Mobile Workstation',
          category: 'Workstation',
          brand: 'Dell',
          model: 'Precision 5570 Silver',
          serialNumber: 'DL-5570-98412K',
          purchaseDate: '2023-11-10',
          purchaseCost: 580000,
          warrantyExpiry: '2026-11-09',
          status: 'assigned',
          assignedTo: 3, // Usman Baig
          assignedDate: '2023-11-15',
          condition: 'good',
          specs: 'Intel Core i7-12800H, 32GB DDR5 RAM, NVIDIA RTX A2000 8GB, 1TB NVMe',
          location: 'Karachi Tech Hub',
          acknowledged: true,
          custodyHistory: [
            { employeeId: 3, assignedDate: '2023-11-15', returnDate: null, condition: 'Excellent', remarks: 'Assigned for engineering management and load testing' }
          ]
        },
        {
          id: 3,
          assetTag: 'AST-LPT-003',
          name: 'Lenovo ThinkPad X1 Carbon Gen 11',
          category: 'Laptop',
          brand: 'Lenovo',
          model: 'ThinkPad X1 Carbon Ultrabook',
          serialNumber: 'LN-X1C-44210',
          purchaseDate: '2024-01-05',
          purchaseCost: 450000,
          warrantyExpiry: '2027-01-04',
          status: 'assigned',
          assignedTo: 2, // Sara Malik
          assignedDate: '2024-01-10',
          condition: 'excellent',
          specs: 'Intel Core i7-1365U, 16GB LPDDR5, 512GB NVMe SSD, 14" 2.8K OLED',
          location: 'Head Office - Executive Wing',
          acknowledged: true,
          custodyHistory: [
            { employeeId: 2, assignedDate: '2024-01-10', returnDate: null, condition: 'New in Box', remarks: 'Assigned for HR executive operations' }
          ]
        },
        {
          id: 4,
          assetTag: 'AST-MON-001',
          name: 'Dell UltraSharp 27" 4K USB-C Hub Monitor',
          category: 'Display / Monitor',
          brand: 'Dell',
          model: 'UltraSharp U2723QE',
          serialNumber: 'CN-0M381P-74261',
          purchaseDate: '2024-04-12',
          purchaseCost: 185000,
          warrantyExpiry: '2027-04-11',
          status: 'assigned',
          assignedTo: 4, // Fatima Raza
          assignedDate: '2024-04-15',
          condition: 'excellent',
          specs: '27-inch 4K UHD (3840x2160), IPS Black, 90W USB-C Power Delivery Hub',
          location: 'Karachi Tech Hub - Desk #14',
          acknowledged: true,
          custodyHistory: [
            { employeeId: 4, assignedDate: '2024-04-15', returnDate: null, condition: 'New', remarks: 'Dual monitor desk setup' }
          ]
        },
        {
          id: 5,
          assetTag: 'AST-MOB-001',
          name: 'Apple iPhone 15 Pro 256GB (QA Fleet)',
          category: 'Mobile / Tablet',
          brand: 'Apple',
          model: 'iPhone 15 Pro Natural Titanium',
          serialNumber: 'DX3L9012N6X7',
          purchaseDate: '2024-02-01',
          purchaseCost: 360000,
          warrantyExpiry: '2025-02-01',
          status: 'assigned',
          assignedTo: 9, // Tariq Hussain
          assignedDate: '2024-02-05',
          condition: 'good',
          specs: 'A17 Pro Chip, 256GB Storage, iOS 17.5 Testing Sandbox Profile',
          location: 'Karachi QA Lab',
          acknowledged: true,
          custodyHistory: [
            { employeeId: 9, assignedDate: '2024-02-05', returnDate: null, condition: 'New', remarks: 'Mobile responsive & browser automated testing device' }
          ]
        },
        {
          id: 6,
          assetTag: 'AST-VEH-001',
          name: 'Toyota Yaris ATIV 1.3 CVT (Pool Car)',
          category: 'Vehicle',
          brand: 'Toyota',
          model: 'Yaris ATIV 1.3 CVT Super White',
          serialNumber: 'TY-KHI-BFG-902',
          purchaseDate: '2023-06-20',
          purchaseCost: 4800000,
          warrantyExpiry: '2026-06-19',
          status: 'assigned',
          assignedTo: 8, // Farhan Zaidi
          assignedDate: '2023-07-01',
          condition: 'good',
          specs: 'Reg # BFG-902, Comprehensive Takaful Insured, Tracker Installed',
          location: 'Karachi Office Parking #B2',
          acknowledged: true,
          custodyHistory: [
            { employeeId: 8, assignedDate: '2023-07-01', returnDate: null, condition: 'Good', remarks: 'Sales executive corporate client mobility' }
          ]
        },
        {
          id: 7,
          assetTag: 'AST-LPT-004',
          name: 'Apple MacBook Pro 14" M2 Pro',
          category: 'Laptop',
          brand: 'Apple',
          model: 'MacBook Pro 14-inch Space Gray',
          serialNumber: 'C02F9921MD4A',
          purchaseDate: '2023-08-10',
          purchaseCost: 520000,
          warrantyExpiry: '2026-08-09',
          status: 'available',
          assignedTo: null,
          assignedDate: null,
          condition: 'excellent',
          specs: 'Apple M2 Pro (10-core CPU, 16-core GPU), 32GB RAM, 512GB SSD',
          location: 'Karachi IT Storeroom - Locker A-3',
          acknowledged: false,
          custodyHistory: []
        },
        {
          id: 8,
          assetTag: 'AST-FUR-001',
          name: 'Herman Miller Aeron Ergonomic Chair',
          category: 'Furniture / Ergonomics',
          brand: 'Herman Miller',
          model: 'Aeron Size B Graphite PostureFit SL',
          serialNumber: 'HM-AER-2023-718',
          purchaseDate: '2023-05-18',
          purchaseCost: 240000,
          warrantyExpiry: '2035-05-17',
          status: 'maintenance',
          assignedTo: null,
          assignedDate: null,
          condition: 'fair',
          specs: 'Fully adjustable arms, tilt limiter, forward tilt, carpet casters',
          location: 'Karachi Maintenance Workshop',
          acknowledged: false,
          custodyHistory: []
        }
      ];
      this.set('assets', assets);
    }

    // 2. Expense Claims & Travel Reimbursements
    let expenses = this.get('expense_claims');
    if (!expenses || !expenses.length) {
      expenses = [
        {
          id: 1,
          claimNumber: 'EXP-2026-001',
          employeeId: 4, // Fatima Raza
          title: 'AWS Certified Solutions Architect Professional Exam',
          category: 'training',
          amount: 35000,
          currency: 'PKR',
          taxAmount: 0,
          expenseDate: '2026-08-12',
          merchant: 'Amazon Web Services / Pearson VUE',
          description: 'Certification exam fee for cloud infrastructure specialization as approved in Q3 training roadmap.',
          receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="150" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">TAX INVOICE / RECEIPT</text><text x="20" y="80" font-family="Arial" font-size="12" fill="%2364748b">Merchant: Pearson VUE Testing</text><text x="20" y="110" font-family="Arial" font-size="12" fill="%2364748b">Candidate: Fatima Raza</text><text x="20" y="140" font-family="Arial" font-size="12" fill="%2364748b">Item: AWS-SAP-C02 Exam Fee</text><line x1="20" y1="170" x2="280" y2="170" stroke="%23cbd5e1" stroke-dasharray="4"/><text x="20" y="210" font-family="Arial" font-size="14" font-weight="bold" fill="%230f172a">Total Paid: PKR 35,000</text><text x="20" y="240" font-family="Arial" font-size="11" fill="%2310b981">Status: PAID VIA VISA CARD</text><rect x="20" y="270" width="260" height="80" fill="%23f1f5f9" rx="6"/><text x="150" y="315" font-family="Arial" font-size="11" fill="%23475569" text-anchor="middle">Official Pearson VUE Digital Token</text></svg>',
          status: 'reimbursed',
          managerApproval: { approvedBy: 3, approvedAt: '2026-08-14', remarks: 'Verified passing score and certification credential.' },
          financeApproval: { approvedBy: 1, approvedAt: '2026-08-16', remarks: 'Disbursed in August 2026 payroll run.' },
          payoutMethod: 'payroll',
          createdAt: '2026-08-13T10:00:00Z'
        },
        {
          id: 2,
          claimNumber: 'EXP-2026-002',
          employeeId: 3, // Usman Baig
          title: 'Client Architecture Discovery Session & Inter-City Travel',
          category: 'travel',
          amount: 48500,
          currency: 'PKR',
          taxAmount: 4200,
          expenseDate: '2026-08-22',
          merchant: 'PIA Airlines & Serena Hotel Lahore',
          description: 'Round-trip flights (KHI-LHE) and 1 night stay for enterprise fintech integration workshop.',
          receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="150" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">TRAVEL FOLIO INVOICE</text><text x="20" y="80" font-family="Arial" font-size="12" fill="%2364748b">Serena Hotel Lahore</text><text x="20" y="110" font-family="Arial" font-size="12" fill="%2364748b">Guest: Usman Baig</text><text x="20" y="140" font-family="Arial" font-size="12" fill="%2364748b">Room + Airport Transfer</text><line x1="20" y1="170" x2="280" y2="170" stroke="%23cbd5e1"/><text x="20" y="210" font-family="Arial" font-size="14" font-weight="bold" fill="%230f172a">Total Amount: PKR 48,500</text><text x="20" y="240" font-family="Arial" font-size="11" fill="%2310b981">GST Included (16% PRA)</text></svg>',
          status: 'approved',
          managerApproval: { approvedBy: 1, approvedAt: '2026-08-25', remarks: 'Client deal successfully signed.' },
          financeApproval: { approvedBy: 2, approvedAt: '2026-08-26', remarks: 'Approved for disbursement in September payroll.' },
          payoutMethod: 'payroll',
          createdAt: '2026-08-24T14:30:00Z'
        },
        {
          id: 3,
          claimNumber: 'EXP-2026-003',
          employeeId: 4, // Fatima Raza
          title: 'Home Office High-Speed Fiber Internet Allowance - August 2026',
          category: 'utilities',
          amount: 8500,
          currency: 'PKR',
          taxAmount: 1100,
          expenseDate: '2026-08-28',
          merchant: 'StormFiber Telecom',
          description: 'Monthly high-bandwidth fiber connection fee supporting remote on-call and release deployments.',
          receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="150" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">TELECOM BILL RECEIPT</text><text x="20" y="80" font-family="Arial" font-size="12" fill="%2364748b">StormFiber 100Mbps Ultra</text><text x="20" y="110" font-family="Arial" font-size="12" fill="%2364748b">Acc: SF-KHI-40912</text><text x="20" y="140" font-family="Arial" font-size="12" fill="%2364748b">Period: Aug 1 - Aug 31, 2026</text><line x1="20" y1="170" x2="280" y2="170" stroke="%23cbd5e1"/><text x="20" y="210" font-family="Arial" font-size="14" font-weight="bold" fill="%230f172a">Total Paid: PKR 8,500</text></svg>',
          status: 'pending_manager',
          managerApproval: null,
          financeApproval: null,
          payoutMethod: 'payroll',
          createdAt: '2026-08-29T11:15:00Z'
        },
        {
          id: 4,
          claimNumber: 'EXP-2026-004',
          employeeId: 9, // Tariq Hussain
          title: 'Team Sprint Retrospective & Technical Guild Lunch',
          category: 'meals',
          amount: 14200,
          currency: 'PKR',
          taxAmount: 1850,
          expenseDate: '2026-08-30',
          merchant: 'Kolachi Seaside Restaurant',
          description: 'Quarterly retrospective lunch for 6 squad engineers after successful v3.0 core release.',
          receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="150" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">DINING RECEIPT</text><text x="20" y="80" font-family="Arial" font-size="12" fill="%2364748b">Kolachi Restaurant Karachi</text><text x="20" y="110" font-family="Arial" font-size="12" fill="%2364748b">6 Covers / Table #19</text><text x="20" y="140" font-family="Arial" font-size="12" fill="%2364748b">Food &amp; Beverages</text><line x1="20" y1="170" x2="280" y2="170" stroke="%23cbd5e1"/><text x="20" y="210" font-family="Arial" font-size="14" font-weight="bold" fill="%230f172a">Total Bill: PKR 14,200</text></svg>',
          status: 'pending_finance',
          managerApproval: { approvedBy: 3, approvedAt: '2026-08-31', remarks: 'Approved squad celebration within quarterly team budget.' },
          financeApproval: null,
          payoutMethod: 'payroll',
          createdAt: '2026-08-30T17:00:00Z'
        },
        {
          id: 5,
          claimNumber: 'EXP-2026-005',
          employeeId: 7, // Bilal Qureshi
          title: 'B2B Client Hospitality Dinner & Contract Negotiation',
          category: 'meals',
          amount: 26800,
          currency: 'PKR',
          taxAmount: 3400,
          expenseDate: '2026-08-20',
          merchant: 'Okra Fine Dining Karachi',
          description: 'Executive dinner with CIO and procurement leads from Meezan Bank group.',
          receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="150" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">COMMERCIAL HOSPITALITY</text><text x="20" y="80" font-family="Arial" font-size="12" fill="%2364748b">Okra Restaurant</text><text x="20" y="110" font-family="Arial" font-size="12" fill="%2364748b">Client: Meezan Bank Leads</text><line x1="20" y1="170" x2="280" y2="170" stroke="%23cbd5e1"/><text x="20" y="210" font-family="Arial" font-size="14" font-weight="bold" fill="%230f172a">Total: PKR 26,800</text></svg>',
          status: 'approved',
          managerApproval: { approvedBy: 8, approvedAt: '2026-08-21', remarks: 'Client deal reached verbal agreement.' },
          financeApproval: { approvedBy: 1, approvedAt: '2026-08-22', remarks: 'Approved for reimbursement.' },
          payoutMethod: 'payroll',
          createdAt: '2026-08-21T09:00:00Z'
        }
      ];
      this.set('expense_claims', expenses);
    }

    // 3. Employee Helpdesk & Grievance Redressal
    let tickets = this.get('helpdesk_tickets');
    if (!tickets || !tickets.length) {
      tickets = [
        {
          id: 1,
          ticketNumber: 'TKT-2026-001',
          title: 'VPN Gateway Timeouts on Staging Kubernetes Cluster',
          category: 'it_support',
          priority: 'urgent',
          reporterId: 4, // Fatima Raza
          isAnonymous: false,
          assignedTo: 1, // Ahmed Khan / IT Lead
          department: 'IT Infrastructure',
          status: 'in_progress',
          slaHours: 4,
          createdAt: '2026-09-07T09:00:00Z',
          resolvedAt: null,
          description: 'Engineers are getting frequent WireGuard handshake drops when running kubectl port-forwarding to staging namespace.',
          messages: [
            { id: 1, senderId: 4, senderName: 'Fatima Raza', role: 'Employee', text: 'WireGuard VPN drops every 12 minutes during staging deployment cycles.', time: '2026-09-07 09:00', isInternal: false },
            { id: 2, senderId: 1, senderName: 'Ahmed Khan', role: 'Super Admin', text: 'Investigating firewall state table limit on Cisco Core router. Increasing keepalive interval.', time: '2026-09-07 09:45', isInternal: false }
          ]
        },
        {
          id: 2,
          ticketNumber: 'TKT-2026-002',
          title: 'Provident Fund / Gratuity Contribution Certificate Request',
          category: 'hr_query',
          priority: 'medium',
          reporterId: 3, // Usman Baig
          isAnonymous: false,
          assignedTo: 2, // Sara Malik
          department: 'Human Resources',
          status: 'resolved',
          slaHours: 24,
          createdAt: '2026-09-05T11:00:00Z',
          resolvedAt: '2026-09-06T10:15:00Z',
          rating: 5,
          description: 'Required official Gratuity defined benefit accumulated statement for housing finance application with Bank Alfalah.',
          messages: [
            { id: 1, senderId: 3, senderName: 'Usman Baig', role: 'Dept Manager', text: 'Please issue official stamped Gratuity & Service tenure certificate.', time: '2026-09-05 11:00', isInternal: false },
            { id: 2, senderId: 2, senderName: 'Sara Malik', role: 'HR Manager', text: 'Certificate generated and verified via HR Letters module. Attached copy sent to your official email.', time: '2026-09-06 10:15', isInternal: false }
          ]
        },
        {
          id: 3,
          ticketNumber: 'TKT-2026-003',
          title: 'Tax Withholding Slip (Section 149) for Annual Tax Return Filing',
          category: 'payroll',
          priority: 'high',
          reporterId: 8, // Farhan Zaidi
          isAnonymous: false,
          assignedTo: 2, // Sara Malik
          department: 'Payroll & Tax',
          status: 'resolved',
          slaHours: 24,
          createdAt: '2026-09-04T14:20:00Z',
          resolvedAt: '2026-09-05T09:30:00Z',
          rating: 5,
          description: 'Need FBR Section 149 annual certificate for tax year 2026 wealth reconciliation.',
          messages: [
            { id: 1, senderId: 8, senderName: 'Farhan Zaidi', role: 'Employee', text: 'My tax lawyer requires the official Section 149 withholding slip.', time: '2026-09-04 14:20', isInternal: false },
            { id: 2, senderId: 2, senderName: 'Sara Malik', role: 'HR Manager', text: 'Generated via Progressive Tax Engine with digital verification barcode. Ready in Payroll records.', time: '2026-09-05 09:30', isInternal: false }
          ]
        },
        {
          id: 4,
          ticketNumber: 'TKT-2026-004',
          title: 'Confidential: Workplace Interaction & Professional Decorum Grievance',
          category: 'confidential_grievance',
          priority: 'urgent',
          reporterId: 0,
          anonymousToken: 'ANON-HASH-7819',
          isAnonymous: true,
          assignedTo: 2, // Sara Malik (Ombudsperson)
          department: 'Workplace Ethics & Grievance Committee',
          status: 'in_progress',
          slaHours: 24,
          createdAt: '2026-09-06T16:00:00Z',
          resolvedAt: null,
          description: 'Submitting under the protection of Corporate Anti-Harassment & Whistleblower Policy. Observed repeated disparaging remarks and aggressive exclusion during project planning reviews.',
          messages: [
            { id: 1, senderId: 0, senderName: 'Protected Whistleblower (Token #7819)', role: 'Employee', text: 'Filing confidential report regarding intimidation and hostile conduct in squad meetings. Identity protected under policy.', time: '2026-09-06 16:00', isInternal: false },
            { id: 2, senderId: 2, senderName: 'Sara Malik (Ethics Officer)', role: 'HR Ombudsperson', text: 'Receipt acknowledged under strict confidentiality. The Internal Inquiry Committee has initiated a preliminary factual review. You will receive private updates here.', time: '2026-09-07 10:00', isInternal: false }
          ]
        },
        {
          id: 5,
          ticketNumber: 'TKT-2026-005',
          title: 'Docker Desktop Enterprise License Renewal',
          category: 'it_support',
          priority: 'medium',
          reporterId: 4, // Fatima Raza
          isAnonymous: false,
          assignedTo: 1,
          department: 'IT Infrastructure',
          status: 'open',
          slaHours: 48,
          createdAt: '2026-09-08T10:00:00Z',
          resolvedAt: null,
          description: 'Expiring Docker Enterprise subscription key on development workstations.',
          messages: [
            { id: 1, senderId: 4, senderName: 'Fatima Raza', role: 'Employee', text: 'Docker Desktop pop-up indicates company license expires in 5 days.', time: '2026-09-08 10:00', isInternal: false }
          ]
        }
      ];
      this.set('helpdesk_tickets', tickets);
    }
  },

  ensureCompanyPolicies() {
    let policies = this.get('company_policies');
    if (!policies || !policies.length) {
      policies = [
        {
          id: 1,
          code: 'POL-001',
          title: 'Corporate Code of Business Conduct & Professional Ethics',
          category: 'Governance & Integrity',
          version: 'v2.4 (2026 Revision)',
          effectiveDate: '2026-01-01',
          summary: 'Universal standards of corporate integrity, prevention of bribery, full conflict of interest disclosures, and fair dealing across all corporate stakeholders.',
          clauses: [
            '1. Mandatory honesty in books, financial records, client billings, and statutory FBR declarations.',
            '2. Immediate disclosure of personal, familial, or financial conflicts of interest to the Board/HR.',
            '3. Zero acceptance of gifts, commissions, or hospitality exceeding nominal cultural tokens (PKR 5,000 threshold).',
            '4. Strict confidentiality covering client architecture, proprietary algorithms, and internal employee compensation.'
          ],
          acknowledgments: [
            { employeeId: 1, signedAt: '2026-01-05 09:30', ip: '192.168.1.10' },
            { employeeId: 2, signedAt: '2026-01-06 10:15', ip: '192.168.1.12' },
            { employeeId: 3, signedAt: '2026-01-06 11:45', ip: '192.168.1.15' },
            { employeeId: 4, signedAt: '2026-01-07 14:20', ip: '192.168.1.20' }
          ]
        },
        {
          id: 2,
          code: 'POL-002',
          title: 'Workplace Dignity, Anti-Harassment & Whistleblower Protection',
          category: 'Statutory Compliance',
          version: 'v3.1 (2026 Statutory Update)',
          effectiveDate: '2026-01-01',
          summary: 'Statutory framework conforming to the Protection Against Harassment of Women at the Workplace Act. Zero tolerance for intimidation, discriminatory conduct, or retaliation against whistleblowers.',
          clauses: [
            '1. Complete prohibition of verbal, physical, psychological, or digital harassment across office premises and corporate communication platforms.',
            '2. Provision of anonymous, cryptographic grievance filing channels with direct ombudsperson triage.',
            '3. Investigation hearings completed within 14 calendar days by an impartial 3-member inquiry committee.',
            '4. Immediate termination penalty for any manager or colleague found engaging in retaliatory behavior against complainants.'
          ],
          acknowledgments: [
            { employeeId: 1, signedAt: '2026-01-05 09:30', ip: '192.168.1.10' },
            { employeeId: 2, signedAt: '2026-01-06 10:15', ip: '192.168.1.12' },
            { employeeId: 3, signedAt: '2026-01-06 11:45', ip: '192.168.1.15' },
            { employeeId: 4, signedAt: '2026-01-07 14:20', ip: '192.168.1.20' }
          ]
        },
        {
          id: 3,
          code: 'POL-003',
          title: 'Information Security, ISO 27001 Data Privacy & BYOD Rules',
          category: 'IT & Cyber Security',
          version: 'v2.2 (2026 Revision)',
          effectiveDate: '2026-01-01',
          summary: 'Protocols for securing customer data, strict clean-desk policies, mandatory hardware encryption, multi-factor authentication, and safe usage of AI engineering copilots.',
          clauses: [
            '1. Mandatory full-disk encryption (FileVault / BitLocker) and screensaver auto-lock after 3 minutes of inactivity.',
            '2. Absolute ban on uploading unredacted client production database dumps, credentials, or PII to unauthorized public LLMs.',
            '3. Multi-Factor Authentication (MFA/TOTP) enforcement across all corporate email, Git, VPN, and cloud consoles.',
            '4. Immediate notification to IT Security (it-sec@company.com) within 1 hour of any suspected phishing attempt or lost device.'
          ],
          acknowledgments: [
            { employeeId: 1, signedAt: '2026-01-05 09:30', ip: '192.168.1.10' },
            { employeeId: 2, signedAt: '2026-01-06 10:15', ip: '192.168.1.12' },
            { employeeId: 3, signedAt: '2026-01-06 11:45', ip: '192.168.1.15' },
            { employeeId: 4, signedAt: '2026-01-07 14:20', ip: '192.168.1.20' }
          ]
        },
        {
          id: 4,
          code: 'POL-004',
          title: 'Flexible Hybrid & Remote Work Operational Standard',
          category: 'Workplace Operations',
          version: 'v1.8 (2026 Revision)',
          effectiveDate: '2026-02-01',
          summary: 'Guidelines governing work-from-home allowances, core synchronous overlap hours, attendance GPS regularizations, and remote ergonomics.',
          clauses: [
            '1. Core synchronous collaboration hours: 11:00 AM to 04:00 PM PKT required for team standups and client meetings.',
            '2. High-speed home fiber internet stipend eligibility for verified remote engineering and on-call roles.',
            '3. Weekly maximum of 2 remote workdays unless formal full-remote contract addendum is executed.',
            '4. Mobile GPS attendance check-in permitted during authorized remote days subject to manager pre-approval.'
          ],
          acknowledgments: [
            { employeeId: 1, signedAt: '2026-02-02 09:00', ip: '192.168.1.10' },
            { employeeId: 3, signedAt: '2026-02-03 10:30', ip: '192.168.1.15' },
            { employeeId: 4, signedAt: '2026-02-04 11:00', ip: '192.168.1.20' }
          ]
        },
        {
          id: 5,
          code: 'POL-005',
          title: 'Commercial Travel, Mileage & Hospitality Reimbursement Rules',
          category: 'Finance & Compensation',
          version: 'v2.0 (2026 Revision)',
          effectiveDate: '2026-03-01',
          summary: 'Per diem expenditure limits, client entertainment documentation rules, approved airlines/hotels, and monthly payroll settlement timelines.',
          clauses: [
            '1. Mandatory reporting manager pre-approval prior to booking inter-city flights or hotel stays.',
            '2. Itemized receipts and NTN tax invoices required for all claims exceeding PKR 500.',
            '3. Official per diem meal limit: PKR 3,500/day for domestic travel; client entertainment requires attendee itemization.',
            '4. Final approved expense claims disbursed tax-free in the following calendar month payroll pay run.'
          ],
          acknowledgments: [
            { employeeId: 1, signedAt: '2026-03-02 09:00', ip: '192.168.1.10' },
            { employeeId: 2, signedAt: '2026-03-02 11:20', ip: '192.168.1.12' },
            { employeeId: 3, signedAt: '2026-03-03 14:10', ip: '192.168.1.15' }
          ]
        }
      ];
      this.set('company_policies', policies);
    }
  },

  ensureLifeEventsAndDependents() {
    // 1. Ensure employee_dependents table
    let dependents = this.get('employee_dependents');
    if (!dependents || !dependents.length) {
      dependents = [
        {
          id: 1,
          employeeId: 1, // Ahmed Khan
          fullName: 'Sadia Ahmed',
          relation: 'Spouse',
          gender: 'Female',
          dob: '1991-05-14',
          cnicOrBForm: '42101-9876543-2',
          bloodGroup: 'B+',
          isMedicalCovered: true,
          isEmergencyContact: true,
          emergencyPhone: '+92 300 1234567',
          beneficiaryPercent: 60,
          verified: true,
          createdAt: '2026-01-10'
        },
        {
          id: 2,
          employeeId: 1, // Ahmed Khan
          fullName: 'Ibrahim Ahmed',
          relation: 'Child',
          gender: 'Male',
          dob: '2018-09-10',
          cnicOrBForm: '42101-1122334-1',
          bloodGroup: 'B+',
          isMedicalCovered: true,
          isEmergencyContact: false,
          emergencyPhone: '',
          beneficiaryPercent: 40,
          verified: true,
          createdAt: '2026-01-10'
        },
        {
          id: 3,
          employeeId: 2, // Sara Malik
          fullName: 'Farhan Malik',
          relation: 'Spouse',
          gender: 'Male',
          dob: '1989-11-20',
          cnicOrBForm: '35202-8765432-1',
          bloodGroup: 'O+',
          isMedicalCovered: true,
          isEmergencyContact: true,
          emergencyPhone: '+92 321 7654321',
          beneficiaryPercent: 50,
          verified: true,
          createdAt: '2026-02-01'
        },
        {
          id: 4,
          employeeId: 2, // Sara Malik
          fullName: 'Ayla Malik',
          relation: 'Child',
          gender: 'Female',
          dob: '2021-03-15',
          cnicOrBForm: '35202-3344556-2',
          bloodGroup: 'O+',
          isMedicalCovered: true,
          isEmergencyContact: false,
          emergencyPhone: '',
          beneficiaryPercent: 50,
          verified: true,
          createdAt: '2026-02-01'
        },
        {
          id: 5,
          employeeId: 3, // Usman Baig
          fullName: 'Hina Usman',
          relation: 'Spouse',
          gender: 'Female',
          dob: '1988-08-12',
          cnicOrBForm: '61101-2345678-2',
          bloodGroup: 'A+',
          isMedicalCovered: true,
          isEmergencyContact: true,
          emergencyPhone: '+92 333 4567890',
          beneficiaryPercent: 50,
          verified: true,
          createdAt: '2026-02-15'
        },
        {
          id: 6,
          employeeId: 3, // Usman Baig
          fullName: 'Daniyal Usman',
          relation: 'Child',
          gender: 'Male',
          dob: '2016-07-22',
          cnicOrBForm: '61101-5566778-1',
          bloodGroup: 'A+',
          isMedicalCovered: true,
          isEmergencyContact: false,
          emergencyPhone: '',
          beneficiaryPercent: 25,
          verified: true,
          createdAt: '2026-02-15'
        },
        {
          id: 7,
          employeeId: 3, // Usman Baig
          fullName: 'Maryam Usman',
          relation: 'Child',
          gender: 'Female',
          dob: '2019-12-04',
          cnicOrBForm: '61101-9988776-2',
          bloodGroup: 'A+',
          isMedicalCovered: true,
          isEmergencyContact: false,
          emergencyPhone: '',
          beneficiaryPercent: 25,
          verified: true,
          createdAt: '2026-02-15'
        },
        {
          id: 8,
          employeeId: 4, // Fatima Raza
          fullName: 'Raza Ali',
          relation: 'Spouse',
          gender: 'Male',
          dob: '1993-02-18',
          cnicOrBForm: '42201-3456789-1',
          bloodGroup: 'AB+',
          isMedicalCovered: true,
          isEmergencyContact: true,
          emergencyPhone: '+92 345 8899001',
          beneficiaryPercent: 70,
          verified: true,
          createdAt: '2026-03-01'
        },
        {
          id: 9,
          employeeId: 4, // Fatima Raza
          fullName: 'Begum Kulsoom Raza',
          relation: 'Parent',
          gender: 'Female',
          dob: '1965-04-10',
          cnicOrBForm: '42201-1239876-2',
          bloodGroup: 'O+',
          isMedicalCovered: true,
          isEmergencyContact: false,
          emergencyPhone: '',
          beneficiaryPercent: 30,
          verified: true,
          createdAt: '2026-03-01'
        },
        {
          id: 10,
          employeeId: 5, // Bilal Qureshi
          fullName: 'Mahnoor Bilal',
          relation: 'Spouse',
          gender: 'Female',
          dob: '1994-06-25',
          cnicOrBForm: '37405-4567890-2',
          bloodGroup: 'A-',
          isMedicalCovered: true,
          isEmergencyContact: true,
          emergencyPhone: '+92 312 9988776',
          beneficiaryPercent: 100,
          verified: true,
          createdAt: '2026-03-10'
        },
        {
          id: 11,
          employeeId: 9, // Tariq Hussain
          fullName: 'Muhammad Hussain',
          relation: 'Parent',
          gender: 'Male',
          dob: '1960-10-15',
          cnicOrBForm: '42301-8765432-1',
          bloodGroup: 'B+',
          isMedicalCovered: true,
          isEmergencyContact: true,
          emergencyPhone: '+92 301 2233445',
          beneficiaryPercent: 100,
          verified: true,
          createdAt: '2026-04-01'
        }
      ];
      this.set('employee_dependents', dependents);
    }

    // Also sync legacy dependents array for backward-compatibility
    let legacyDeps = this.get('dependents') || [];
    if (legacyDeps.length < dependents.length) {
      this.set('dependents', dependents.map(d => ({
        id: d.id,
        employeeId: d.employeeId,
        name: d.fullName,
        relation: d.relation,
        dob: d.dob,
        cnic: d.cnicOrBForm
      })));
    }

    // 2. Ensure life_events table
    let lifeEvents = this.get('life_events');
    if (!lifeEvents || !lifeEvents.length) {
      lifeEvents = [
        {
          id: 1,
          employeeId: 4, // Fatima Raza
          eventType: 'childbirth',
          title: 'Birth of Daughter (Inaya Raza) & Health Cover Request',
          eventDate: '2026-08-28',
          details: 'Blessed with baby daughter Inaya Raza on August 28, 2026 at South City Hospital Karachi. Requesting registration into corporate TPA group health insurance and issuance of medical card.',
          supportingDocName: 'Hospital_Birth_Notification_NADRA_Receipt.pdf',
          status: 'pending',
          submittedOn: '2026-09-02',
          reviewedBy: null,
          reviewedOn: null,
          hrRemarks: '',
          impactActions: ['Corporate TPA Health Card Issuance', 'B-Form verification pending NADRA copy']
        },
        {
          id: 2,
          employeeId: 9, // Tariq Hussain
          eventType: 'qualification',
          title: 'Master of Science in Computer Science (MS CS) Award',
          eventDate: '2026-08-15',
          details: 'Completed MS CS degree from FAST-NUCES Karachi with 3.78 CGPA specialization in Distributed Cloud Architecture. Requesting academic records update for Q3 technical appraisal.',
          supportingDocName: 'FAST_NUCES_Official_Transcript_Degree.pdf',
          status: 'pending',
          submittedOn: '2026-09-04',
          reviewedBy: null,
          reviewedOn: null,
          hrRemarks: '',
          impactActions: ['Academic profile synchronization', 'Technical competency matrix update']
        },
        {
          id: 3,
          employeeId: 1, // Ahmed Khan
          eventType: 'marriage',
          title: 'Official Marriage Registration & Spouse Medical Card',
          eventDate: '2026-01-10',
          details: 'Marriage solemnized with Sadia Ahmed. Official Nadra Marriage Registration Certificate (MRC) submitted.',
          supportingDocName: 'NADRA_MRC_Certified_Copy.pdf',
          status: 'approved',
          submittedOn: '2026-01-15',
          reviewedBy: 2, // Sara Malik
          reviewedOn: '2026-01-16',
          hrRemarks: 'Verified with NADRA MRC copy. Added spouse to Jubilee Life Group Health Policy.',
          impactActions: ['Spouse enrolled in Health Policy', 'Emergency Contact Updated']
        },
        {
          id: 4,
          employeeId: 3, // Usman Baig
          eventType: 'address_change',
          title: 'Relocation to Bahria Town Precinct 10, Karachi',
          eventDate: '2026-05-01',
          details: 'Relocated permanent family residence. Shifted van pickup route to Bahria Town Gate 1.',
          supportingDocName: 'K-Electric_Utility_Bill_Proof.pdf',
          status: 'approved',
          submittedOn: '2026-05-03',
          reviewedBy: 2,
          reviewedOn: '2026-05-04',
          hrRemarks: 'Address and emergency contact details updated in master profile and corporate transport roster.',
          impactActions: ['Address updated', 'Transport roster aligned']
        }
      ];
      this.set('life_events', lifeEvents);
    }
  },

  ensureWebhooksAndTemplates() {
    // 1. Ensure corporate webhooks
    let webhooks = this.get('webhooks');
    if (!webhooks || !webhooks.length) {
      webhooks = [
        {
          id: 1,
          name: 'Corporate Slack #hr-announcements Channel',
          url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
          secret: 'sec_slack_hr_live_9942a',
          events: ['employee.created', 'policy.signed', 'leave.approved'],
          status: 'active',
          format: 'slack_blocks',
          lastDispatchedAt: '2026-09-08T10:15:00Z',
          lastStatus: 200,
          failureCount: 0,
          createdAt: '2026-01-01'
        },
        {
          id: 2,
          name: 'Microsoft Teams Executive Operations Deck',
          url: 'https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx@tenant/IncomingWebhook/xxx',
          secret: 'sec_msteams_deck_8812c',
          events: ['payroll.finalized', 'incident.reported', 'asset.handover'],
          status: 'active',
          format: 'adaptive_card',
          lastDispatchedAt: '2026-09-07T14:30:00Z',
          lastStatus: 200,
          failureCount: 0,
          createdAt: '2026-01-15'
        },
        {
          id: 3,
          name: 'General Ledger / SAP ERP Accounting Gateway',
          url: 'https://erp.company.internal/api/v2/integrations/hrm-payroll-sync',
          secret: 'sec_sap_ledger_hmac_4431d',
          events: ['payroll.finalized', 'expense.reimbursed'],
          status: 'active',
          format: 'json_rest',
          lastDispatchedAt: '2026-09-01T09:00:00Z',
          lastStatus: 200,
          failureCount: 0,
          createdAt: '2026-02-01'
        }
      ];
      this.set('webhooks', webhooks);
    }

    // 2. Ensure notification_templates
    let templates = this.get('notification_templates');
    if (!templates || !templates.length) {
      templates = [
        {
          id: 1,
          code: 'tpl_welcome_onboarding',
          title: 'New Hire Welcome & Portal Access Instructions',
          category: 'Onboarding & Lifecycle',
          subject: 'Welcome to {{company_name}}, {{employee_name}}! Your Portal Credentials',
          badgeColor: 'var(--primary)',
          variables: ['{{employee_name}}', '{{company_name}}', '{{username}}', '{{designation}}', '{{department}}', '{{login_url}}', '{{joining_date}}'],
          body: `Dear {{employee_name}},\n\nWelcome to {{company_name}}! We are thrilled to welcome you as our new {{designation}} in the {{department}} team, commencing on {{joining_date}}.\n\nYour employee self-service portal has been activated. Please log in using your corporate account to review onboarding requirements, verify your digital smart ID badge, and electronically sign company policies.\n\nPortal URL: {{login_url}}\nUsername: {{username}}\n\nShould you need any assistance, our HR Operations desk is available at hr@company.com.\n\nBest regards,\nPeople Operations Team\n{{company_name}}`,
          lastUpdated: '2026-08-15'
        },
        {
          id: 2,
          code: 'tpl_payslip_disbursed',
          title: 'Monthly Salary Payslip Availability Notification',
          category: 'Payroll & Compensation',
          subject: 'Your Salary Slip for {{month}} is now available — {{company_name}}',
          badgeColor: 'var(--success)',
          variables: ['{{employee_name}}', '{{company_name}}', '{{month}}', '{{net_salary}}', '{{bank_name}}', '{{account_mask}}', '{{payslip_url}}'],
          body: `Dear {{employee_name}},\n\nYour monthly salary for {{month}} has been processed and deposited to your {{bank_name}} account ending in {{account_mask}}.\n\nNet Disbursed Amount: PKR {{net_salary}}\n\nYour Section 149 Withholding Tax and statutory EOBI/SESSI deductions have been updated on your FBR ledger. You can inspect and download your encrypted electronic payslip by logging into the portal:\n\n{{payslip_url}}\n\nWarm regards,\nFinance & Payroll Directorate\n{{company_name}}`,
          lastUpdated: '2026-08-31'
        },
        {
          id: 3,
          code: 'tpl_leave_decision',
          title: 'Leave Requisition Approval / Rejection Advice',
          category: 'Time & Attendance',
          subject: 'Leave Request Status: {{status}} for {{from_date}} to {{to_date}}',
          badgeColor: 'var(--warning)',
          variables: ['{{employee_name}}', '{{leave_type}}', '{{from_date}}', '{{to_date}}', '{{days}}', '{{status}}', '{{approver_name}}', '{{remarks}}'],
          body: `Dear {{employee_name}},\n\nThis is to notify you that your leave application for {{days}} day(s) of {{leave_type}} from {{from_date}} to {{to_date}} has been {{status}} by {{approver_name}}.\n\nSupervisor Remarks: {{remarks}}\n\nYour remaining leave quota has been synchronized in the HRM attendance engine.\n\nRegards,\nLeave Administration\n{{company_name}}`,
          lastUpdated: '2026-08-20'
        },
        {
          id: 4,
          code: 'tpl_expense_reimbursed',
          title: 'Commercial Expense Claim Reimbursement Settlement',
          category: 'Finance & Reimbursements',
          subject: 'Expense Claim {{claim_number}} Approved for Reimbursement — PKR {{amount}}',
          badgeColor: 'var(--info)',
          variables: ['{{employee_name}}', '{{claim_number}}', '{{title}}', '{{amount}}', '{{month}}', '{{finance_auditor}}'],
          body: `Dear {{employee_name}},\n\nYour commercial expense claim {{claim_number}} ("{{title}}") for PKR {{amount}} has received final financial authorization from {{finance_auditor}}.\n\nThe reimbursed sum has been queued into the {{month}} automated payroll pay run tax-exempt disbursement batch.\n\nThank you for submitting itemized tax invoices.\n\nRegards,\nFinance Accounts Payable\n{{company_name}}`,
          lastUpdated: '2026-09-01'
        },
        {
          id: 5,
          code: 'tpl_policy_compliance',
          title: 'Mandatory Corporate Policy Electronic Signature Mandate',
          category: 'Governance & Compliance',
          subject: 'Action Required: Mandatory Signature on {{policy_code}} — {{policy_title}}',
          badgeColor: 'var(--danger)',
          variables: ['{{employee_name}}', '{{company_name}}', '{{policy_code}}', '{{policy_title}}', '{{version}}', '{{deadline}}', '{{sign_url}}'],
          body: `Dear {{employee_name}},\n\nIn accordance with our statutory governance framework, all personnel are required to review and electronically acknowledge {{policy_code}}: {{policy_title}} ({{version}}).\n\nCompliance Deadline: {{deadline}}\n\nPlease follow this link to execute your electronic signature:\n{{sign_url}}\n\nRegards,\nCorporate Governance & Compliance\n{{company_name}}`,
          lastUpdated: '2026-09-05'
        },
        {
          id: 6,
          code: 'tpl_cnic_expiry_alert',
          title: 'NADRA CNIC & Identity Document Expiry / Renewal Notice',
          category: 'Compliance & Identity',
          subject: 'URGENT: Your {{doc_type}} ({{doc_number}}) expires on {{expiry_date}} — Renewal Action Required',
          badgeColor: 'var(--danger)',
          variables: ['{{employee_name}}', '{{doc_type}}', '{{doc_number}}', '{{expiry_date}}', '{{days_left}}', '{{portal_url}}'],
          body: `Dear {{employee_name}},\n\nOur statutory compliance audit records indicate that your {{doc_type}} (No: {{doc_number}}) will expire on {{expiry_date}} (in {{days_left}} days).\n\nUnder corporate compliance and labor regulations, an active and verified identity document must remain on record at all times. Please take immediate steps to renew your CNIC through NADRA and upload a high-resolution attested copy to your Document Vault.\n\nUpload Link: {{portal_url}}\n\nFailure to maintain valid documentation may impact salary disbursement and corporate benefits.\n\nRegards,\nHuman Resources & Compliance Directorate\n{{company_name}}`,
          lastUpdated: '2026-09-08'
        },
        {
          id: 7,
          code: 'tpl_hr_letter_issued',
          title: 'Official HR Letter Issuance & Download Notice',
          category: 'Human Resources & Records',
          subject: 'Official HR Letter Issued: {{letter_title}} — {{company_name}}',
          badgeColor: 'var(--primary)',
          variables: ['{{employee_name}}', '{{letter_type}}', '{{letter_title}}', '{{ref_number}}', '{{issue_date}}', '{{download_url}}'],
          body: `Dear {{employee_name}},\n\nYour requested official document "{{letter_title}}" (Ref: {{ref_number}}) has been formally authorized and issued by Human Resources on {{issue_date}}.\n\nYou may view and print your digitally signed letter directly from your self-service portal:\n\n{{download_url}}\n\nBest regards,\nPeople Operations Team\n{{company_name}}`,
          lastUpdated: '2026-09-08'
        }
      ];
      this.set('notification_templates', templates);
    } else {
      if (!templates.some(t => t.code === 'tpl_cnic_expiry_alert')) {
        templates.push({
          id: 6,
          code: 'tpl_cnic_expiry_alert',
          title: 'NADRA CNIC & Identity Document Expiry / Renewal Notice',
          category: 'Compliance & Identity',
          subject: 'URGENT: Your {{doc_type}} ({{doc_number}}) expires on {{expiry_date}} — Renewal Action Required',
          badgeColor: 'var(--danger)',
          variables: ['{{employee_name}}', '{{doc_type}}', '{{doc_number}}', '{{expiry_date}}', '{{days_left}}', '{{portal_url}}'],
          body: `Dear {{employee_name}},\n\nOur statutory compliance audit records indicate that your {{doc_type}} (No: {{doc_number}}) will expire on {{expiry_date}} (in {{days_left}} days).\n\nUnder corporate compliance and labor regulations, an active and verified identity document must remain on record at all times. Please take immediate steps to renew your CNIC through NADRA and upload a high-resolution attested copy to your Document Vault.\n\nUpload Link: {{portal_url}}\n\nFailure to maintain valid documentation may impact salary disbursement and corporate benefits.\n\nRegards,\nHuman Resources & Compliance Directorate\n{{company_name}}`,
          lastUpdated: '2026-09-08'
        });
        templates.push({
          id: 7,
          code: 'tpl_hr_letter_issued',
          title: 'Official HR Letter Issuance & Download Notice',
          category: 'Human Resources & Records',
          subject: 'Official HR Letter Issued: {{letter_title}} — {{company_name}}',
          badgeColor: 'var(--primary)',
          variables: ['{{employee_name}}', '{{letter_type}}', '{{letter_title}}', '{{ref_number}}', '{{issue_date}}', '{{download_url}}'],
          body: `Dear {{employee_name}},\n\nYour requested official document "{{letter_title}}" (Ref: {{ref_number}}) has been formally authorized and issued by Human Resources on {{issue_date}}.\n\nYou may view and print your digitally signed letter directly from your self-service portal:\n\n{{download_url}}\n\nBest regards,\nPeople Operations Team\n{{company_name}}`,
          lastUpdated: '2026-09-08'
        });
        this.set('notification_templates', templates);
      }
    }
  },

  ensureBatch9Data() {
    // 1. Job Requisitions (Headcount budgeting & approvals)
    let reqs = this.get('job_requisitions');
    if (!reqs || !reqs.length) {
      reqs = [
        {
          id: 1,
          reqNumber: 'REQ-2026-001',
          title: 'Lead Cloud & DevOps Infrastructure Architect',
          departmentId: 1, // Engineering & Technology
          requestedBy: 1, // Ahmed Khan
          headcount: 2,
          employmentType: 'Permanent',
          priority: 'Urgent',
          reason: 'Expansion',
          minSalary: 280000,
          maxSalary: 380000,
          targetDate: '2026-10-15',
          status: 'approved',
          approvedBy: 1,
          approvedAt: '2026-08-25',
          notes: 'Approved for AWS multi-region architecture and enterprise Kubernetes migration.',
          jobPostId: 1,
          createdAt: '2026-08-20'
        },
        {
          id: 2,
          reqNumber: 'REQ-2026-002',
          title: 'Senior Product Designer (Design Systems & UX)',
          departmentId: 1, // Engineering
          requestedBy: 3, // Usman Baig
          headcount: 1,
          employmentType: 'Permanent',
          priority: 'High',
          reason: 'Replacement',
          minSalary: 220000,
          maxSalary: 290000,
          targetDate: '2026-10-30',
          status: 'approved',
          approvedBy: 2, // Sara Malik
          approvedAt: '2026-08-28',
          notes: 'Replacement for mobile design track. Candidate search initiated.',
          jobPostId: null,
          createdAt: '2026-08-22'
        },
        {
          id: 3,
          reqNumber: 'REQ-2026-003',
          title: 'Senior Statutory & Tax Compliance Accountant',
          departmentId: 2, // Finance & Accounts
          requestedBy: 9, // Tariq Hussain
          headcount: 1,
          employmentType: 'Permanent',
          priority: 'Medium',
          reason: 'Expansion',
          minSalary: 180000,
          maxSalary: 240000,
          targetDate: '2026-11-15',
          status: 'pending_review',
          approvedBy: null,
          approvedAt: null,
          notes: 'To support FBR quarterly withholding audits and digital invoice integrations.',
          jobPostId: null,
          createdAt: '2026-09-02'
        },
        {
          id: 4,
          reqNumber: 'REQ-2026-004',
          title: 'Enterprise Technical Sales Account Director',
          departmentId: 3, // Sales & BD
          requestedBy: 11, // Hassan Qureshi
          headcount: 2,
          employmentType: 'Permanent',
          priority: 'High',
          reason: 'Expansion',
          minSalary: 250000,
          maxSalary: 350000,
          targetDate: '2026-11-01',
          status: 'approved',
          approvedBy: 1,
          approvedAt: '2026-09-03',
          notes: 'Targeting banking and telecom accounts in Islamabad and Lahore.',
          jobPostId: null,
          createdAt: '2026-09-01'
        }
      ];
      this.set('job_requisitions', reqs);
    }

    // 2. Candidate Interview Scorecards & Evaluation Rubrics
    let scorecards = this.get('interview_scorecards');
    if (!scorecards || !scorecards.length) {
      scorecards = [
        {
          id: 1,
          applicantId: 1,
          candidateName: 'Zainab Qazi',
          jobId: 1,
          interviewerId: 1, // Ahmed Khan
          interviewerName: 'Ahmed Khan (CTO)',
          stage: 'Technical Architecture Round',
          ratings: { technical: 5, problemSolving: 5, communication: 4, cultureFit: 4, leadership: 4 },
          overallScore: 4.4,
          recommendation: 'Strong Hire',
          strengths: 'Exceptional mastery of microservices decomposition, distributed tracing, and high-concurrency event brokers.',
          concerns: 'Notice period of 60 days; negotiation required to buy out 30 days.',
          evaluatedAt: '2026-09-01'
        },
        {
          id: 2,
          applicantId: 2,
          candidateName: 'Bilal Farooq',
          jobId: 2,
          interviewerId: 3, // Usman Baig
          interviewerName: 'Usman Baig (Lead Architect)',
          stage: 'Technical Coding & System Design',
          ratings: { technical: 4, problemSolving: 4, communication: 3, cultureFit: 4, leadership: 3 },
          overallScore: 3.6,
          recommendation: 'Hire',
          strengths: 'Solid fundamentals in React, state management, and accessibility standards.',
          concerns: 'Needs mentorship on large-scale WebSocket state synchronizations.',
          evaluatedAt: '2026-09-03'
        },
        {
          id: 3,
          applicantId: 3,
          candidateName: 'Mehak Noor',
          jobId: 1,
          interviewerId: 2, // Sara Malik
          interviewerName: 'Sara Malik (HR Director)',
          stage: 'Culture Fit & Behavioral Interview',
          ratings: { technical: 4, problemSolving: 4, communication: 5, cultureFit: 5, leadership: 5 },
          overallScore: 4.6,
          recommendation: 'Strong Hire',
          strengths: 'Outstanding emotional intelligence, collaborative mindset, and proven track record of mentoring junior engineers.',
          concerns: 'None identified. Fits corporate core values seamlessly.',
          evaluatedAt: '2026-09-04'
        }
      ];
      this.set('interview_scorecards', scorecards);
    }

    // 3. Project Timesheets & Billable Hours
    let timesheets = this.get('timesheets');
    if (!timesheets || !timesheets.length) {
      timesheets = [
        {
          id: 1,
          employeeId: 1, // Ahmed Khan
          weekStartDate: '2026-08-31',
          weekEndDate: '2026-09-06',
          projectId: 1,
          projectName: 'ERP Core Banking Gateway',
          taskName: 'Microservices Architecture & Resilience Engineering',
          isBillable: true,
          hourlyRate: 50,
          currency: 'USD',
          hours: { mon: 8, tue: 8, wed: 9, thu: 8, fri: 8, sat: 0, sun: 0 },
          totalHours: 41,
          billableHours: 41,
          status: 'approved',
          submittedAt: '2026-09-06T18:00:00Z',
          approvedBy: 1,
          approvedAt: '2026-09-07T09:30:00Z',
          notes: 'Completed ISO 27001 TLS audit compliance verification.',
          syncedToPayroll: true
        },
        {
          id: 2,
          employeeId: 3, // Usman Baig
          weekStartDate: '2026-08-31',
          weekEndDate: '2026-09-06',
          projectId: 1,
          projectName: 'ERP Core Banking Gateway',
          taskName: 'API Middleware Implementation & Unit Testing',
          isBillable: true,
          hourlyRate: 40,
          currency: 'USD',
          hours: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
          totalHours: 40,
          billableHours: 40,
          status: 'approved',
          submittedAt: '2026-09-06T19:00:00Z',
          approvedBy: 1,
          approvedAt: '2026-09-07T09:35:00Z',
          notes: 'Delivered customer onboarding endpoint suites.',
          syncedToPayroll: true
        },
        {
          id: 3,
          employeeId: 4, // Fatima Raza
          weekStartDate: '2026-08-31',
          weekEndDate: '2026-09-06',
          projectId: 2,
          projectName: 'Mobile Banking & Fintech SuperApp',
          taskName: 'Biometric Login SDK Integration & FIDO2 Testing',
          isBillable: true,
          hourlyRate: 38,
          currency: 'USD',
          hours: { mon: 8, tue: 8, wed: 8, thu: 9, fri: 8, sat: 0, sun: 0 },
          totalHours: 41,
          billableHours: 41,
          status: 'approved',
          submittedAt: '2026-09-06T17:30:00Z',
          approvedBy: 1,
          approvedAt: '2026-09-07T09:40:00Z',
          notes: 'Resolved face recognition regression on Android 14 builds.',
          syncedToPayroll: true
        },
        {
          id: 4,
          employeeId: 7, // Farhan Ali
          weekStartDate: '2026-08-31',
          weekEndDate: '2026-09-06',
          projectId: 3,
          projectName: 'Internal Infrastructure Optimization',
          taskName: 'CI/CD Pipeline Automation & Build Time Optimization',
          isBillable: false,
          hourlyRate: 0,
          currency: 'USD',
          hours: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 7, sat: 0, sun: 0 },
          totalHours: 39,
          billableHours: 0,
          status: 'approved',
          submittedAt: '2026-09-06T18:15:00Z',
          approvedBy: 1,
          approvedAt: '2026-09-07T09:45:00Z',
          notes: 'Reduced Docker image build times by 42%.',
          syncedToPayroll: false
        },
        {
          id: 5,
          employeeId: 5, // Sehar Nawaz
          weekStartDate: '2026-09-07',
          weekEndDate: '2026-09-13',
          projectId: 2,
          projectName: 'Mobile Banking & Fintech SuperApp',
          taskName: 'User Flow Wireframing & Design System Tokens',
          isBillable: true,
          hourlyRate: 35,
          currency: 'USD',
          hours: { mon: 8, tue: 8, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
          totalHours: 16,
          billableHours: 16,
          status: 'submitted',
          submittedAt: '2026-09-08T15:00:00Z',
          approvedBy: null,
          approvedAt: null,
          notes: 'In progress design sprint deliverables for loan disbursement module.',
          syncedToPayroll: false
        },
        {
          id: 6,
          employeeId: 9, // Tariq Hussain
          weekStartDate: '2026-08-31',
          weekEndDate: '2026-09-06',
          projectId: 1,
          projectName: 'ERP Core Banking Gateway',
          taskName: 'Financial Ledger Reconciliation & Audit Scripts',
          isBillable: true,
          hourlyRate: 42,
          currency: 'USD',
          hours: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
          totalHours: 40,
          billableHours: 40,
          status: 'approved',
          submittedAt: '2026-09-06T17:00:00Z',
          approvedBy: 1,
          approvedAt: '2026-09-07T10:00:00Z',
          notes: 'Synchronized general ledger accounts with test banking core.',
          syncedToPayroll: false
        }
      ];
      this.set('timesheets', timesheets);
    }

    // 4. Employee Document Vault (e-DMS)
    let docs = this.get('employee_documents');
    if (!docs || !docs.length) {
      docs = [
        {
          id: 1,
          employeeId: 1, // Ahmed Khan
          title: 'Permanent Employment Contract & Non-Disclosure Agreement',
          category: 'Contracts & Agreements',
          fileName: 'Ahmed_Khan_Employment_Contract_Executed.pdf',
          fileSize: '1.4 MB',
          fileType: 'PDF',
          uploadedAt: '2026-01-15',
          expiryDate: '2029-01-15',
          verificationStatus: 'verified',
          verifiedBy: 2,
          verifiedAt: '2026-01-16',
          notes: 'Signed physical copy archived in HR cabinet A-12.'
        },
        {
          id: 2,
          employeeId: 1,
          title: 'Computerized National Identity Card (Smart CNIC)',
          category: 'Identity & Legal',
          fileName: 'Ahmed_Khan_CNIC_Both_Sides_Verified.pdf',
          fileSize: '820 KB',
          fileType: 'PDF',
          uploadedAt: '2026-01-15',
          expiryDate: '2031-08-14',
          verificationStatus: 'verified',
          verifiedBy: 2,
          verifiedAt: '2026-01-16',
          notes: 'NADRA biometric verification record cleared.'
        },
        {
          id: 3,
          employeeId: 1,
          title: 'MS Computer Science Degree Certificate (NUST)',
          category: 'Academic & Professional',
          fileName: 'Ahmed_Khan_MSCS_Degree_Attested_HEC.pdf',
          fileSize: '2.1 MB',
          fileType: 'PDF',
          uploadedAt: '2026-01-15',
          expiryDate: '',
          verificationStatus: 'verified',
          verifiedBy: 2,
          verifiedAt: '2026-01-16',
          notes: 'HEC attested degree verified.'
        },
        {
          id: 4,
          employeeId: 2, // Sara Malik
          title: 'Master of Human Resource Management (MHRM)',
          category: 'Academic & Professional',
          fileName: 'Sara_Malik_MHRM_Degree_IBA.pdf',
          fileSize: '1.8 MB',
          fileType: 'PDF',
          uploadedAt: '2026-02-01',
          expiryDate: '',
          verificationStatus: 'verified',
          verifiedBy: 1,
          verifiedAt: '2026-02-02',
          notes: 'IBA Karachi graduation degree confirmed.'
        },
        {
          id: 5,
          employeeId: 2,
          title: 'SHRM-SCP Senior Certified Professional Credential',
          category: 'Academic & Professional',
          fileName: 'Sara_Malik_SHRM_SCP_Certificate.pdf',
          fileSize: '950 KB',
          fileType: 'PDF',
          uploadedAt: '2026-02-01',
          expiryDate: '2027-12-31',
          verificationStatus: 'verified',
          verifiedBy: 1,
          verifiedAt: '2026-02-02',
          notes: 'SHRM license number verified on certification portal.'
        },
        {
          id: 6,
          employeeId: 3, // Usman Baig
          title: 'Permanent Employment Contract & IP Assignment',
          category: 'Contracts & Agreements',
          fileName: 'Usman_Baig_Employment_Agreement.pdf',
          fileSize: '1.2 MB',
          fileType: 'PDF',
          uploadedAt: '2026-02-15',
          expiryDate: '2029-02-15',
          verificationStatus: 'verified',
          verifiedBy: 2,
          verifiedAt: '2026-02-16',
          notes: 'Standard permanent IP assignment executed.'
        },
        {
          id: 7,
          employeeId: 4, // Fatima Raza
          title: 'AWS Certified Solutions Architect — Professional',
          category: 'Academic & Professional',
          fileName: 'Fatima_Raza_AWS_Solutions_Architect_Pro.pdf',
          fileSize: '1.1 MB',
          fileType: 'PDF',
          uploadedAt: '2026-03-01',
          expiryDate: '2028-03-01',
          verificationStatus: 'verified',
          verifiedBy: 1,
          verifiedAt: '2026-03-02',
          notes: 'AWS validation token: AWS-PSA-9941-VERIFIED.'
        },
        {
          id: 8,
          employeeId: 4,
          title: 'FBR Annual Tax Return & CPR Proof Form 114(1)',
          category: 'Tax & Statutory',
          fileName: 'Fatima_Raza_FBR_IncomeTax_Return_TY2025.pdf',
          fileSize: '640 KB',
          fileType: 'PDF',
          uploadedAt: '2026-08-20',
          expiryDate: '2026-12-31',
          verificationStatus: 'verified',
          verifiedBy: 2,
          verifiedAt: '2026-08-22',
          notes: 'FBR active taxpayer status confirmed on IRIS portal.'
        },
        {
          id: 9,
          employeeId: 5, // Sehar Nawaz
          title: 'Bachelor of Design (B.Des) Degree — Indus Valley',
          category: 'Academic & Professional',
          fileName: 'Sehar_Nawaz_Indus_Valley_Degree.pdf',
          fileSize: '2.4 MB',
          fileType: 'PDF',
          uploadedAt: '2026-03-15',
          expiryDate: '',
          verificationStatus: 'verified',
          verifiedBy: 2,
          verifiedAt: '2026-03-16',
          notes: 'IVS Communication Design degree verified.'
        },
        {
          id: 10,
          employeeId: 9, // Tariq Hussain
          title: 'Chartered Accountant Final Part Qualified (ICAP)',
          category: 'Academic & Professional',
          fileName: 'Tariq_Hussain_ICAP_CFAP_Certificate.pdf',
          fileSize: '1.5 MB',
          fileType: 'PDF',
          uploadedAt: '2026-04-01',
          expiryDate: '',
          verificationStatus: 'verified',
          verifiedBy: 2,
          verifiedAt: '2026-04-02',
          notes: 'ICAP registration confirmed.'
        },
        {
          id: 11,
          employeeId: 7, // Farhan Ali
          title: 'International Passport Scan (Machine Readable)',
          category: 'Identity & Legal',
          fileName: 'Farhan_Ali_Passport_MRP_Copy.pdf',
          fileSize: '1.3 MB',
          fileType: 'PDF',
          uploadedAt: '2026-09-02',
          expiryDate: '2030-05-20',
          verificationStatus: 'pending',
          verifiedBy: null,
          verifiedAt: null,
          notes: 'Submitted for international client deployment clearance.'
        },
        {
          id: 12,
          employeeId: 8, // Nadia Farooq
          title: 'Corporate Health Insurance Enrollment & TPA Card',
          category: 'Medical & Insurance',
          fileName: 'Nadia_Farooq_Jubilee_Health_Cover.pdf',
          fileSize: '780 KB',
          fileType: 'PDF',
          uploadedAt: '2026-09-04',
          expiryDate: '2027-06-30',
          verificationStatus: 'pending',
          verifiedBy: null,
          verifiedAt: null,
          notes: 'Awaiting HR benefit coordinator signoff.'
        }
      ];
      this.set('employee_documents', docs);
    }
  },

  ensureUserNotifications() {
    let notifs = this.get('user_notifications') || [];

    // Ensure Fatima Raza (id 4) has her urgent CNIC expiry reminder
    let cnicNotif = notifs.find(n => parseInt(n.recipientEmpId) === 4 && n.type === 'doc_expiry');
    if (!cnicNotif) {
      notifs.unshift({
        id: notifs.length ? Math.max(...notifs.map(x => x.id || 0)) + 1 : 1,
        recipientEmpId: 4, // Fatima Raza (Employee demo account)
        recipientRole: 'employee',
        senderRole: 'hr_manager',
        senderName: 'Sara Malik (HR Manager)',
        type: 'doc_expiry',
        priority: 'urgent',
        title: '⚠️ Urgent: NADRA CNIC Expiry Notice (Renewal Required)',
        message: 'Your NADRA CNIC (No: 42201-4567890-4) will expire on 2026-09-28 (in 20 days). Please initiate NADRA renewal and upload your renewed attested smart copy to your e-DMS Document Vault.',
        actionUrl: 'employees',
        subView: 'doc_expiry',
        actionLabel: 'Update / Re-upload CNIC',
        read: false,
        createdAt: '2026-09-08T09:30:00Z'
      });
    } else {
      cnicNotif.actionUrl = 'employees';
      cnicNotif.subView = 'doc_expiry';
      cnicNotif.actionLabel = 'Update / Re-upload CNIC';
    }

    // Ensure Fatima Raza (id 4) has her official HR letter notification
    let letterNotif = notifs.find(n => parseInt(n.recipientEmpId) === 4 && n.type === 'hr_letter');
    if (!letterNotif) {
      notifs.unshift({
        id: notifs.length ? Math.max(...notifs.map(x => x.id || 0)) + 1 : 2,
        recipientEmpId: 4, // Fatima Raza
        recipientRole: 'employee',
        senderRole: 'hr_manager',
        senderName: 'Sara Malik (HR Operations)',
        type: 'hr_letter',
        priority: 'normal',
        title: '📄 Official HR Document Issued: Salary Verification Certificate',
        message: 'Human Resources has generated and officially issued your Salary Verification Certificate (Ref: HRM/SAL/2026/014). Please review the letter and submit your electronic acknowledgment of receipt.',
        actionUrl: 'employees',
        subView: 'hr_letters',
        actionLabel: 'View & Acknowledge',
        read: false,
        createdAt: '2026-09-07T14:15:00Z'
      });
    } else {
      letterNotif.actionUrl = 'employees';
      letterNotif.subView = 'hr_letters';
      letterNotif.actionLabel = 'View & Acknowledge';
      letterNotif.title = '📄 Official HR Document Issued: Salary Verification Certificate';
    }

    // Ensure Dept Manager (id 3) has policy mandate
    if (!notifs.some(n => parseInt(n.recipientEmpId) === 3 && n.type === 'policy_mandate')) {
      notifs.unshift({
        id: notifs.length ? Math.max(...notifs.map(x => x.id || 0)) + 1 : 3,
        recipientEmpId: 3, // Usman Baig (Dept Manager)
        recipientRole: 'dept_manager',
        senderRole: 'superadmin',
        senderName: 'Ahmed Khan (Super Admin)',
        type: 'policy_mandate',
        priority: 'high',
        title: '🛡️ Compliance Mandate: IT Security & Remote Access Policy v2.4',
        message: 'All Department Leads and engineering teams are required to execute electronic acknowledgment of the revised IT Security & Acceptable Use Policy before September 15.',
        actionUrl: 'events',
        subView: 'policies',
        actionLabel: 'Review & E-Sign',
        read: false,
        createdAt: '2026-09-06T11:00:00Z'
      });
    }

    this.set('user_notifications', notifs);
  },

  ensureDisciplinaryData() {
    let types = this.get('disciplinary_types');
    if (!types || !types.length) {
      types = [
        { id: 1, code: 'ABSENT', name: 'Unauthorized Absenteeism & Habitual Late Attendance', severity: 'medium', description: 'Continuous absence without sanctioned leave or prior intimation under Standing Order 12.' },
        { id: 2, code: 'MISCONDUCT', name: 'Gross Workplace Misconduct & Insubordination', severity: 'high', description: 'Disregard of lawful orders, abusive language, or disruptive workplace behavior.' },
        { id: 3, code: 'DATA_BREACH', name: 'Information Security & Client Confidentiality Violation', severity: 'critical', description: 'Unauthorized extraction, disclosure, or transmission of proprietary source code or client data.' },
        { id: 4, code: 'NEGLIGENCE', name: 'Gross Negligence in Performance of Duties', severity: 'medium', description: 'Persistent substandard delivery causing severe project delays or financial damage.' },
        { id: 5, code: 'HARASSMENT', name: 'Workplace Harassment & Dignity Violation', severity: 'critical', description: 'Any behavior violating the Protection Against Harassment of Women at the Workplace Act.' },
        { id: 6, code: 'POLICY_BREACH', name: 'Company Policy & Code of Conduct Non-Compliance', severity: 'low', description: 'Breach of asset usage, conflict of interest, or dress code guidelines.' }
      ];
      this.set('disciplinary_types', types);
    }

    let actions = this.get('disciplinary_actions');
    if (!actions || !actions.length) {
      actions = [
        {
          id: 1,
          caseNo: 'DIS-2026-001',
          caseNumber: 'DIS-2026-001',
          employeeId: 7, // Hassan Qureshi
          typeId: 1,
          title: 'Inquiry into Habitual Unsanctioned Absence',
          reportedBy: 'Usman Baig (Tech Lead)',
          incidentDate: '2026-08-18',
          hearingDate: '2026-08-22',
          committeeMembers: 'Sara Malik (Head of HR), Usman Baig (Dept Manager)',
          description: 'Employee accumulated 6 consecutive days of unexcused absence without communication during sprint milestone.',
          allegationDetails: 'Employee accumulated 6 consecutive days of unexcused absence without communication during sprint milestone.',
          findings: 'Employee admitted family emergency but failed to notify supervisor. First written warning recommended.',
          status: 'closed',
          investigatorName: 'Sara Malik (Head of HR)',
          outcome: 'warning'
        },
        {
          id: 2,
          caseNo: 'DIS-2026-002',
          caseNumber: 'DIS-2026-002',
          employeeId: 1, // Ahmed Khan
          typeId: 6,
          title: 'Compliance Verification: Corporate Asset Security Review',
          reportedBy: 'Internal Audit & Governance',
          incidentDate: '2026-08-28',
          hearingDate: '2026-09-02',
          description: 'Routine executive compliance review for hardware token migration and remote repository security standards.',
          allegationDetails: 'Routine executive compliance review for hardware token migration and remote repository security standards.',
          findings: 'Formal written directive issued to re-authenticate hardware security keys.',
          status: 'action_taken',
          investigatorName: 'Director of Legal Affairs',
          outcome: 'written_directive'
        }
      ];
      this.set('disciplinary_actions', actions);
    }

    let warnings = this.get('warning_letters');
    if (!warnings || !warnings.length) {
      warnings = [
        {
          id: 1,
          refNo: 'WRN/2026/001',
          warningLetterNo: 'WRN/2026/001',
          actionId: 1,
          disciplinaryActionId: 1,
          employeeId: 7, // Hassan Qureshi
          warningLevel: 'first_written',
          title: 'Official First Written Warning — Unsanctioned Absence',
          subject: 'Non-compliance with Corporate Attendance & Leave Policies',
          details: 'You are hereby formally cautioned regarding 6 days of unexcused absence recorded between August 12 and August 18, 2026.',
          remediationPlan: 'Strict adherence to daily biometric attendance and prior intimation of absence.',
          remediationDays: 30,
          issuedDate: '2026-08-24',
          issueDate: '2026-08-24',
          issuedBy: 'Sara Malik (HR Operations)',
          authorizedBy: 'Director of Human Resources',
          acknowledged: true,
          acknowledgedAt: '2026-08-25T11:00:00.000Z',
          acknowledgedBy: 'Hassan Qureshi',
          signatureNotes: 'I have noted the warning and will ensure prior intimation in the future.'
        },
        {
          id: 2,
          refNo: 'WRN/2026/002',
          warningLetterNo: 'WRN/2026/002',
          actionId: 2,
          disciplinaryActionId: 2,
          employeeId: 1, // Ahmed Khan
          warningLevel: 'first_written',
          title: 'Formal Compliance Directive — Hardware Security Token Migration',
          subject: 'Mandatory Information Security Policy Adherence',
          details: 'Executive notification to complete hardware 2FA token validation by close of business.',
          remediationPlan: 'Enroll and verify primary hardware token via internal IT security desk.',
          remediationDays: 15,
          issuedDate: '2026-09-01',
          issueDate: '2026-09-01',
          issuedBy: 'Director of Legal Affairs',
          authorizedBy: 'Director of Legal Affairs & Governance',
          acknowledged: false,
          acknowledgedAt: null,
          acknowledgedBy: null,
          signatureNotes: null
        }
      ];
      this.set('warning_letters', warnings);
    }

    if (!this.get('suspensions')) this.set('suspensions', []);
    if (!this.get('terminations')) this.set('terminations', []);
    if (!this.get('termination_records')) this.set('termination_records', []);
  },

  ensureNormalizedProfileData() {
    let educations = this.get('educations');
    if (!educations || !educations.length) {
      educations = [
        { id: 1, employeeId: 1, degree: 'Master of Business Administration (MBA)', fieldOfStudy: 'Executive Management & Strategy', institution: 'LUMS (Lahore University of Management Sciences)', year: 2014, passingYear: 2014, grade: '3.85 CGPA', verified: true, verificationStatus: 'verified' },
        { id: 2, employeeId: 1, degree: 'BS Computer Science', fieldOfStudy: 'Software Engineering', institution: 'FAST-NUCES Karachi', year: 2011, passingYear: 2011, grade: '3.70 CGPA', verified: true, verificationStatus: 'verified' },
        { id: 3, employeeId: 4, degree: 'BS Software Engineering', fieldOfStudy: 'Cloud Computing & Enterprise Systems', institution: 'NED University of Engineering & Technology, Karachi', year: 2022, passingYear: 2022, grade: '3.91 CGPA', verified: true, verificationStatus: 'verified' },
        { id: 4, employeeId: 4, degree: 'Higher Secondary Certificate (HSC)', fieldOfStudy: 'Pre-Engineering', institution: 'Aga Khan Higher Secondary School, Karachi', year: 2018, passingYear: 2018, grade: 'A-1 Grade (88%)', verified: true, verificationStatus: 'verified' },
        { id: 5, employeeId: 3, degree: 'BS Computer Engineering', fieldOfStudy: 'Embedded Systems & Software Architectures', institution: 'GIKI (Ghulam Ishaq Khan Institute)', year: 2017, passingYear: 2017, grade: '3.65 CGPA', verified: true, verificationStatus: 'verified' },
        { id: 6, employeeId: 2, degree: 'Master of Human Resource Management (MHRM)', fieldOfStudy: 'Organizational Psychology & Labor Laws', institution: 'IBA Karachi', year: 2016, passingYear: 2016, grade: '3.80 CGPA', verified: true, verificationStatus: 'verified' },
        { id: 7, employeeId: 2, degree: 'BBA (Hons) Human Resources', fieldOfStudy: 'HR & Business Administration', institution: 'Karachi University Business School', year: 2014, passingYear: 2014, grade: '3.75 CGPA', verified: true, verificationStatus: 'verified' }
      ];
      this.set('educations', educations);
    }

    let workExperiences = this.get('work_experiences');
    if (!workExperiences || !workExperiences.length) {
      workExperiences = [
        { id: 1, employeeId: 4, company: 'Systems Limited', designation: 'Associate Software Engineer', jobTitle: 'Associate Software Engineer', from: '2022-07-01', to: '2024-05-31', startDate: '2022-07-01', endDate: '2024-05-31', isCurrent: false, location: 'Karachi, Pakistan', responsibilities: 'Full-stack development with React, Node.js, and PostgreSQL for multinational banking clients.', leavingReason: 'Career advancement at HRM Pro', referenceContact: 'Tariq Mehmood (VP Eng, Systems Ltd)', verificationStatus: 'verified' },
        { id: 2, employeeId: 3, company: 'NetSol Technologies', designation: 'Senior Software Engineer', jobTitle: 'Senior Software Engineer', from: '2017-09-01', to: '2021-08-31', startDate: '2017-09-01', endDate: '2021-08-31', isCurrent: false, location: 'Lahore, Pakistan', responsibilities: 'Core leasing and asset finance enterprise modules engineering.', leavingReason: 'Joined HRM Pro as Lead Engineer', referenceContact: 'Asim Raza (Director Eng, NetSol)', verificationStatus: 'verified' },
        { id: 3, employeeId: 1, company: 'Oracle Corporation PK', designation: 'Principal Solutions Architect', jobTitle: 'Principal Solutions Architect', from: '2014-06-01', to: '2019-12-31', startDate: '2014-06-01', endDate: '2019-12-31', isCurrent: false, location: 'Karachi, Pakistan', responsibilities: 'Enterprise ERP deployments, database performance engineering, and cloud migrations.', leavingReason: 'Founded HRM Pro Platform', referenceContact: 'Country Director, Oracle PK', verificationStatus: 'verified' },
        { id: 4, employeeId: 1, company: 'Techlogix Pvt. Ltd.', designation: 'Senior Consultant', jobTitle: 'Senior Consultant', from: '2011-08-01', to: '2014-05-31', startDate: '2011-08-01', endDate: '2014-05-31', isCurrent: false, location: 'Karachi, Pakistan', responsibilities: 'Business process management, core banking transformations and enterprise integration.', leavingReason: 'Joined Oracle Corporation', referenceContact: 'Engagement Manager', verificationStatus: 'verified' }
      ];
      this.set('work_experiences', workExperiences);
    }

    let emergencyContacts = this.get('emergency_contacts');
    if (!emergencyContacts || !emergencyContacts.length) {
      emergencyContacts = [
        { id: 1, employeeId: 4, name: 'Muhammad Raza', relation: 'Father', relationship: 'Father', phone: '0300-9876543', primaryPhone: '0300-9876543', altPhone: '021-34567890', secondaryPhone: '021-34567890', address: 'House # 42, Block 5, Clifton, Karachi', isPrimary: true },
        { id: 2, employeeId: 4, name: 'Amina Raza', relation: 'Mother', relationship: 'Mother', phone: '0333-1122334', primaryPhone: '0333-1122334', altPhone: '', secondaryPhone: '', address: 'House # 42, Block 5, Clifton, Karachi', isPrimary: false },
        { id: 3, employeeId: 1, name: 'Zainab Ahmed', relation: 'Spouse', relationship: 'Spouse', phone: '0321-7654321', primaryPhone: '0321-7654321', altPhone: '021-35890123', secondaryPhone: '021-35890123', address: 'DHA Phase 6, Karachi', isPrimary: true },
        { id: 4, employeeId: 3, name: 'Rashid Baig', relation: 'Brother', relationship: 'Brother', phone: '0345-9988776', primaryPhone: '0345-9988776', altPhone: '', secondaryPhone: '', address: 'Gulshan-e-Iqbal Block 13, Karachi', isPrimary: true },
        { id: 5, employeeId: 2, name: 'Tariq Malik', relation: 'Spouse', relationship: 'Spouse', phone: '0302-5544332', primaryPhone: '0302-5544332', altPhone: '021-34981122', secondaryPhone: '021-34981122', address: 'PECHS Block 2, Karachi', isPrimary: true }
      ];
      this.set('emergency_contacts', emergencyContacts);
    }

    let employeeSkills = this.get('employee_skills');
    if (!employeeSkills || !employeeSkills.length) {
      employeeSkills = [
        { id: 1, employeeId: 4, name: 'React.js & Single Page Applications', skillName: 'React.js & Single Page Applications', category: 'Technical', proficiency: 'expert', yearsOfExperience: 3.5 },
        { id: 2, employeeId: 4, name: 'Node.js & Express REST APIs', skillName: 'Node.js & Express REST APIs', category: 'Technical', proficiency: 'advanced', yearsOfExperience: 3.0 },
        { id: 3, employeeId: 4, name: 'PostgreSQL & Relational DB Architecture', skillName: 'PostgreSQL & Relational DB Architecture', category: 'Technical', proficiency: 'advanced', yearsOfExperience: 2.5 },
        { id: 4, employeeId: 4, name: 'Agile Scrum & Sprint Execution', skillName: 'Agile Scrum & Sprint Execution', category: 'Management', proficiency: 'intermediate', yearsOfExperience: 2.0 },
        { id: 5, employeeId: 4, name: 'Technical Writing & Architecture Specs', skillName: 'Technical Writing & Architecture Specs', category: 'Soft Skills', proficiency: 'advanced', yearsOfExperience: 3.0 },
        { id: 6, employeeId: 1, name: 'Enterprise Architecture & Cloud Strategy', skillName: 'Enterprise Architecture & Cloud Strategy', category: 'Management', proficiency: 'expert', yearsOfExperience: 12.0 },
        { id: 7, employeeId: 1, name: 'PostgreSQL, Oracle DB & Performance Tuning', skillName: 'PostgreSQL, Oracle DB & Performance Tuning', category: 'Technical', proficiency: 'expert', yearsOfExperience: 10.0 },
        { id: 8, employeeId: 3, name: 'Microservices & Distributed Systems', skillName: 'Microservices & Distributed Systems', category: 'Technical', proficiency: 'expert', yearsOfExperience: 7.0 },
        { id: 9, employeeId: 3, name: 'DevOps, Docker & CI/CD Automation', skillName: 'DevOps, Docker & CI/CD Automation', category: 'Technical', proficiency: 'advanced', yearsOfExperience: 5.0 },
        { id: 10, employeeId: 2, name: 'Talent Acquisition & Headhunting', skillName: 'Talent Acquisition & Headhunting', category: 'Management', proficiency: 'expert', yearsOfExperience: 9.0 },
        { id: 11, employeeId: 2, name: 'Pakistan Labor Laws & Legal Compliance', skillName: 'Pakistan Labor Laws & Legal Compliance', category: 'Management', proficiency: 'expert', yearsOfExperience: 8.0 },
        { id: 12, employeeId: 2, name: 'Employee Engagement & Mediation', skillName: 'Employee Engagement & Mediation', category: 'Soft Skills', proficiency: 'expert', yearsOfExperience: 8.5 }
      ];
      this.set('employee_skills', employeeSkills);
    }

    let certificates = this.get('employee_certificates');
    if (!certificates || !certificates.length) {
      certificates = [
        { id: 1, employeeId: 4, title: 'AWS Certified Solutions Architect – Associate', issuingBody: 'Amazon Web Services', issueDate: '2024-03-15', expiryDate: '2027-03-15', credentialId: 'AWS-SAA-8899214', credentialUrl: 'https://aws.amazon.com/verification' },
        { id: 2, employeeId: 4, title: 'Professional Scrum Master I (PSM I)', issuingBody: 'Scrum.org', issueDate: '2023-11-20', expiryDate: null, credentialId: 'SM-ORG-554210', credentialUrl: 'https://scrum.org/certificates' },
        { id: 3, employeeId: 1, title: 'Project Management Professional (PMP)', issuingBody: 'Project Management Institute (PMI)', issueDate: '2018-05-10', expiryDate: '2027-05-10', credentialId: 'PMP-994412', credentialUrl: 'https://pmi.org/verify' }
      ];
      this.set('employee_certificates', certificates);
    }
  },

  ensureTrainingAndCertificates() {
    let sessions = this.get('training_sessions');
    if (!sessions || !sessions.length) {
      sessions = [
        {
          id: 1,
          sessionCode: 'TRN-2026-001',
          title: 'Advanced OWASP Top 10 & Enterprise Application Security',
          category: 'Technical',
          trainerName: 'Farhan Zaidi (Principal Infosec Lead)',
          venueOrUrl: 'Karachi Tech Hub & Zoom Room 402',
          startDate: '2026-09-15',
          endDate: '2026-09-16',
          durationHours: 8,
          cpdCredits: 4,
          maxCapacity: 25,
          status: 'scheduled'
        },
        {
          id: 2,
          sessionCode: 'TRN-2026-002',
          title: 'Pakistani Salaried Taxation & Finance Act 2024–2026 Compliance',
          category: 'Compliance',
          trainerName: 'Bilal Ahmed (Finance & Tax Director)',
          venueOrUrl: 'Auditorium Level 2 & Hybrid Stream',
          startDate: '2026-08-20',
          endDate: '2026-08-20',
          durationHours: 4,
          cpdCredits: 2,
          maxCapacity: 40,
          status: 'completed'
        }
      ];
      this.set('training_sessions', sessions);
    }

    let attendees = this.get('training_attendees');
    if (!attendees || !attendees.length) {
      attendees = [
        { id: 1, sessionId: 2, employeeId: 4, attendanceStatus: 'completed', preAssessmentScore: 72, postAssessmentScore: 94 },
        { id: 2, sessionId: 2, employeeId: 3, attendanceStatus: 'completed', preAssessmentScore: 68, postAssessmentScore: 90 },
        { id: 3, sessionId: 1, employeeId: 4, attendanceStatus: 'registered', preAssessmentScore: 0, postAssessmentScore: 0 }
      ];
      this.set('training_attendees', attendees);
    }

    let certificates = this.get('training_certificates');
    if (!certificates || !certificates.length) {
      certificates = [
        {
          id: 1,
          certificateNo: 'CPD-2026-TAX-014',
          sessionId: 2,
          employeeId: 4,
          title: 'Corporate Certificate in Salaried Tax Compliance & FBR Regulations',
          issuedDate: '2026-08-22',
          validityYears: 2,
          verificationHash: '9e8a71c841b53e8d2e8b64e9a0c1f58273b4291845f0962d7c184029381ea2bb',
          cpdCredits: 2,
          score: 94
        }
      ];
      this.set('training_certificates', certificates);
    }

    if (!this.get('training_feedbacks') || !this.get('training_feedbacks').length) {
      this.set('training_feedbacks', [
        { id: 1, sessionId: 2, employeeId: 4, rating: 5, feedbackText: 'Exceptional coverage of corporate tax compliance and deductions under Finance Act 2026.', createdAt: '2026-08-21T10:00:00.000Z' }
      ]);
    }
  },

  ensureRBACData() {
    let modules = this.get('system_modules');
    if (!modules || !modules.length) {
      modules = [
        { id: 1, code: 'dashboard', name: 'Executive Dashboard & Telemetry', category: 'General', icon: 'fa-gauge-high', sortOrder: 1, isActive: true },
        { id: 2, code: 'employees', name: 'Personnel & Employee Dossiers', category: 'Human Resources', icon: 'fa-users', sortOrder: 2, isActive: true },
        { id: 3, code: 'attendance', name: 'Time & Attendance Roster', category: 'Operations', icon: 'fa-clock', sortOrder: 3, isActive: true },
        { id: 4, code: 'leaves', name: 'Leave Allocations & Quotas', category: 'Operations', icon: 'fa-calendar-xmark', sortOrder: 4, isActive: true },
        { id: 5, code: 'payroll', name: 'Compensation, Tax & Payroll', category: 'Finance', icon: 'fa-money-bill-wave', sortOrder: 5, isActive: true },
        { id: 6, code: 'travel_expenses', name: 'Business Travel & Expense Claims', category: 'Finance', icon: 'fa-plane-departure', sortOrder: 6, isActive: true },
        { id: 7, code: 'performance', name: 'Performance Appraisals & KPIs', category: 'Talent', icon: 'fa-chart-line', sortOrder: 7, isActive: true },
        { id: 8, code: 'recruitment', name: 'Talent Acquisition & Pipeline', category: 'Talent', icon: 'fa-briefcase', sortOrder: 8, isActive: true },
        { id: 9, code: 'discipline', name: 'Legal Inquiries & Disciplinary Notices', category: 'Compliance', icon: 'fa-gavel', sortOrder: 9, isActive: true },
        { id: 10, code: 'assets', name: 'Corporate Asset Inventory', category: 'Operations', icon: 'fa-laptop-file', sortOrder: 10, isActive: true },
        { id: 11, code: 'settings', name: 'Governance, RBAC & Configurations', category: 'Administration', icon: 'fa-sliders', sortOrder: 11, isActive: true }
      ];
      this.set('system_modules', modules);
    }

    let roles = this.get('roles');
    if (!roles || !roles.length) {
      roles = [
        { id: 1, code: 'superadmin', name: 'Super Administrator', description: 'Full sovereign authorization across all enterprise models and configurations', isSystem: true, priority: 1 },
        { id: 2, code: 'hr_manager', name: 'HR Manager', description: 'Complete human capital administration, legal letters, inquiries, and recruitment', isSystem: true, priority: 2 },
        { id: 3, code: 'dept_manager', name: 'Department Manager', description: 'Team supervisory management, attendance approvals, and travel endorsements', isSystem: true, priority: 3 },
        { id: 4, code: 'payroll_accountant', name: 'Corporate Payroll & Tax Accountant', description: 'Salary processing, statutory tax slabs, and expense claim settlements', isSystem: false, priority: 4 },
        { id: 5, code: 'employee', name: 'Regular Staff / Associate', description: 'Standard self-service profile, expense filing, travel requests, and leave booking', isSystem: true, priority: 5 }
      ];
      this.set('roles', roles);
    }

    let permissions = this.get('permissions');
    if (!permissions || !permissions.length) {
      permissions = [];
      let permId = 1;
      const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
      modules.forEach(m => {
        actions.forEach(a => {
          permissions.push({
            id: permId++,
            code: `${m.code}.${a}`,
            name: `${a.toUpperCase()} ${m.name}`,
            moduleId: m.id,
            action: a,
            description: `Permission to ${a} within ${m.name}`
          });
        });
      });
      this.set('permissions', permissions);
    }

    let rolePermissions = this.get('role_permissions');
    if (!rolePermissions || !rolePermissions.length) {
      rolePermissions = [];
      let rpId = 1;
      permissions.forEach(p => {
        // Superadmin has everything
        rolePermissions.push({ id: rpId++, roleId: 1, permissionId: p.id, isGranted: true });

        // HR Manager: everything except settings.delete and settings.export
        const isHrGranted = !p.code.startsWith('settings.delete') && !p.code.startsWith('settings.export');
        rolePermissions.push({ id: rpId++, roleId: 2, permissionId: p.id, isGranted: isHrGranted });

        // Dept Manager: view, approve team items
        const isDeptGranted = p.action === 'view' || p.action === 'approve' || (['travel_expenses', 'attendance', 'leaves'].some(k => p.code.startsWith(k)) && (p.action === 'create' || p.action === 'edit'));
        rolePermissions.push({ id: rpId++, roleId: 3, permissionId: p.id, isGranted: isDeptGranted });

        // Payroll Accountant: payroll + travel_expenses + dashboard
        const isPayrollGranted = p.code.startsWith('payroll.') || p.code.startsWith('travel_expenses.') || p.code.startsWith('dashboard.view');
        rolePermissions.push({ id: rpId++, roleId: 4, permissionId: p.id, isGranted: isPayrollGranted });

        // Employee: self-service view, create on travel/leaves/expenses
        const isEmpGranted = (p.action === 'view' && !['settings', 'discipline'].includes(p.code.split('.')[0])) ||
                             (['leaves.create', 'travel_expenses.create', 'attendance.create'].includes(p.code));
        rolePermissions.push({ id: rpId++, roleId: 5, permissionId: p.id, isGranted: isEmpGranted });
      });
      this.set('role_permissions', rolePermissions);
    }

    let userRoles = this.get('user_roles');
    if (!userRoles || !userRoles.length) {
      userRoles = [
        { id: 1, userId: 1, roleId: 1, assignedAt: '2026-01-01T00:00:00.000Z' }, // Ahmed Khan -> Super Admin
        { id: 2, userId: 2, roleId: 2, assignedAt: '2026-01-01T00:00:00.000Z' }, // Sara Malik -> HR Manager
        { id: 3, userId: 3, roleId: 3, assignedAt: '2026-01-01T00:00:00.000Z' }, // Usman Baig -> Dept Manager
        { id: 4, userId: 4, roleId: 5, assignedAt: '2026-01-01T00:00:00.000Z' }  // Fatima Raza -> Employee
      ];
      this.set('user_roles', userRoles);
    }

    if (!this.get('user_permissions')) {
      this.set('user_permissions', []);
    }
  },

  ensureTravelAndExpenseData() {
    let categories = this.get('expense_categories');
    if (!categories || !categories.length) {
      categories = [
        { id: 1, name: 'Airfare & Commercial Flights', code: 'TRV-AIR', maxDailyLimit: 150000, requiresReceipt: true, isPerDiem: false, description: 'Domestic & International flight bookings, baggage fees, and taxes' },
        { id: 2, name: 'Hotel Lodging & Accommodation', code: 'TRV-HOTEL', maxDailyLimit: 25000, requiresReceipt: true, isPerDiem: false, description: 'Standard business class hotel bookings with tax invoice' },
        { id: 3, name: 'Daily Per-Diem Meal Allowance', code: 'TRV-MEAL', maxDailyLimit: 4500, requiresReceipt: false, isPerDiem: true, description: 'Standard corporate per-diem sustenance allowance (PKR 4,500/day)' },
        { id: 4, name: 'Inter-City & Local Transport / Cab', code: 'TRV-CAB', maxDailyLimit: 8000, requiresReceipt: true, isPerDiem: false, description: 'Airport transfers, Uber/Careem rides, and inter-city car rentals' },
        { id: 5, name: 'Client Hospitality & Business Dinners', code: 'TRV-HOSP', maxDailyLimit: 20000, requiresReceipt: true, isPerDiem: false, description: 'Official stakeholder entertainment with itemized receipts' }
      ];
      this.set('expense_categories', categories);
    }

    let travelRequests = this.get('travel_requests');
    if (!travelRequests || !travelRequests.length) {
      travelRequests = [
        {
          id: 1,
          requestNo: 'TRV-2026-001',
          employeeId: 4, // Fatima Raza
          purpose: 'Client Architecture Discovery & ERP Integration Kickoff',
          travelType: 'domestic',
          departureDate: '2026-09-18',
          returnDate: '2026-09-20',
          originCity: 'Karachi',
          destinationCity: 'Islamabad',
          destinationCountry: 'Pakistan',
          travelMode: 'Flight',
          estimatedBudget: 85000,
          advanceAmount: 40000,
          advanceStatus: 'approved',
          status: 'approved',
          approvedBy: 1,
          approvedAt: '2026-09-08T10:00:00.000Z',
          notes: 'Mandatory technical architecture alignment with client Ministry stakeholders.'
        },
        {
          id: 2,
          requestNo: 'TRV-2026-002',
          employeeId: 3, // Usman Baig
          purpose: 'Regional Data Center Infrastructure & Security Audit',
          travelType: 'domestic',
          departureDate: '2026-09-24',
          returnDate: '2026-09-26',
          originCity: 'Karachi',
          destinationCity: 'Lahore',
          destinationCountry: 'Pakistan',
          travelMode: 'Flight',
          estimatedBudget: 72000,
          advanceAmount: 35000,
          advanceStatus: 'requested',
          status: 'pending',
          approvedBy: null,
          approvedAt: null,
          notes: 'Physical node verification and failover switch testing.'
        }
      ];
      this.set('travel_requests', travelRequests);
    }

    let travelExpenses = this.get('travel_expenses');
    if (!travelExpenses || !travelExpenses.length) {
      travelExpenses = [
        {
          id: 1,
          travelRequestId: 1,
          categoryId: 1,
          expenseDate: '2026-09-18',
          title: 'Serene Air Roundtrip KHI-ISB-KHI',
          amount: 38500,
          currency: 'PKR',
          merchant: 'Serene Air Aviation',
          receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220" viewBox="0 0 300 220"><rect width="300" height="220" fill="%23f0f9ff" stroke="%230284c7" stroke-width="2"/><text x="150" y="36" font-family="Arial" font-size="14" font-weight="bold" fill="%230369a1" text-anchor="middle">AIRLINE E-TICKET RECEIPT</text><text x="20" y="70" font-family="Arial" font-size="11" fill="%23334155">Serene Air Flight ER-502</text><text x="20" y="95" font-family="Arial" font-size="11" fill="%23334155">Passenger: Fatima Raza</text><text x="20" y="120" font-family="Arial" font-size="11" fill="%23334155">Sector: KHI - ISB (Roundtrip)</text><line x1="20" y1="140" x2="280" y2="140" stroke="%23bae6fd"/><text x="20" y="170" font-family="Arial" font-size="13" font-weight="bold" fill="%230f172a">Total Paid: PKR 38,500</text><text x="20" y="195" font-family="Arial" font-size="10" fill="%230284c7">Status: Confirmed E-Ticket</text></svg>',
          receiptNo: 'SER-98124',
          isBillable: true,
          status: 'approved'
        },
        {
          id: 2,
          travelRequestId: 1,
          categoryId: 3,
          expenseDate: '2026-09-18',
          title: 'Day 1 Per-Diem Meal Allowance',
          amount: 4500,
          currency: 'PKR',
          merchant: 'Official Corporate Per-Diem Entitlement',
          receiptUrl: null,
          receiptNo: 'DIEM-2026-01',
          isBillable: false,
          status: 'approved'
        }
      ];
      this.set('travel_expenses', travelExpenses);
    }

    let travelApprovals = this.get('travel_approvals');
    if (!travelApprovals || !travelApprovals.length) {
      travelApprovals = [
        {
          id: 1,
          travelRequestId: 1,
          approverId: 1, // Ahmed Khan
          step: 'manager',
          status: 'approved',
          comments: 'Business travel confirmed. Advance of PKR 40,000 sanctioned for disbursement.',
          actionAt: '2026-09-08T10:30:00.000Z'
        }
      ];
      this.set('travel_approvals', travelApprovals);
    }

    let expenseSettlements = this.get('expense_settlements');
    if (!expenseSettlements || !expenseSettlements.length) {
      expenseSettlements = [
        {
          id: 1,
          claimId: 1,
          settlementRef: 'SET-2026-001',
          settlementMethod: 'Payroll',
          payoutAmount: 48500,
          disbursementDate: '2026-08-31',
          financeOfficerId: 2
        }
      ];
      this.set('expense_settlements', expenseSettlements);
    }
  },

  ensureSalaryStructureData() {
    let structures = this.get('salary_structures');
    if (!structures || !structures.length) {
      structures = [
        {
          id: 1,
          name: 'Executive Leadership Scale (Grade E-1)',
          code: 'EXEC-E1',
          description: 'C-Suite, VP, and Director level grade compensation package',
          basePercentage: 45.0,
          hraPercentage: 30.0,
          medicalPercentage: 15.0,
          conveyancePercentage: 10.0,
          isActive: true
        },
        {
          id: 2,
          name: 'Senior Engineering & Technical Scale (Grade S-3)',
          code: 'TECH-S3',
          description: 'Principal Architects, Lead Engineers, and Department Managers',
          basePercentage: 50.0,
          hraPercentage: 25.0,
          medicalPercentage: 15.0,
          conveyancePercentage: 10.0,
          isActive: true
        },
        {
          id: 3,
          name: 'Professional Associate Scale (Grade G-2)',
          code: 'ASSOC-G2',
          description: 'Specialists, Software Developers, and Human Resource Officers',
          basePercentage: 50.0,
          hraPercentage: 25.0,
          medicalPercentage: 15.0,
          conveyancePercentage: 10.0,
          isActive: true
        }
      ];
      this.set('salary_structures', structures);
    }

    let components = this.get('salary_components');
    if (!components || !components.length) {
      components = [
        { id: 1, name: 'Basic Salary', code: 'BASIC', type: 'earning', calculationType: 'percentage', isTaxable: true, isStatutory: true, defaultValue: 50.0 },
        { id: 2, name: 'House Rent Allowance (HRA)', code: 'HRA', type: 'earning', calculationType: 'percentage', isTaxable: true, isStatutory: false, defaultValue: 25.0 },
        { id: 3, name: 'Medical Allowance', code: 'MED', type: 'earning', calculationType: 'percentage', isTaxable: false, isStatutory: false, defaultValue: 15.0 },
        { id: 4, name: 'Conveyance / Transport Allowance', code: 'CONV', type: 'earning', calculationType: 'percentage', isTaxable: true, isStatutory: false, defaultValue: 10.0 },
        { id: 5, name: 'Employee Provident Fund (PF)', code: 'PF_DED', type: 'deduction', calculationType: 'percentage', isTaxable: false, isStatutory: true, defaultValue: 8.33 },
        { id: 6, name: 'EOBI Contribution', code: 'EOBI', type: 'deduction', calculationType: 'fixed', isTaxable: false, isStatutory: true, defaultValue: 1300 },
        { id: 7, name: 'Income Tax Withholding (FBR Slabs)', code: 'TAX_WITHHOLD', type: 'deduction', calculationType: 'fixed', isTaxable: false, isStatutory: true, defaultValue: 0 }
      ];
      this.set('salary_components', components);
    }

    let empSalaries = this.get('employee_salaries');
    if (!empSalaries || !empSalaries.length) {
      empSalaries = [
        { id: 1, employeeId: 1, structureId: 1, basicSalary: 180000, grossSalary: 400000, currency: 'PKR', effectiveDate: '2026-01-01' },
        { id: 2, employeeId: 2, structureId: 2, basicSalary: 125000, grossSalary: 250000, currency: 'PKR', effectiveDate: '2026-01-01' },
        { id: 3, employeeId: 3, structureId: 2, basicSalary: 110000, grossSalary: 220000, currency: 'PKR', effectiveDate: '2026-01-01' },
        { id: 4, employeeId: 4, structureId: 3, basicSalary: 75000, grossSalary: 150000, currency: 'PKR', effectiveDate: '2026-01-01' }
      ];
      this.set('employee_salaries', empSalaries);
    }

    let reviews = this.get('salary_reviews');
    if (!reviews || !reviews.length) {
      reviews = [
        {
          id: 1,
          employeeId: 4,
          oldGross: 130000,
          newGross: 150000,
          incrementPercentage: 15.38,
          reviewDate: '2026-06-30',
          effectiveDate: '2026-07-01',
          approvedBy: 1,
          remarks: 'Mid-year performance appraisal adjustment for outstanding contributions to modern frontend architecture.'
        }
      ];
      this.set('salary_reviews', reviews);
    }

    if (!this.get('salary_slip_items')) {
      this.set('salary_slip_items', []);
    }
  },

  ensureHierarchyData() {
    let orgs = this.get('organizations');
    if (!orgs || !orgs.length) {
      orgs = [
        {
          id: 1,
          name: 'Apex Global Enterprises (Pvt) Ltd',
          code: 'APEX-GRP',
          taxId: 'TRN-998822-PK',
          currency: 'PKR',
          fiscalYearStart: '07-01',
          website: 'https://apexglobal.example.com',
          logoUrl: null,
          email: 'corp@apexglobal.example.com',
          phone: '+92 21 3581 9000',
          address: 'Plot 14-C, Khayaban-e-Shahbaz, Phase 6 DHA, Karachi'
        }
      ];
      this.set('organizations', orgs);
    }

    let bus = this.get('business_units');
    if (!bus || !bus.length) {
      bus = [
        { id: 1, orgId: 1, name: 'Digital Solutions & Enterprise Platforms', code: 'BU-DSEP', headEmployeeId: 1, description: 'Core software engineering, cloud architecture, and SaaS product engineering' },
        { id: 2, orgId: 1, name: 'Corporate Advisory & FinTech Services', code: 'BU-CAFS', headEmployeeId: 2, description: 'Financial consulting, risk compliance, and B2B billing solutions' },
        { id: 3, orgId: 1, name: 'Shared Services & Human Capital', code: 'BU-SSHC', headEmployeeId: 2, description: 'Enterprise HR, talent development, facilities, and administration' }
      ];
      this.set('business_units', bus);
    }

    let divs = this.get('divisions');
    if (!divs || !divs.length) {
      divs = [
        { id: 1, businessUnitId: 1, name: 'Cloud & Infrastructure Architecture', code: 'DIV-CIA', headEmployeeId: 3, description: 'Public cloud deployments, DevOps pipelines, and cybersecurity' },
        { id: 2, businessUnitId: 1, name: 'Product Engineering & Full-Stack Apps', code: 'DIV-PEFA', headEmployeeId: 4, description: 'Web application frontend, backend services, and mobile APIs' },
        { id: 3, businessUnitId: 2, name: 'Treasury & Statutory Audit', code: 'DIV-TSA', headEmployeeId: 2, description: 'Corporate taxation, payroll accounting, and statutory ledger' },
        { id: 4, businessUnitId: 3, name: 'Talent Acquisition & Employee Experience', code: 'DIV-TAEE', headEmployeeId: 2, description: 'Recruitment pipelines, onboarding dossiers, and employee welfare' }
      ];
      this.set('divisions', divs);
    }

    let depts = this.get('departments') || [];
    let deptsUpdated = false;
    depts.forEach(d => {
      if (!d.divisionId) {
        deptsUpdated = true;
        if (d.id === 1) { d.divisionId = 4; d.businessUnitId = 3; }
        else if (d.id === 2) { d.divisionId = 2; d.businessUnitId = 1; }
        else if (d.id === 3) { d.divisionId = 3; d.businessUnitId = 2; }
        else if (d.id === 4) { d.divisionId = 2; d.businessUnitId = 1; }
        else { d.divisionId = 4; d.businessUnitId = 3; }
      }
    });
    if (deptsUpdated) {
      this.set('departments', depts);
    }

    let countries = this.get('countries');
    if (!countries || !countries.length) {
      countries = [
        { id: 1, name: 'Pakistan', code: 'PAK', iso2: 'PK', phoneCode: '+92', currency: 'PKR', status: 'active' },
        { id: 2, name: 'United Arab Emirates', code: 'ARE', iso2: 'AE', phoneCode: '+971', currency: 'AED', status: 'active' },
        { id: 3, name: 'United Kingdom', code: 'GBR', iso2: 'GB', phoneCode: '+44', currency: 'GBP', status: 'active' },
        { id: 4, name: 'United States', code: 'USA', iso2: 'US', phoneCode: '+1', currency: 'USD', status: 'active' }
      ];
      this.set('countries', countries);
    }

    let states = this.get('states');
    if (!states || !states.length) {
      states = [
        { id: 1, countryId: 1, name: 'Sindh', code: 'SD' },
        { id: 2, countryId: 1, name: 'Punjab', code: 'PB' },
        { id: 3, countryId: 1, name: 'Federal Capital Islamabad', code: 'ICT' },
        { id: 4, countryId: 2, name: 'Dubai', code: 'DXB' }
      ];
      this.set('states', states);
    }

    let cities = this.get('cities');
    if (!cities || !cities.length) {
      cities = [
        { id: 1, stateId: 1, name: 'Karachi', postalCode: '75500' },
        { id: 2, stateId: 2, name: 'Lahore', postalCode: '54000' },
        { id: 3, stateId: 3, name: 'Islamabad', postalCode: '44000' },
        { id: 4, stateId: 4, name: 'Dubai Downtown', postalCode: '00000' }
      ];
      this.set('cities', cities);
    }

    let locs = this.get('locations') || [];
    let locsUpdated = false;
    locs.forEach(l => {
      if (!l.cityId) {
        locsUpdated = true;
        if (l.id === 1) { l.cityId = 1; l.stateId = 1; l.countryId = 1; l.address = 'Plot 12, Block B, PECHS, Karachi'; }
        else if (l.id === 2) { l.cityId = 2; l.stateId = 2; l.countryId = 1; l.address = 'Gulberg III, Main Boulevard, Lahore'; }
        else if (l.id === 3) { l.cityId = 3; l.stateId = 3; l.countryId = 1; l.address = 'Blue Area, Sector F-7, Islamabad'; }
        else { l.cityId = 1; l.stateId = 1; l.countryId = 1; l.address = 'Metropolitan Office'; }
      }
    });
    if (locsUpdated) {
      this.set('locations', locs);
    }

    let brs = this.get('branches') || [];
    let brsUpdated = false;
    brs.forEach(b => {
      if (!b.locationId) {
        brsUpdated = true;
        b.locationId = b.id <= 3 ? b.id : 1;
      }
    });
    if (brsUpdated) {
      this.set('branches', brs);
    }
  },

  ensureExitLifecycleData() {
    let reasons = this.get('exit_reasons');
    if (!reasons || !reasons.length) {
      reasons = [
        { id: 1, code: 'BETTER_OFFER', reason: 'Better Compensation / Career Opportunity', category: 'voluntary', isActive: true },
        { id: 2, code: 'RELOCATION', reason: 'Geographical Relocation / Family Relocation', category: 'voluntary', isActive: true },
        { id: 3, code: 'HIGHER_STUDIES', reason: 'Higher Education / Post-Graduate Studies', category: 'voluntary', isActive: true },
        { id: 4, code: 'HEALTH_PERSONAL', reason: 'Health / Personal / Family Reasons', category: 'voluntary', isActive: true },
        { id: 5, code: 'CONTRACT_END', reason: 'End of Employment Contract / Project Completion', category: 'involuntary', isActive: true },
        { id: 6, code: 'PERFORMANCE', reason: 'Performance Incompatibility / PIP Failure', category: 'involuntary', isActive: true }
      ];
      this.set('exit_reasons', reasons);
    }

    let resignations = this.get('resignations');
    if (!resignations || !resignations.length) {
      resignations = [
        {
          id: 1,
          resignationNo: 'RES-2026-001',
          employeeId: 9, // Tariq Hussain
          submissionDate: '2026-08-15',
          proposedLastDay: '2026-09-15',
          actualLastDay: '2026-09-15',
          reasonId: 1,
          reasonDetails: 'Secured international Senior Cloud Architect engagement in UAE.',
          status: 'approved',
          noticePeriodDays: 30,
          noticeWaivedDays: 0,
          managerApproved: true,
          hrApproved: true,
          remarks: 'Smooth handover in progress. Asset return and knowledge transfer scheduled.'
        }
      ];
      this.set('resignations', resignations);
    }

    let interviews = this.get('exit_interviews');
    if (!interviews || !interviews.length) {
      interviews = [
        {
          id: 1,
          resignationId: 1,
          employeeId: 9,
          interviewerId: 2, // Sara Malik
          interviewDate: '2026-09-02',
          primaryReason: 'Better Compensation & Overseas Relocation',
          companyCultureRating: 4,
          managementRating: 4,
          compensationRating: 3,
          workLifeBalanceRating: 4,
          wouldRecommend: true,
          feedbackPros: 'Great technical culture, highly collaborative engineering peers, and transparent leadership.',
          feedbackCons: 'Compensation benchmarks could be updated more frequently to reflect international parity.',
          suggestions: 'Introduce remote work allowances and foreign currency pegged bonuses.',
          status: 'completed'
        }
      ];
      this.set('exit_interviews', interviews);
    }

    let clearances = this.get('clearances');
    if (!clearances || !clearances.length) {
      clearances = [
        { id: 1, resignationId: 1, employeeId: 9, department: 'IT & Security', clearedBy: 3, clearanceDate: '2026-09-05', status: 'cleared', assetReturned: true, handoverNotes: 'GitHub repository rights, AWS IAM access revoked, and company laptop checked.', duesPending: 0 },
        { id: 2, resignationId: 1, employeeId: 9, department: 'Finance & Accounts', clearedBy: 1, clearanceDate: '2026-09-06', status: 'cleared', assetReturned: false, handoverNotes: 'Travel expense advances fully cleared. No company credit balance outstanding.', duesPending: 0 },
        { id: 3, resignationId: 1, employeeId: 9, department: 'Human Resources', clearedBy: 2, clearanceDate: '2026-09-07', status: 'cleared', assetReturned: true, handoverNotes: 'Medical insurance card returned, employee ID access badge surrendered.', duesPending: 0 },
        { id: 4, resignationId: 1, employeeId: 9, department: 'Administration & Facilities', clearedBy: 2, clearanceDate: '2026-09-07', status: 'cleared', assetReturned: true, handoverNotes: 'Office locker keys surrendered and parking permit cancelled.', duesPending: 0 }
      ];
      this.set('clearances', clearances);
    }

    let settlements = this.get('final_settlements');
    if (!settlements || !settlements.length) {
      settlements = [
        {
          id: 1,
          settlementNo: 'FNF-2026-001',
          resignationId: 1,
          employeeId: 9,
          settlementDate: '2026-09-08',
          payableDays: 15,
          basicDue: 90000,
          allowancesDue: 35000,
          leaveEncashment: 24000,
          gratuityAmount: 180000,
          bonusAmount: 0,
          noticePeriodPay: 0,
          totalEarnings: 329000,
          deductionsDue: 18500,
          taxDeduction: 22000,
          totalDeductions: 40500,
          netSettlement: 288500,
          paymentStatus: 'approved',
          disbursementDate: '2026-09-15',
          preparedBy: 2,
          approvedBy: 1,
          notes: 'Full and Final settlement processed in accordance with employment contract and Pakistan labor laws.'
        }
      ];
      this.set('final_settlements', settlements);
    }
  },

  ensureAssetCatalogData() {
    let categories = this.get('asset_categories');
    if (!categories || !categories.length) {
      categories = [
        { id: 1, name: 'IT Hardware & Compute', code: 'CAT-IT', description: 'Laptops, workstations, servers, monitors, and docks' },
        { id: 2, name: 'Mobile Devices & Telephony', code: 'CAT-MOB', description: 'Smartphones, iPads, SIM cards, and VoIP hardware' },
        { id: 3, name: 'Office Ergonomic Furniture', code: 'CAT-FURN', description: 'Standing desks, ergonomic chairs, and filing units' },
        { id: 4, name: 'Vehicles & Fleet Assets', code: 'CAT-VEH', description: 'Executive pool cars, transport vans, and delivery bikes' }
      ];
      this.set('asset_categories', categories);
    }

    let statuses = this.get('asset_statuses');
    if (!statuses || !statuses.length) {
      statuses = [
        { id: 1, name: 'In Stock / Available', code: 'AVAILABLE', color: '#10b981' },
        { id: 2, name: 'Assigned to Staff', code: 'ASSIGNED', color: '#3b82f6' },
        { id: 3, name: 'In Repair / Maintenance', code: 'MAINTENANCE', color: '#f59e0b' },
        { id: 4, name: 'Decommissioned / Disposed', code: 'RETIRED', color: '#ef4444' }
      ];
      this.set('asset_statuses', statuses);
    }

    let assetList = this.get('assets') || [];
    let assetUpdated = false;
    assetList.forEach(a => {
      if (!a.categoryId) {
        assetUpdated = true;
        if (a.category === 'IT Equipment') { a.categoryId = 1; }
        else if (a.category === 'Mobile') { a.categoryId = 2; }
        else if (a.category === 'Furniture') { a.categoryId = 3; }
        else { a.categoryId = 1; }

        a.statusId = a.status === 'assigned' ? 2 : (a.status === 'maintenance' ? 3 : 1);
        if (!a.serialNo) a.serialNo = `SN-${a.code}-${1000 + a.id}`;
        if (!a.purchaseDate) a.purchaseDate = '2023-01-15';
        if (!a.purchaseCost) a.purchaseCost = a.categoryId === 1 ? 180000 : (a.categoryId === 2 ? 120000 : 35000);
        if (!a.warrantyExpires) a.warrantyExpires = '2026-12-31';
        if (!a.vendor) a.vendor = a.categoryId === 1 ? 'Dell Technologies Direct' : (a.categoryId === 2 ? 'Apple Authorized Reseller' : 'Habitt Office Solutions');
      }
    });
    if (assetUpdated) {
      this.set('assets', assetList);
    }

    let assignments = this.get('asset_assignments');
    if (!assignments || !assignments.length) {
      assignments = [
        { id: 1, assetId: 1, employeeId: 3, assignedDate: '2019-06-15', returnDate: null, conditionAssigned: 'New / Sealed', conditionReturned: null, status: 'active', notes: 'Issued for DevOps & Infrastructure management.' },
        { id: 2, assetId: 2, employeeId: 8, assignedDate: '2023-01-01', returnDate: null, conditionAssigned: 'Good', conditionReturned: null, status: 'active', notes: 'Corporate SIM & phone for regional recruitment coordination.' },
        { id: 3, assetId: 3, employeeId: 4, assignedDate: '2021-02-01', returnDate: null, conditionAssigned: 'Excellent', conditionReturned: null, status: 'active', notes: 'High-performance M-series laptop for frontend & full-stack development.' },
        { id: 4, assetId: 4, employeeId: 1, assignedDate: '2020-01-01', returnDate: null, conditionAssigned: 'Good', conditionReturned: null, status: 'active', notes: 'Ergonomic executive workstation chair.' }
      ];
      this.set('asset_assignments', assignments);
    }

    let maintenances = this.get('asset_maintenances');
    if (!maintenances || !maintenances.length) {
      maintenances = [
        { id: 1, assetId: 1, maintenanceType: 'Hardware Upgrade', provider: 'Dell Authorized Service Center', cost: 18500, scheduledDate: '2025-11-10', completedDate: '2025-11-12', notes: 'NVMe SSD upgraded to 1TB and RAM expanded to 32GB.', status: 'completed' },
        { id: 2, assetId: 5, maintenanceType: 'Toner & Drum Replacement', provider: 'HP Enterprise Support', cost: 12000, scheduledDate: '2026-08-15', completedDate: '2026-08-16', notes: 'Scheduled roller cleaning and high-yield toner cartridge replacement.', status: 'completed' }
      ];
      this.set('asset_maintenances', maintenances);
    }

    let logs = this.get('asset_logs');
    if (!logs || !logs.length) {
      logs = [
        { id: 1, assetId: 1, action: 'assignment', performedBy: 1, notes: 'Asset assigned to Usman Baig', timestamp: '2019-06-15T09:00:00.000Z' },
        { id: 2, assetId: 3, action: 'assignment', performedBy: 1, notes: 'Asset assigned to Fatima Raza', timestamp: '2021-02-01T10:30:00.000Z' },
        { id: 3, assetId: 1, action: 'maintenance', performedBy: 2, notes: 'Asset RAM & SSD upgrade completed', timestamp: '2025-11-12T14:00:00.000Z' }
      ];
      this.set('asset_logs', logs);
    }
  },

  ensureTelemetryData() {
    let notifs = this.get('notifications');
    if (!notifs || !notifs.length) {
      notifs = [
        { id: 1, employeeId: 4, title: 'Travel Request Approved', message: 'Your business travel request TRV-2026-001 to Islamabad has been approved.', type: 'travel', isRead: true, createdAt: '2026-09-08T10:05:00.000Z' },
        { id: 2, employeeId: 9, title: 'Exit Clearance Required', message: 'Please complete departmental clearance checkouts before September 15, 2026.', type: 'exit', isRead: false, createdAt: '2026-09-02T11:00:00.000Z' },
        { id: 3, employeeId: 3, title: 'Asset Maintenance Completed', message: 'Your primary workstation Dell Laptop maintenance has been successfully signed off.', type: 'asset', isRead: true, createdAt: '2025-11-12T15:00:00.000Z' }
      ];
      this.set('notifications', notifs);
    }

    let emails = this.get('email_logs');
    if (!emails || !emails.length) {
      emails = [
        { id: 1, recipient: 'fatima.raza@company.com', subject: 'Travel Request TRV-2026-001 Approved', templateCode: 'TRAVEL_APPROVED', status: 'sent', provider: 'Corporate SMTP / SendGrid', sentAt: '2026-09-08T10:05:00.000Z', errorMessage: null },
        { id: 2, recipient: 'usman.baig@company.com', subject: 'Disciplinary Inquiry Resolution - CASE-2026-001', templateCode: 'DISCIPLINE_NOTICE', status: 'sent', provider: 'Corporate SMTP / SendGrid', sentAt: '2026-09-06T14:30:00.000Z', errorMessage: null },
        { id: 3, recipient: 'tariq.hussain@company.com', subject: 'Exit Clearance Procedures & Checklist', templateCode: 'EXIT_CLEARANCE', status: 'sent', provider: 'Corporate SMTP / SendGrid', sentAt: '2026-09-02T11:00:00.000Z', errorMessage: null }
      ];
      this.set('email_logs', emails);
    }

    let sms = this.get('sms_logs');
    if (!sms || !sms.length) {
      sms = [
        { id: 1, recipientPhone: '+923212345678', message: 'ApexHRM Alert: Monthly payroll generation initiated for August 2026.', provider: 'Telenor Enterprise SMS', status: 'delivered', sentAt: '2026-08-31T17:00:00.000Z', cost: 1.25 },
        { id: 2, recipientPhone: '+923001234567', message: 'ApexHRM Security: 2FA One-Time Passcode is 782190. Valid for 5 minutes.', provider: 'Telenor Enterprise SMS', status: 'delivered', sentAt: '2026-09-09T08:15:00.000Z', cost: 1.25 }
      ];
      this.set('sms_logs', sms);
    }

    let acts = this.get('activity_logs');
    if (!acts || !acts.length) {
      acts = [
        { id: 1, userId: 1, userName: 'Ahmed Khan', userRole: 'superadmin', action: 'CREATE', entityType: 'Organization', entityId: 1, details: 'Initialized enterprise organization Apex Global Enterprises', ipAddress: '192.168.10.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', createdAt: '2026-09-09T08:00:00.000Z' },
        { id: 2, userId: 2, userName: 'Sara Malik', userRole: 'hr_manager', action: 'APPROVE', entityType: 'Resignation', entityId: 1, details: 'Approved resignation request RES-2026-001 for Tariq Hussain', ipAddress: '192.168.10.15', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', createdAt: '2026-09-02T10:30:00.000Z' },
        { id: 3, userId: 1, userName: 'Ahmed Khan', userRole: 'superadmin', action: 'UPDATE', entityType: 'SalaryStructure', entityId: 1, details: 'Updated executive grade compensation allowances', ipAddress: '192.168.10.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', createdAt: '2026-09-08T16:45:00.000Z' }
      ];
      this.set('activity_logs', acts);
    }

    let tokens = this.get('api_tokens');
    if (!tokens || !tokens.length) {
      tokens = [
        { id: 1, name: 'Biometric Attendance Sync Daemon', tokenHash: 'tok_live_bio_9f83a84b12c8e309d', permissions: '["attendance.create", "attendance.view"]', lastUsedAt: '2026-09-09T08:30:00.000Z', expiresAt: '2027-12-31T23:59:59.000Z', isActive: true, createdBy: 1, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 2, name: 'SAP ERP Financials Connector', tokenHash: 'tok_live_erp_72cba012ef44810a', permissions: '["payroll.view", "travel_expenses.view", "expense_settlements.create"]', lastUsedAt: '2026-09-08T22:00:00.000Z', expiresAt: '2027-06-30T23:59:59.000Z', isActive: true, createdBy: 1, createdAt: '2026-02-15T00:00:00.000Z' },
        { id: 3, name: 'Mobile App Gateway Service', tokenHash: 'tok_live_mob_55aa8823190cb47e', permissions: '["employees.view", "leaves.create", "travel_expenses.create", "notifications.view"]', lastUsedAt: '2026-09-09T08:45:00.000Z', expiresAt: '2028-01-01T00:00:00.000Z', isActive: true, createdBy: 1, createdAt: '2026-03-01T00:00:00.000Z' }
      ];
      this.set('api_tokens', tokens);
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

  log(action, module, details, userId, severity = null) {
    const logs = this.get('audit_logs');
    const act = (action || 'INFO').toUpperCase();
    const sev = severity || (['DELETE','RESET','REJECT','TERMINATE'].some(x => act.includes(x)) ? 'CRITICAL' : ['UPDATE','APPROVE','RESTORE','SUBMIT'].some(x => act.includes(x)) ? 'WARNING' : 'INFO');
    const timestamp = new Date().toISOString();
    const id = Date.now() + Math.floor(Math.random() * 100);
    const checksum = `SHA256-${((id * 31 + (userId || 1) * 17) & 0x7fffffff).toString(16).padStart(8, '0').toUpperCase()}`;
    const ip = `192.168.1.${((id % 45) + 10)}`;

    logs.unshift({
      id,
      action: act,
      module: module || 'core',
      details: details || 'Operational action performed',
      userId: userId || 1,
      severity: sev,
      checksum,
      ip,
      timestamp
    });

    if (logs.length > 500) logs.pop();
    this.set('audit_logs', logs);

    // Auto-dispatch matching webhooks if any
    try {
      if (typeof Settings !== 'undefined' && Settings.triggerWebhooks) {
        Settings.triggerWebhooks(module, act, { details, userId, timestamp });
      }
    } catch(e) {}

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
  getOrgName(id) { return DB.find('organizations', id)?.name || '—'; },
  getBusinessUnitName(id) { return DB.find('business_units', id)?.name || '—'; },
  getDivisionName(id) { return DB.find('divisions', id)?.name || '—'; },
  getCountryName(id) { return DB.find('countries', id)?.name || '—'; },
  getStateName(id) { return DB.find('states', id)?.name || '—'; },
  getCityName(id) { return DB.find('cities', id)?.name || '—'; },
  getLocationName(id) { return DB.find('locations', id)?.name || '—'; },
  getAssetCategoryName(id) { return DB.find('asset_categories', id)?.name || '—'; },
  getAssetStatusName(id) { return DB.find('asset_statuses', id)?.name || '—'; },
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
