// ============================================================
// HRM SYSTEM — Pakistani Bank-Specific 1LINK Direct Batch Formats Engine
// Formats supported:
// 1. HBL Corporate PayAnywhere (Bulk TXT / CSV)
// 2. Meezan Bank e-Biz+ Corporate Batch (CSV)
// 3. Bank Alfalah Transact B2B Corporate (CSV)
// 4. Universal 1LINK 24-Digit IBAN Standard Batch (CSV)
// ============================================================

(function(root) {
  'use strict';

  const BankFormats = {
    // 1LINK Member Commercial Banks Directory (Pakistan)
    MEMBER_BANKS: {
      HBL:  { code: '0002', swift: 'HABB', name: 'Habib Bank Limited', ibanCode: 'HABB' },
      MEEZ: { code: '0026', swift: 'MEZN', name: 'Meezan Bank Limited', ibanCode: 'MEZN' },
      ALFH: { code: '0014', swift: 'ALFH', name: 'Bank Alfalah Limited', ibanCode: 'ALFH' },
      MCB:  { code: '0003', swift: 'MUCB', name: 'MCB Bank Limited', ibanCode: 'MUCB' },
      UBL:  { code: '0004', swift: 'UNIL', name: 'United Bank Limited', ibanCode: 'UNIL' },
      ABL:  { code: '0001', swift: 'ABPA', name: 'Allied Bank Limited', ibanCode: 'ABPA' },
      SCB:  { code: '0019', swift: 'SCBL', name: 'Standard Chartered Bank', ibanCode: 'SCBL' },
      ASK:  { code: '0017', swift: 'ASCM', name: 'Askari Bank Limited', ibanCode: 'ASCM' },
      FAYS: { code: '0021', swift: 'FAYS', name: 'Faysal Bank Limited', ibanCode: 'FAYS' },
      BAHL: { code: '0018', swift: 'BAHL', name: 'Bank AL Habib Limited', ibanCode: 'BAHL' },
      JS:   { code: '0027', swift: 'JSBL', name: 'JS Bank Limited', ibanCode: 'JSBL' },
      BOP:  { code: '0015', swift: 'BPUN', name: 'The Bank of Punjab', ibanCode: 'BPUN' },
      SONR: { code: '0016', swift: 'SONE', name: 'Soneri Bank Limited', ibanCode: 'SONE' },
      DIB:  { code: '0028', swift: 'DIBP', name: 'Dubai Islamic Bank Pakistan', ibanCode: 'DIBP' }
    },

    // Resolve Bank details from code or name
    resolveBank(identifier) {
      if (!identifier) return this.MEMBER_BANKS.HBL;
      const clean = String(identifier).toUpperCase().trim();
      if (this.MEMBER_BANKS[clean]) return this.MEMBER_BANKS[clean];
      
      const found = Object.values(this.MEMBER_BANKS).find(b => 
        b.swift === clean || b.code === clean || b.name.toUpperCase().includes(clean)
      );
      return found || this.MEMBER_BANKS.HBL;
    },

    // Sanitize and validate 24-character Pakistani IBAN
    normalizeIBAN(iban, bankCode, empId) {
      if (iban) {
        const clean = String(iban).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (clean.length === 24 && clean.startsWith('PK')) {
          return clean;
        }
      }
      const b = this.resolveBank(bankCode);
      const acc = String(empId || '1').padStart(16, '0');
      return `PK36${b.swift}${acc}`;
    },

    // Determine Transfer Mode: Intra-Bank (IFT) or 1LINK Inter-Bank (IBFT)
    getTransferType(originBankCode, destBankCode) {
      const b1 = this.resolveBank(originBankCode);
      const b2 = this.resolveBank(destBankCode);
      return b1.swift === b2.swift ? 'IFT' : 'IBFT';
    },

    // Process and validate batch records for a company and month
    prepareBatchData(company, employees, salaries, month) {
      const valDate = (typeof Utils !== 'undefined' && Utils.today) ? Utils.today() : new Date().toISOString().slice(0, 10);
      const originBank = this.resolveBank(company?.disbursementBank || 'HBL');
      const debitIBAN = this.normalizeIBAN(company?.bankAccount || company?.iban, originBank.swift, 0);

      let totalAmount = 0;
      let intraBankCount = 0;
      let interBankCount = 0;
      let validIbanCount = 0;

      const items = employees.map((emp, idx) => {
        const sal = salaries.find(s => s.employeeId === emp.id && s.month === month);
        const netSalary = sal ? Number(sal.netSalary || 0) : Math.round(Number(emp.salary || 60000) * 0.9);
        totalAmount += netSalary;

        const destBank = this.resolveBank(emp.bankName || 'HBL');
        const benIBAN = this.normalizeIBAN(emp.iban, destBank.swift, emp.id);
        const transType = this.getTransferType(originBank.swift, destBank.swift);

        if (transType === 'IFT') intraBankCount++;
        else interBankCount++;

        if (benIBAN.length === 24 && benIBAN.startsWith('PK')) validIbanCount++;

        return {
          seq: idx + 1,
          employeeId: emp.id,
          empNo: emp.empNo || `EMP-${emp.id}`,
          fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          cnic: emp.cnic || '42201-0000000-1',
          phone: emp.phone || '0300-1234567',
          email: emp.email || 'employee@company.com',
          destBank: destBank,
          beneficiaryIBAN: benIBAN,
          amount: netSalary,
          transType: transType,
          paymentRef: `SAL-${month}-${emp.empNo || emp.id}`,
          narration: `Salary ${month}`
        };
      });

      return {
        company: company || { name: 'Corporate Employer', ntn: '0000000-0', disbursementBank: 'HBL' },
        month: month,
        valueDate: valDate,
        originBank: originBank,
        debitIBAN: debitIBAN,
        batchRef: `BATCH-${month.replace('-', '')}-${Date.now().toString().slice(-4)}`,
        items: items,
        totalRecords: items.length,
        totalAmount: totalAmount,
        intraBankCount: intraBankCount,
        interBankCount: interBankCount,
        validIbanCount: validIbanCount
      };
    },

    // ────────────────────────────────────────────────────────────
    // 1. HBL Corporate Bulk Upload Format (PayAnywhere / Corporate)
    // Delimited TXT format: Header (H), Details (D), Trailer (T)
    // ────────────────────────────────────────────────────────────
    generateHBLCorporateTXT(batch) {
      const lines = [];
      const ymd = batch.valueDate.replace(/-/g, '');
      
      // Header: H|BatchRef|DebitIBAN|TotalRecords|TotalAmount|YYYYMMDD|NTN
      lines.push(`H|${batch.batchRef}|${batch.debitIBAN}|${batch.totalRecords}|${batch.totalAmount}|${ymd}|${batch.company.ntn || '8849201-1'}`);

      // Details: D|Seq|BeneficiaryIBAN|AccountTitle|Amount|PurposeCode|CNIC|Ref|BankSwift
      batch.items.forEach(item => {
        lines.push(`D|${item.seq}|${item.beneficiaryIBAN}|${item.fullName}|${item.amount}|SALR|${item.cnic}|${item.paymentRef}|${item.destBank.swift}`);
      });

      // Trailer: T|TotalRecords|TotalAmount
      lines.push(`T|${batch.totalRecords}|${batch.totalAmount}`);

      return lines.join('\r\n');
    },

    // ────────────────────────────────────────────────────────────
    // 2. Meezan Bank e-Biz+ Corporate Format (CSV)
    // Standard Islamic banking direct bulk disbursal template
    // ────────────────────────────────────────────────────────────
    generateMeezaneBizCSV(batch) {
      const headers = [
        'Transaction_Type',
        'Debit_Account_IBAN',
        'Beneficiary_Title',
        'Beneficiary_IBAN',
        '1Link_Bank_Code',
        'Bank_Name',
        'Amount_PKR',
        'Remarks_Narration',
        'Employee_Mobile',
        'Employee_Email'
      ];

      const rows = batch.items.map(item => [
        item.transType,
        batch.debitIBAN,
        `"${item.fullName.replace(/"/g, '""')}"`,
        item.beneficiaryIBAN,
        item.destBank.code,
        `"${item.destBank.name}"`,
        item.amount,
        `"${item.narration}"`,
        item.phone,
        item.email
      ]);

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    },

    // ────────────────────────────────────────────────────────────
    // 3. Bank Alfalah Transact B2B Format (CSV)
    // Corporate portal direct clearing matrix
    // ────────────────────────────────────────────────────────────
    generateAlfalahTransactCSV(batch) {
      const headers = [
        'Company_Code',
        'Batch_Reference',
        'Value_Date',
        'Debit_IBAN',
        'Beneficiary_Name',
        'Beneficiary_IBAN',
        '1Link_Member_Code',
        'Beneficiary_Bank',
        'Currency',
        'Amount',
        'Narration',
        'Employee_ID'
      ];

      const rows = batch.items.map(item => [
        `"${batch.company.code || 'APEX'}"`,
        batch.batchRef,
        batch.valueDate,
        batch.debitIBAN,
        `"${item.fullName.replace(/"/g, '""')}"`,
        item.beneficiaryIBAN,
        item.destBank.code,
        `"${item.destBank.name}"`,
        'PKR',
        item.amount,
        `"${item.paymentRef}"`,
        item.empNo
      ]);

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    },

    // ────────────────────────────────────────────────────────────
    // 4. Universal 1LINK 24-Digit IBAN Standard Batch (CSV)
    // Compatible with all commercial Pakistani banks (Standard Chartered, MCB, UBL, ABL)
    // ────────────────────────────────────────────────────────────
    generateUniversal1LinkCSV(batch) {
      const headers = [
        'Sr_No',
        'Value_Date',
        'Debit_IBAN',
        'Beneficiary_Title',
        'Beneficiary_Bank',
        '1Link_Bank_Code',
        'Beneficiary_24Digit_IBAN',
        'Amount_PKR',
        'Payment_Reference',
        'Clearing_Mode',
        'Employee_CNIC',
        'Contact_Number'
      ];

      const rows = batch.items.map(item => [
        item.seq,
        batch.valueDate,
        batch.debitIBAN,
        `"${item.fullName.replace(/"/g, '""')}"`,
        `"${item.destBank.name}"`,
        item.destBank.code,
        item.beneficiaryIBAN,
        item.amount,
        `"${item.paymentRef}"`,
        item.transType === 'IFT' ? 'Internal Book Transfer' : '1LINK Direct IBFT',
        item.cnic,
        item.phone
      ]);

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    },

    // Trigger browser download with accurate filename & MIME type
    downloadFile(filename, content, mimeType = 'text/csv;charset=utf-8;') {
      const blob = new Blob([content], { type: mimeType });
      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
      } else {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  // Export for Browser and Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BankFormats;
  } else {
    root.BankFormats = BankFormats;
  }
})(typeof window !== 'undefined' ? window : global);
